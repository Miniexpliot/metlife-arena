export interface LanguageOption {
  code: string;
  flag: string;
  name: string;
}

export const LANGUAGE_OPTIONS: ReadonlyArray<LanguageOption> = [
  { code: 'en', flag: '🇺🇸', name: 'English (US)' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
] as const;
