import { db } from '@/db/db';

// Debug helper to check what's in the database
export async function debugDatabase() {
  console.log('=== DATABASE DEBUG ===');

  const languages = await db.languages.toArray();
  console.log('Languages:', languages.length);
  languages.forEach(l => console.log(`  - ${l.name} (${l.id})`));

  const cards = await db.flashcards.toArray();
  console.log('Total cards:', cards.length);

  // Group by tags
  const tagCounts = new Map<string, number>();
  cards.forEach(card => {
    card.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  console.log('Cards by tag:');
  Array.from(tagCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([tag, count]) => {
      console.log(`  - ${tag}: ${count} cards`);
    });

  console.log('===================');

  return { languages, cards, tagCounts };
}

// Run it immediately when imported
debugDatabase();
