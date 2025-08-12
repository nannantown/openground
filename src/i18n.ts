import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Import messages directly to avoid dynamic import issues
import enMessages from '../messages/en.json';
import jaMessages from '../messages/ja.json';

// Can be imported from a shared config
const locales = ['en', 'ja'];

// Message map for static imports
const messages = {
  en: enMessages,
  ja: jaMessages,
} as const;

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as any)) {
    locale = 'en'; // fallback to English
  }

  return {
    locale,
    messages: messages[locale as keyof typeof messages]
  };
});