/**
 * Utility to handle dates in Jakarta/Indonesia (WIB) format in the backend
 * This is implemented using explicit GMT+7 offset to avoid timezone fallback 
 * issues on production servers without full-icu or tzdata.
 */

export const getJakartaDate = (date: Date = new Date()): Date => {
  // Returns a Date object where its UTC time matches the Jakarta local time.
  // This allows us to use getUTCFullYear(), getUTCMonth(), etc. safely.
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

export const getJakartaDateString = (date: Date = new Date()): string => {
  const jkt = getJakartaDate(date);
  const yyyy = jkt.getUTCFullYear();
  const mm = String(jkt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jkt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const parseLocalDate = (dateStr: string, isEnd: boolean = false): Date => {
  if (!dateStr || dateStr.trim() === '') {
     const jakartaToday = getJakartaDateString();
     // Append +07:00 so the created Date represents this exact time globally
     const d = new Date(`${jakartaToday}T00:00:00+07:00`);
     if (isEnd) {
       // Safe way to get end of day (23:59:59.999)
       return new Date(d.getTime() + 24 * 60 * 60 * 1000 - 1);
     }
     return d;
  }
  
  if (dateStr.includes('T') && (dateStr.includes('Z') || dateStr.includes('+'))) {
    return new Date(dateStr);
  }

  const time = isEnd ? '23:59:59+07:00' : '00:00:00+07:00';
  return new Date(`${dateStr}T${time}`);
};

export const getJakartaDateRef = (date: Date = new Date()): string => {
  return getJakartaDateString(date).replace(/-/g, '');
};

export const getJakartaTimeString = (date: Date = new Date()): string => {
  const jkt = getJakartaDate(date);
  const hh = String(jkt.getUTCHours()).padStart(2, '0');
  const mm = String(jkt.getUTCMinutes()).padStart(2, '0');
  const ss = String(jkt.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export const getJakartaDayName = (date: Date = new Date()): string => {
  const jkt = getJakartaDate(date);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[jkt.getUTCDay()];
};
