import type { Flashcard, Language } from "../types";

const langHints: Record<string, string> = {
    japanese: "ja-JP",
    english: "en-US",
    vietnamese: "vi-VN",
    korean: "ko-KR",
    chinese: "zh-CN",
    spanish: "es-ES",
    french: "fr-FR",
    german: "de-DE",
};

export function speak(text: string, languageName?: string) {
    if (!text || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (languageName) {
        const code = langHints[languageName.toLowerCase()];
        if (code) u.lang = code;
    }
    u.rate = 0.3;
    synth.speak(u);
}

export const speechSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

const KANA_RE = /[぀-ゟ゠-ヿ]/;
const KANJI_RE = /[一-鿿]/;

// For Japanese cards, TTS mispronounces kanji. Prefer a kana field when the
// main text contains kanji.
export function pronunciationFor(
    card: Pick<Flashcard, "mainText" | "variant1" | "variant2" | "variant3">,
    language?: Pick<Language, "name">,
): string | undefined {
    const isJa = language?.name?.toLowerCase() === "japanese";
    if (!isJa) return undefined;
    if (!card.mainText || !KANJI_RE.test(card.mainText)) return undefined;
    const candidates = [card.variant2, card.variant3, card.variant1].filter(
        (v): v is string => Boolean(v),
    );
    return candidates.find((v) => KANA_RE.test(v));
}
