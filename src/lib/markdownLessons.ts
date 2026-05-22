import type { ImportRow } from "./import";

const lessonFiles = import.meta.glob("../../data/minna-bai-*.md", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

// Debug: Log immediately when module loads
console.log("=== markdownLessons.ts module load ===");
console.log("Glob pattern: ../../data/minna-bai-*.md");
console.log("Files detected by glob:", Object.keys(lessonFiles));
console.log("Count:", Object.keys(lessonFiles).length);
console.log("======================================");

export type Lesson = {
    id: string;
    title: string;
    rows: ImportRow[];
};

export function listLessons(): Lesson[] {
    console.log("listLessons: Found files:", Object.keys(lessonFiles));
    const lessons: Lesson[] = [];
    for (const [path, raw] of Object.entries(lessonFiles)) {
        const match = path.match(/minna-bai-(\d+)\.md$/);
        if (!match) continue;
        const num = match[1];
        const id = `minna-bai-${num}`;
        const title = `Minna Bài ${parseInt(num, 10)}`;
        const rows = parseLesson(raw, id);
        console.log(`Parsed ${title}: ${rows.length} rows`);
        lessons.push({ id, title, rows });
    }
    console.log("listLessons: Total lessons:", lessons.length);
    return lessons.sort((a, b) => a.id.localeCompare(b.id));
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

        rows.push({
            language: "Japanese",
            mainText: japanese,
            variant1: reading,
            variant2: "",
            variant3: "",
            meaning: vietnamese,
            tags: [lessonTitle],
        });
    }

    return rows;
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
