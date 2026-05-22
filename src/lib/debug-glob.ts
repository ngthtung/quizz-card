// Debug helper to check what files Vite's glob is actually loading
const lessonFiles = import.meta.glob('../../data/minna-bai-*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

console.log('=== GLOB DEBUG ===');
console.log('Pattern: ../../data/minna-bai-*.md');
console.log('Files found:', Object.keys(lessonFiles));
console.log('File count:', Object.keys(lessonFiles).length);
console.log('==================');

export { lessonFiles };
