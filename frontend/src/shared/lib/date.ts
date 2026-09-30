import { DEFAULT_LOCALE } from '@/shared/config/constants';

type DateInput = Date | string | number;

const toDate = (value: DateInput): Date => (value instanceof Date ? value : new Date(value));

export function formatTime(value: DateInput, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
    toDate(value),
  );
}

export function formatDate(value: DateInput, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    toDate(value),
  );
}

export function formatDateTime(value: DateInput, locale = DEFAULT_LOCALE): string {
  return `${formatDate(value, locale)}, ${formatTime(value, locale)}`;
}

//время для пользователя
export function formatRelative(value: DateInput, locale = DEFAULT_LOCALE): string {
  const diffSeconds = Math.round((toDate(value).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) return rtf.format(Math.round(diffSeconds / seconds), unit);
  }
  return rtf.format(diffSeconds, 'second');
}
