import { listLessons } from './markdownLessons';

export function debugLessons() {
  const lessons = listLessons();
  console.log('=== DEBUG LESSONS ===');
  console.log('Total lessons found:', lessons.length);
  lessons.forEach(l => {
    console.log(`- ${l.title}: ${l.rows.length} cards`);
  });
  return lessons;
}
