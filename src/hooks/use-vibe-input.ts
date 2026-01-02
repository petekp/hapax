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
import type { ResolvedPhrase } from "@/lib/resolver";

type Action =
  | { type: "SET_TEXT"; text: string }
  | { type: "WORD_LOADING"; wordId: string; requestId: string }
  | {
      type: "WORD_RESOLVED";
      wordId: string;
      requestId: string;
      variant: FontVariant;
      source: "cache" | "llm";
    }
  | { type: "WORD_ERROR"; wordId: string; requestId: string; message: string }
  | { type: "FONT_LOADED"; wordId: string }
  | {
      type: "SET_PHRASE_GROUP";
      wordIds: string[];
      phraseGroupId: string;
      variant: FontVariant;
      source: "cache" | "llm";
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
          if (word.resolution.status !== "loading") return word;
          if (word.resolution.requestId !== action.requestId) return word;

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
  source: "cache" | "llm";
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
    (wordIds: string[], variant: FontVariant, source: "cache" | "llm" = "llm") => {
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
          .current!(word.token.normalized, controller.signal)
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
  };
}
