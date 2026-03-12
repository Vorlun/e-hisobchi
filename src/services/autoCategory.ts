/**
 * Auto-categorization: suggests category from transaction description using keyword rules.
 * Used when user types a description; category dropdown can be pre-filled (user can override).
 */

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    'restaurant', 'cafe', 'burger', 'pizza', 'kfc', 'mcdonalds', 'mcdonald', 'dinner', 'lunch',
    'breakfast', 'food', 'grocery', 'supermarket', 'ovqat', 'taom', 'oshxona',
  ],
  transport: [
    'taxi', 'uber', 'yandex', 'metro', 'bus', 'fuel', 'gas', 'parking', 'toll',
    'transport', 'avto', 'mashina', 'benzin', 'yo\'l',
  ],
  shopping: [
    'market', 'store', 'mall', 'shop', 'amazon', 'clothes', 'xarid', 'sotuv',
    'savdo', 'do\'kon', 'bozor',
  ],
  utilities: [
    'electricity', 'gas', 'internet', 'water', 'wifi', 'bill', 'utility', 'komunal',
    'elektr', 'suv', 'gaz', 'kommunal',
  ],
  salary: [
    'salary', 'payroll', 'income', 'payment', 'maosh', 'tushdi', 'ish haqi',
  ],
  health: [
    'pharmacy', 'doctor', 'hospital', 'medicine', 'dori', 'klinika', 'shifokor',
  ],
  entertainment: [
    'cinema', 'movie', 'netflix', 'game', 'entertainment', 'kino', 'o\'yin',
  ],
  education: [
    'school', 'university', 'course', 'book', 'education', 'maktab', 'universitet', 'kitob',
  ],
  other: [],
};

/** Suggestion result: slug (key in CATEGORY_KEYWORDS) or null if no match. */
export type SuggestedSlug = keyof typeof CATEGORY_KEYWORDS | null;

/**
 * Suggests a category slug from description using keyword rules.
 * Returns the first matching category key, or null.
 */
export function suggestCategory(description: string): SuggestedSlug {
  const lower = description.trim().toLowerCase();
  if (!lower) return null;

  for (const category of Object.keys(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords.some((k) => lower.includes(k))) {
      return category as SuggestedSlug;
    }
  }
  return null;
}

/**
 * Find best-matching category id from options for a suggested slug.
 * Matches by option label (name) containing the slug or common display names.
 */
const SLUG_DISPLAY_NAMES: Record<string, string[]> = {
  food: ['food', 'ovqat', 'taom', 'groceries', 'restaurant'],
  transport: ['transport', 'transportation', 'avto', 'yo\'l', 'fuel'],
  shopping: ['shopping', 'xarid', 'savdo', 'market', 'store'],
  utilities: ['utilities', 'bills', 'komunal', 'elektr', 'suv', 'gaz'],
  salary: ['salary', 'income', 'maosh', 'ish haqi', 'payroll'],
  health: ['health', 'pharmacy', 'dori', 'medicine'],
  entertainment: ['entertainment', 'kino', 'o\'yin', 'leisure'],
  education: ['education', 'maktab', 'kitob', 'course'],
};

export function getCategoryIdForSlug(
  slug: string,
  options: { value: string; label: string }[]
): string | null {
  const lowerSlug = slug.toLowerCase();
  const displayNames = SLUG_DISPLAY_NAMES[lowerSlug];
  if (!displayNames) {
    const byLabel = options.find((o) => o.label.toLowerCase().includes(lowerSlug));
    return byLabel?.value ?? null;
  }
  for (const name of displayNames) {
    const option = options.find((o) => o.label.toLowerCase().includes(name));
    if (option) return option.value;
  }
  const byLabel = options.find((o) => o.label.toLowerCase().includes(lowerSlug));
  return byLabel?.value ?? null;
}
