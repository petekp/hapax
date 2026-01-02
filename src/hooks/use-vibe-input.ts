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
      const phraseGroupId = action.phraseGroupId;
      return {
        ...state,
        words: state.words.map((word) =>
          action.wordIds.includes(word.token.id)
            ? {
                ...word,
                phraseGroupId,
                fontLoaded: false,
                resolution: {
                  status: "resolved",
                  variant: action.variant,
                  source: "cache",
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

export type WordResolver = (word: string) => Promise<{
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
  const phraseCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPhraseCheckRef = useRef<string>("");

  const setText = useCallback((text: string) => {
    dispatch({ type: "SET_TEXT", text });
  }, []);

  const markFontLoaded = useCallback((wordId: string) => {
    dispatch({ type: "FONT_LOADED", wordId });
  }, []);

  const setPhraseGroup = useCallback(
    (wordIds: string[], variant: FontVariant) => {
      dispatch({
        type: "SET_PHRASE_GROUP",
        wordIds,
        phraseGroupId: nanoid(),
        variant,
      });
    },
    []
  );

  useEffect(() => {
    if (prevTextRef.current === state.rawText) return;
    prevTextRef.current = state.rawText;

    const pendingWords = state.words.filter(
      (word) => word.resolution.status === "pending"
    );

    if (pendingWords.length === 0 || !resolverRef.current) return;

    for (const word of pendingWords) {
      const requestId = nanoid();

      dispatch({
        type: "WORD_LOADING",
        wordId: word.token.id,
        requestId,
      });

      resolverRef
        .current(word.token.normalized)
        .then((result) => {
          dispatch({
            type: "WORD_RESOLVED",
            wordId: word.token.id,
            requestId,
            variant: result.variant,
            source: result.source,
          });
        })
        .catch((error) => {
          dispatch({
            type: "WORD_ERROR",
            wordId: word.token.id,
            requestId,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        });
    }
  }, [state.rawText, state.words]);

  useEffect(() => {
    if (!phraseResolverRef.current) return;
    if (state.words.length < 2) return;

    const allResolved = state.words.every(
      (w) => w.resolution.status === "resolved" || w.resolution.status === "error"
    );
    if (!allResolved) return;

    const wordsKey = state.words.map((w) => w.token.normalized).join("|");
    if (wordsKey === lastPhraseCheckRef.current) return;

    if (phraseCheckTimeoutRef.current) {
      clearTimeout(phraseCheckTimeoutRef.current);
    }

    phraseCheckTimeoutRef.current = setTimeout(() => {
      lastPhraseCheckRef.current = wordsKey;

      const words = state.words.map((w) => w.token.normalized);

      phraseResolverRef.current!(words).then((result) => {
        for (const phrase of result.phrases) {
          const wordIds = state.words
            .slice(phrase.startIndex, phrase.endIndex + 1)
            .map((w) => w.token.id);

          dispatch({
            type: "SET_PHRASE_GROUP",
            wordIds,
            phraseGroupId: nanoid(),
            variant: phrase.variant,
          });
        }
      });
    }, 200);

    return () => {
      if (phraseCheckTimeoutRef.current) {
        clearTimeout(phraseCheckTimeoutRef.current);
      }
    };
  }, [state.words]);

  return {
    state,
    setText,
    markFontLoaded,
    setPhraseGroup,
  };
}
