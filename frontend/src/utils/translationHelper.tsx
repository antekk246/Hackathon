// src/utils/translationHelper.ts
import i18n from 'i18next'; // Zwróć uwagę, by importować z Twojej konfiguracji i18n

/**
 * Rozdziela string z backendu w formacie "Polski&Angielski"
 * w zależności od aktualnego języka w aplikacji.
 */
export const parseBackendTranslation = (text: string | undefined): string => {
  if (!text) return '';

  // Jeśli tekst zawiera separator "|"
  if (text.includes('|')) {
    const parts = text.split('|');
    
    // Zakładamy strukturę: [0] -> Polski, [1] -> Angielski
    const currentLang = i18n.language || 'pl';
    
    if (currentLang.startsWith('en') && parts.length > 1) {
      return parts[1]; // Zwróć Cash
    }
    
    return parts[0]; // Domyślnie zwróć Polski (Gotówka)
  }

  // Jeśli nie ma "&", po prostu zwróć tekst tak jak przyszedł
  return text;
};