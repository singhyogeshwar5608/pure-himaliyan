export type LanguageInfo = {
  code: string
  native: string
  english: string
}

export const languages: LanguageInfo[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
]

export function getLanguageLabel(code: string): string {
  const lang = languages.find((l) => l.code === code)
  return lang ? `${lang.native} (${lang.english})` : code
}
