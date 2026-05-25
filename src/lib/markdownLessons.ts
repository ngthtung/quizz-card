import type { ImportRow, Lesson } from "../types";

const lessonFiles = import.meta.glob("../../data/minna-bai-*.md", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

export function listLessons(): Lesson[] {
    const lessons: Array<Lesson & { _num: number }> = [];
    for (const [path, raw] of Object.entries(lessonFiles)) {
        const match = path.match(/minna-bai-(\d+)\.md$/);
        if (!match) continue;
        const num = parseInt(match[1], 10);
        const id = `minna-bai-${match[1]}`;
        const title = `Minna Bài ${num}`;
        const rows = parseLesson(raw, id);
        lessons.push({ id, title, rows, _num: num });
    }
    return lessons
        .sort((a, b) => a._num - b._num)
        .map(({ _num, ...l }) => l);
}

function parseLesson(markdown: string, lessonTitle: string): ImportRow[] {
    const rows: ImportRow[] = [];
    const lines = markdown.split("\n");
    let inTable = false;
    let headers: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("|")) {
            inTable = false;
            headers = [];
            continue;
        }

        const cells = splitRow(trimmed);
        if (cells.length === 0) continue;

        if (!inTable) {
            headers = cells.map((c) => c.toLowerCase());
            inTable = true;
            continue;
        }

        if (cells.every((c) => /^-+$/.test(c.trim()))) continue;

        const get = (name: string) => {
            const idx = headers.indexOf(name);
            return idx >= 0 ? (cells[idx] ?? "").trim() : "";
        };

        const japanese = get("japanese");
        const reading = get("reading");
        const vietnamese = get("vietnamese");
        if (!japanese && !reading && !vietnamese) continue;

        const { mainText, variant2, variant3 } = routeJapaneseField(japanese);

        rows.push({
            language: "Japanese",
            mainText,
            variant1: reading,
            variant2,
            variant3,
            meaning: vietnamese,
            tags: [lessonTitle],
        });
    }

    return rows;
}

const HIRAGANA_RE = /[぀-ゟ]/;
const KATAKANA_RE = /[゠-ヿ]/;
const KANJI_RE = /[一-鿿]/;

// Loanwords like エスカレーター have no hiragana form; native words like へや
// have no kanji form. Route them so the displayed label matches the script
// (Hiragana / Katakana) instead of mislabeling everything as "Kanji".
function routeJapaneseField(japanese: string): {
    mainText: string;
    variant2: string;
    variant3: string;
} {
    if (!japanese) return { mainText: "", variant2: "", variant3: "" };
    const hasKanji = KANJI_RE.test(japanese);
    if (hasKanji) {
        return { mainText: japanese, variant2: "", variant3: "" };
    }
    const hasKatakana = KATAKANA_RE.test(japanese);
    const hasHiragana = HIRAGANA_RE.test(japanese);
    if (hasKatakana && !hasHiragana) {
        return { mainText: "", variant2: "", variant3: japanese };
    }
    if (hasHiragana && !hasKatakana) {
        return { mainText: "", variant2: japanese, variant3: "" };
    }
    return { mainText: japanese, variant2: "", variant3: "" };
}

function splitRow(line: string): string[] {
    const inner = line.replace(/^\|/, "").replace(/\|\s*$/, "");
    const out: string[] = [];
    let current = "";
    let i = 0;
    while (i < inner.length) {
        const ch = inner[i];
        if (ch === "\\" && i + 1 < inner.length) {
            current += inner[i + 1];
            i += 2;
            continue;
        }
        if (ch === "|") {
            out.push(current);
            current = "";
            i += 1;
            continue;
        }
        current += ch;
        i += 1;
    }
    out.push(current);
    return out.map((c) => c.trim());
}
