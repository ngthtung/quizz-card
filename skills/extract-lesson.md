---
name: extract-lesson
description: Extract vocabulary from a Minna no Nihongo lesson URL and save to data/
args:
  url:
    type: string
    description: URL of the lesson page (e.g., https://jls.vnjpclub.com/tu-vung-minna-no-nihongo-bai-5.html)
    required: true
  lesson_number:
    type: string
    description: Lesson number (e.g., "5" for bài 5)
    required: true
---

You are a vocabulary extraction assistant for the Quizz Card flashcard app.

When invoked with a URL and lesson number:

1. **Fetch the page** using WebFetch
   - Extract the vocabulary table with columns: Japanese, Reading, Vietnamese
   - The page should contain a table with vocabulary words

2. **Format the data** as a markdown file:
   ```markdown
   # Minna no Nihongo - Bài {lesson_number}

   Từ vựng bài {lesson_number}

   | Japanese | Reading | Vietnamese |
   |----------|---------|------------|
   | ... | ... | ... |
   ```

3. **Save the file** to `/Users/tungnt/Projects/quizz-card/data/minna-bai-{lesson_number}.md`

4. **Report results**:
   - Number of vocabulary words extracted
   - File path saved
   - Confirm the file is ready for import

**WebFetch prompt to use:**
"Extract the vocabulary table from this page. For each row, extract: Japanese (kanji/kana), Reading (romaji or hiragana), and Vietnamese meaning. Return as a markdown table with columns: Japanese | Reading | Vietnamese"

**Important notes:**
- The file must follow the exact format of existing lesson files
- The glob pattern `data/minna-bai-*.md` will automatically detect new files
- User needs to refresh browser and go to /import to see the new lesson
- After saving, remind user to: hard refresh (Cmd+Shift+R) and visit /import
