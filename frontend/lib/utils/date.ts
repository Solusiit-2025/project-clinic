/**
 * Utility to handle dates in Jakarta/Indonesia (WIB) format
 */

/**
 * Returns current date in YYYY-MM-DD format using local time (WIB)
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns first day of current month in YYYY-MM-DD format using local time
 */
export const getFirstDayOfMonthString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

/**
 * Returns current month in YYYY-MM format using local time
 */
export const getLocalMonthString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Returns current date and time in YYYY-MM-DDTHH:mm format using local time (for datetime-local inputs)
 */
export const getLocalDateTimeString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Returns first day of current year in YYYY-MM-DD format using local time
 */
export const getFirstDayOfYearString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  return `${year}-01-01`;
};

/**
 * Formats a date string or object to Indonesian locale (e.g., 15 Mei 2026)
 */
export const formatFullDateID = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formats a date string or object to Indonesian locale with time (e.g., 15 Mei 2026 01:46)
 */
export const formatDateTimeID = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
