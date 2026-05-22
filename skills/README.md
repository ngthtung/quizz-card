# Quizz Card Skills

Custom skills for the Quizz Card flashcard application.

## Available Skills

### extract-lesson

Extracts vocabulary from a Minna no Nihongo lesson URL and saves it to `data/` folder.

**Usage:**
```
/extract-lesson url=https://jls.vnjpclub.com/tu-vung-minna-no-nihongo-bai-5.html lesson_number=5
```

**What it does:**
1. Fetches the lesson page from the URL
2. Extracts vocabulary table (Japanese, Reading, Vietnamese)
3. Formats as markdown
4. Saves to `data/minna-bai-{number}.md`
5. The new lesson will automatically appear in the Import screen

**Example:**
```
/extract-lesson url=https://jls.vnjpclub.com/tu-vung-minna-no-nihongo-bai-6.html lesson_number=6
```

This will create `data/minna-bai-6.md` with all vocabulary from that lesson.

## Adding New Skills

To create a new skill:

1. Create a `.md` file in the `skills/` folder
2. Add frontmatter with `name`, `description`, and `args`
3. Write instructions for Claude Code to follow
4. Skills can use any available tools (WebFetch, Read, Write, Edit, Bash, etc.)

See `extract-lesson.md` as an example.
