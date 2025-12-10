// Mapping logic based on the PRD
const ENG_TO_HEB: Record<string, string> = {
  'q': '/', 'w': "'", 'e': 'ק', 'r': 'ר', 't': 'א', 'y': 'ט', 'u': 'ו', 'i': 'ן', 'o': 'ם', 'p': 'פ',
  'a': 'ש', 's': 'ד', 'd': 'ג', 'f': 'כ', 'g': 'ע', 'h': 'י', 'j': 'ח', 'k': 'ל', 'l': 'ך', ';': 'ף',
  'z': 'ז', 'x': 'ס', 'c': 'ב', 'v': 'ה', 'b': 'נ', 'n': 'מ', 'm': 'צ', ',': 'ת', '.': 'ץ', '/': '.'
};

const HEB_TO_ENG: Record<string, string> = Object.entries(ENG_TO_HEB).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<string, string>);

export const fixLayout = (text: string): string => {
  // Simple heuristic: count Hebrew chars vs English chars
  let hebCount = 0;
  let engCount = 0;

  for (const char of text) {
    if (char >= 'א' && char <= 'ת') hebCount++;
    if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) engCount++;
  }

  // If mostly Hebrew but looks like English (or vice versa), this is a naive check.
  // In a real scenario (per PRD), we check if the result makes linguistic sense.
  // For this demo, we swap based on input mapping availability.
  
  // Try converting to Hebrew
  const toHebrew = text.split('').map(c => ENG_TO_HEB[c.toLowerCase()] || c).join('');
  
  // Try converting to English
  const toEnglish = text.split('').map(c => HEB_TO_ENG[c] || c).join('');

  // Decision logic (Mocking the python algorithm)
  // If input was mostly English chars but meaningless, we return Hebrew.
  if (engCount > hebCount) return toHebrew;
  return toEnglish;
};
