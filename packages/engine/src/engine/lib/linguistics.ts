export function addIndefiniteArticle(name: string) {
  // Skip articles for obvious plurals or uncountables
  const lower = name.toLowerCase();
  if (lower.endsWith('s')) return name; // rough plural check

  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const firstLetter = name.trim().charAt(0).toLowerCase();
  return `${vowels.includes(firstLetter) ? 'an' : 'a'} ${name}`;
}
