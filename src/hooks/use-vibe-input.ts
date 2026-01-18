import { useReducer, useCallback, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import type {
  InputState,
  WordState,
  WordResolution,
  FontVariant,
} from "@/lib/schemas";
import {
  tokenize,
  reconcileWords,
  createInitialWordState,
} from "@/lib/tokenize";
import { checkWordCache, type ResolvedPhrase } from "@/lib/resolver";

type Action =
  | { type: "SET_TEXT"; text: string }
  | { type: "WORD_LOADING"; wordId: string; requestId: string }
  | {
      type: "WORD_RESOLVED";
      wordId: string;
      requestId: string;
      variant: FontVariant;
      source: "cache" | "llm" | "vetted";
    }
  | { type: "WORD_ERROR"; wordId: string; requestId: string; message: string }
  | { type: "FONT_LOADED"; wordId: string }
  | {
      type: "SET_PHRASE_GROUP";
      wordIds: string[];
      phraseGroupId: string;
      variant: FontVariant;
      source: "cache" | "llm" | "vetted";
    }
  | {
      type: "UPDATE_VARIANT";
      wordId: string;
      variant: FontVariant;
    }
  | {
      type: "SET_LOADING";
      wordId: string;
    }
  | {
      type: "SET_PHRASE_LOADING";
      wordIds: string[];
    }
  | {
      type: "UPDATE_PHRASE_VARIANT";
      wordIds: string[];
      variant: FontVariant;
    };

function reducer(state: InputState, action: Action): InputState {
  switch (action.type) {
    case "SET_TEXT": {
      const newTokens = tokenize(action.text);
      const reconciledWords = reconcileWords(state.words, newTokens);
      return {
        rawText: action.text,
        words: reconciledWords,
      };
    }

    case "WORD_LOADING": {
      return {
        ...state,
        words: state.words.map((word) =>
          word.token.id === action.wordId
            ? {
                ...word,
                resolution: { status: "loading", requestId: action.requestId },
              }
            : word
        ),
      };
    }

    case "WORD_RESOLVED": {
      return {
        ...state,
        words: state.words.map((word) => {
          if (word.token.id !== action.wordId) return word;

          // Instant cache bypasses loading state
          if (action.requestId === "instant-cache") {
            if (word.resolution.status !== "pending") return word;
          } else {
            if (word.resolution.status !== "loading") return word;
            if (word.resolution.requestId !== action.requestId) return word;
          }

          return {
            ...word,
            resolution: {
              status: "resolved",
              variant: action.variant,
              source: action.source,
            },
          };
        }),
      };
    }

    case "WORD_ERROR": {
      return {
        ...state,
        words: state.words.map((word) => {
          if (word.token.id !== action.wordId) return word;
          if (word.resolution.status !== "loading") return word;
          if (word.resolution.requestId !== action.requestId) return word;

          return {
            ...word,
            resolution: {
              status: "error",
              message: action.message,
            },
          };
        }),
      };
    }

    case "FONT_LOADED": {
      return {
        ...state,
        words: state.words.map((word) =>
          word.token.id === action.wordId ? { ...word, fontLoaded: true } : word
        ),
      };
    }

    case "SET_PHRASE_GROUP": {
      return {
        ...state,
        words: state.words.map((word) =>
          action.wordIds.includes(word.token.id)
            ? {
                ...word,
                phraseGroupId: action.phraseGroupId,
                fontLoaded: false,
                resolution: {
                  status: "resolved",
                  variant: action.variant,
                  source: action.source,
                },
              }
            : word
        ),
      };
    }

    case "UPDATE_VARIANT": {
      return {
        ...state,
        words: state.words.map((word) =>
          word.token.id === action.wordId
            ? {
                ...word,
                fontLoaded: false,
                resolution: {
                  status: "resolved",
                  variant: action.variant,
                  source: "llm" as const,
                },
              }
            : word
        ),
      };
    }

    case "SET_LOADING": {
      return {
        ...state,
        words: state.words.map((word) =>
          word.token.id === action.wordId
            ? {
                ...word,
                fontLoaded: false,
                resolution: {
                  status: "loading",
                  requestId: "regenerating",
                },
              }
            : word
        ),
      };
    }

    case "SET_PHRASE_LOADING": {
      const wordIdSet = new Set(action.wordIds);
      return {
        ...state,
        words: state.words.map((word) =>
          wordIdSet.has(word.token.id)
            ? {
                ...word,
                fontLoaded: false,
                resolution: {
                  status: "loading",
                  requestId: "regenerating-phrase",
                },
              }
            : word
        ),
      };
    }

    case "UPDATE_PHRASE_VARIANT": {
      const wordIdSet = new Set(action.wordIds);
      return {
        ...state,
        words: state.words.map((word) =>
          wordIdSet.has(word.token.id)
            ? {
                ...word,
                fontLoaded: false,
                resolution: {
                  status: "resolved",
                  variant: action.variant,
                  source: "llm" as const,
                },
              }
            : word
        ),
      };
    }

    default:
      return state;
  }
}

function createInitialState(initialText: string = ""): InputState {
  const tokens = tokenize(initialText);
  return {
    rawText: initialText,
    words: tokens.map(createInitialWordState),
  };
}

export type WordResolver = (
  word: string,
  signal?: AbortSignal
) => Promise<{
  variant: FontVariant;
  source: "cache" | "llm" | "vetted";
}>;

export type PhraseResolver = (words: string[]) => Promise<{
  phrases: ResolvedPhrase[];
}>;

interface UseVibeInputOptions {
  initialText?: string;
  resolver?: WordResolver;
  phraseResolver?: PhraseResolver;
}

export function useVibeInput(options: UseVibeInputOptions = {}) {
  const { initialText = "", resolver, phraseResolver } = options;
  const [state, dispatch] = useReducer(
    reducer,
    initialText,
    createInitialState
  );
  const prevTextRef = useRef(state.rawText);
  const resolverRef = useRef(resolver);
  resolverRef.current = resolver;
  const phraseResolverRef = useRef(phraseResolver);
  phraseResolverRef.current = phraseResolver;
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const resolveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolutionGenRef = useRef(0);

  const setText = useCallback((text: string) => {
    dispatch({ type: "SET_TEXT", text });
  }, []);

  const markFontLoaded = useCallback((wordId: string) => {
    dispatch({ type: "FONT_LOADED", wordId });
  }, []);

  const setPhraseGroup = useCallback(
    (wordIds: string[], variant: FontVariant, source: "cache" | "llm" | "vetted" = "llm") => {
      dispatch({
        type: "SET_PHRASE_GROUP",
        wordIds,
        phraseGroupId: nanoid(),
        variant,
        source,
      });
    },
    []
  );

  const updateVariant = useCallback(
    (wordId: string, variant: FontVariant) => {
      dispatch({
        type: "UPDATE_VARIANT",
        wordId,
        variant,
      });
    },
    []
  );

  const setWordLoading = useCallback(
    (wordId: string) => {
      dispatch({
        type: "SET_LOADING",
        wordId,
      });
    },
    []
  );

  const setPhraseLoading = useCallback(
    (wordIds: string[]) => {
      dispatch({
        type: "SET_PHRASE_LOADING",
        wordIds,
      });
    },
    []
  );

  const updatePhraseVariant = useCallback(
    (wordIds: string[], variant: FontVariant) => {
      dispatch({
        type: "UPDATE_PHRASE_VARIANT",
        wordIds,
        variant,
      });
    },
    []
  );

  useEffect(() => {
    if (prevTextRef.current === state.rawText) return;
    prevTextRef.current = state.rawText;

    const currentWordIds = new Set(state.words.map((w) => w.token.id));
    for (const [wordId, controller] of abortControllersRef.current) {
      if (!currentWordIds.has(wordId)) {
        controller.abort();
        abortControllersRef.current.delete(wordId);
      }
    }

    if (resolveTimeoutRef.current) {
      clearTimeout(resolveTimeoutRef.current);
    }

    const pendingWords = state.words.filter(
      (word) => word.resolution.status === "pending"
    );

    if (pendingWords.length === 0 || !resolverRef.current) return;

    // Phase 0: Immediately apply client-cached results (no debounce)
    const uncachedWords: typeof pendingWords = [];
    for (const word of pendingWords) {
      const cached = checkWordCache(word.token.raw);
      if (cached) {
        console.log(`[apply] Instant cache: "${word.token.raw}" → ${cached.family} ${cached.weight}`);
        dispatch({
          type: "WORD_RESOLVED",
          wordId: word.token.id,
          requestId: "instant-cache",
          variant: cached,
          source: "cache",
        });
      } else {
        uncachedWords.push(word);
      }
    }

    // If all words were cached, we're done
    if (uncachedWords.length === 0) return;

    resolutionGenRef.current += 1;
    const thisGeneration = resolutionGenRef.current;
    const capturedWords = state.words;

    resolveTimeoutRef.current = setTimeout(async () => {
      const wordsInPhrases = new Set<string>();
      const pendingWordIds = new Set(
        capturedWords
          .filter((w) => w.resolution.status === "pending")
          .map((w) => w.token.id)
      );

      // Phase 1: Phrase detection (runs first, only for 2+ words)
      if (phraseResolverRef.current && capturedWords.length >= 2) {
        try {
          const wordStrings = capturedWords.map((w) => w.token.normalized);
          const result = await phraseResolverRef.current(wordStrings);

          // Check if stale BEFORE processing results
          if (resolutionGenRef.current !== thisGeneration) {
            console.log("[use-vibe-input] Stale phrase detection, discarding");
            return;
          }

          for (const phrase of result.phrases) {
            const phraseWordIds = capturedWords
              .slice(phrase.startIndex, phrase.endIndex + 1)
              .map((w) => w.token.id);

            // Only process phrase if at least one word is pending
            const hasPendingWord = phraseWordIds.some((id) =>
              pendingWordIds.has(id)
            );
            if (!hasPendingWord) continue;

            const phraseText = phrase.words.join(" ");
            console.log(`[apply] Phrase "${phraseText}" → ${phrase.variant.family} ${phrase.variant.weight} (${phrase.source})`);

            phraseWordIds.forEach((id) => wordsInPhrases.add(id));

            dispatch({
              type: "SET_PHRASE_GROUP",
              wordIds: phraseWordIds,
              phraseGroupId: nanoid(),
              variant: phrase.variant,
              source: phrase.source,
            });
          }
        } catch (error) {
          console.error("Phrase detection failed:", error);
        }
      }

      // Check generation again after phrase detection
      if (resolutionGenRef.current !== thisGeneration) {
        console.log("[use-vibe-input] Stale after phrase detection, discarding");
        return;
      }

      // Phase 2: Resolve non-phrase words individually
      const wordsToResolve = capturedWords.filter(
        (w) =>
          w.resolution.status === "pending" && !wordsInPhrases.has(w.token.id)
      );

      if (wordsToResolve.length > 0) {
        console.log(`[apply] Resolving ${wordsToResolve.length} individual word(s): ${wordsToResolve.map(w => `"${w.token.raw}"`).join(", ")}`);
      }

      for (const word of wordsToResolve) {
        const requestId = nanoid();
        const controller = new AbortController();
        abortControllersRef.current.set(word.token.id, controller);

        dispatch({
          type: "WORD_LOADING",
          wordId: word.token.id,
          requestId,
        });

        // Note: We do NOT check generation in the callbacks below.
        // The reducer's requestId check handles stale results.
        // Generation checks would incorrectly discard valid results
        // when user types more words while a fetch is in progress.
        resolverRef
          .current!(word.token.raw, controller.signal)
          .then((result) => {
            abortControllersRef.current.delete(word.token.id);
            dispatch({
              type: "WORD_RESOLVED",
              wordId: word.token.id,
              requestId,
              variant: result.variant,
              source: result.source,
            });
          })
          .catch((error) => {
            abortControllersRef.current.delete(word.token.id);
            if (error instanceof Error && error.name === "AbortError") {
              return;
            }
            dispatch({
              type: "WORD_ERROR",
              wordId: word.token.id,
              requestId,
              message: error instanceof Error ? error.message : "Unknown error",
            });
          });
      }
    }, 300);

    return () => {
      if (resolveTimeoutRef.current) {
        clearTimeout(resolveTimeoutRef.current);
      }
    };
  }, [state.rawText, state.words]);

  return {
    state,
    setText,
    markFontLoaded,
    setPhraseGroup,
    updateVariant,
    setWordLoading,
    setPhraseLoading,
    updatePhraseVariant,
  };
}
