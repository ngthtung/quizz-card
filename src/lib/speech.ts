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

// Voice quality varies wildly across platforms. For each BCP-47 lang code we
// rank known-good native voices first, then fall back to anything matching the
// language. "Google 日本語" (Chrome) and "Kyoko" (macOS/iOS) sound far more
// natural than the generic "Microsoft … Online" or eSpeak fallbacks.
const VOICE_PREFERENCES: Record<string, string[]> = {
    "ja-JP": ["Google 日本語", "Kyoko", "Otoya", "O-ren", "Hattori"],
    "en-US": ["Google US English", "Samantha", "Alex"],
    "vi-VN": ["Google Tiếng Việt", "Linh"],
    "ko-KR": ["Google 한국의", "Yuna"],
    "zh-CN": ["Google 普通话(中国大陆)", "Tingting", "Meijia"],
};

function pickVoice(
    voices: SpeechSynthesisVoice[],
    lang: string,
): SpeechSynthesisVoice | undefined {
    const prefs = VOICE_PREFERENCES[lang] ?? [];
    for (const name of prefs) {
        const match = voices.find((v) => v.name === name);
        if (match) return match;
    }
    // Prefer local (offline) voices — they're usually the OS-native ones.
    const langMatches = voices.filter((v) => v.lang === lang);
    const local = langMatches.find((v) => v.localService);
    if (local) return local;
    if (langMatches.length > 0) return langMatches[0];
    const prefix = lang.split("-")[0];
    return voices.find((v) => v.lang.startsWith(prefix + "-"));
}

function getVoicesAsync(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
    const initial = synth.getVoices();
    if (initial.length > 0) return Promise.resolve(initial);
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(synth.getVoices()), 500);
        synth.addEventListener(
            "voiceschanged",
            () => {
                clearTimeout(timeout);
                resolve(synth.getVoices());
            },
            { once: true },
        );
    });
}

export async function speak(text: string, languageName?: string) {
    if (!text || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (languageName) {
        const code = langHints[languageName.toLowerCase()];
        if (code) {
            u.lang = code;
            const voices = await getVoicesAsync(synth);
            const voice = pickVoice(voices, code);
            if (voice) u.voice = voice;
        }
    }
    u.rate = 0.9;
    u.pitch = 1.0;
    synth.speak(u);
}

export const speechSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

export function cleanForSpeech(text: string): string {
    return text
        .replace(/[～〜~]/g, "")
        .replace(/[［\[（(][^］\]）)]*[］\]）)]/g, "")
        .trim();
}

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
