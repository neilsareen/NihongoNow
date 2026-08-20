"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A thin React wrapper over the Web Speech API's recogniser.
//
// The API is unevenly implemented: Chrome and Safari ship it behind the
// `webkit` prefix, Firefox ships nothing at all, and every embedded WebView is
// its own coin flip. Nothing here throws when it is missing — `supported` is
// false and the caller falls back to self-grading, the same way the app already
// falls back when speech *synthesis* is absent.

// Declared locally rather than relying on lib.dom: the prefixed constructor is
// not in every TypeScript DOM lib, and this module must compile either way.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechErrorKind = "denied" | "no-speech" | "network" | "unknown";

const ERROR_MESSAGE: Record<SpeechErrorKind, string> = {
  denied: "Microphone access is blocked. Allow it in your browser settings to speak your answers.",
  "no-speech": "Didn't catch that — try again a little louder.",
  network: "Speech recognition needs a connection right now. Check your network and try again.",
  unknown: "Something went wrong with the microphone. Try again.",
};

export interface SpeechError {
  kind: SpeechErrorKind;
  message: string;
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  /** Every alternative the recogniser offers, best-first, once it settles. */
  onResult: (transcripts: string[]) => void;
  /** Safety net for recognisers that never fire `onend` on silence. */
  maxListeningMs?: number;
}

export function useSpeechRecognition({
  lang = "ja-JP",
  onResult,
  maxListeningMs = 8000,
}: UseSpeechRecognitionOptions) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<SpeechError | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Kept in a ref so a re-rendered callback never leaves the live recogniser
  // reporting into a stale closure.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  // Whether this run produced anything: `onend` fires for both a clean result
  // and a silent timeout, and only the latter deserves a nudge.
  const gotResultRef = useRef(false);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    recognitionRef.current?.stop();
  }, [clearTimer]);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }

    // A recogniser that hears its own playback grades the app, not the learner.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    recognitionRef.current?.abort();
    setError(null);
    setInterim("");
    gotResultRef.current = false;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    // The reading being drilled is often not the recogniser's own first guess.
    recognition.maxAlternatives = 5;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) {
          setInterim(result[0]?.transcript ?? "");
          continue;
        }
        const alternatives: string[] = [];
        for (let j = 0; j < result.length; j++) {
          const transcript = result[j]?.transcript;
          if (transcript) alternatives.push(transcript);
        }
        if (alternatives.length > 0) {
          gotResultRef.current = true;
          setInterim("");
          onResultRef.current(alternatives);
        }
      }
    };

    recognition.onerror = (event) => {
      const raw = event.error;
      const kind: SpeechErrorKind =
        raw === "not-allowed" || raw === "service-not-allowed"
          ? "denied"
          : raw === "no-speech"
            ? "no-speech"
            : raw === "network"
              ? "network"
              : "unknown";
      // An aborted run is this hook tearing down, not a failure to report.
      if (raw === "aborted") return;
      gotResultRef.current = true;
      setError({ kind, message: ERROR_MESSAGE[kind] });
    };

    recognition.onend = () => {
      clearTimer();
      setListening(false);
      setInterim("");
      if (!gotResultRef.current) {
        setError({ kind: "no-speech", message: ERROR_MESSAGE["no-speech"] });
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
      clearTimer();
      timeoutRef.current = setTimeout(() => recognition.stop(), maxListeningMs);
    } catch {
      // start() throws if a previous run has not fully released the mic.
      setListening(false);
      setError({ kind: "unknown", message: ERROR_MESSAGE.unknown });
    }
  }, [lang, maxListeningMs, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }
    };
  }, [clearTimer]);

  const reset = useCallback(() => {
    setError(null);
    setInterim("");
  }, []);

  return { supported, listening, interim, error, start, stop, reset };
}
