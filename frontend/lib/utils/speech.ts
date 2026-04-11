/**
 * Vocal Announcement Utility for Clinic Queue System
 * Uses window.speechSynthesis to announce patient queue numbers
 */

export const announceQueue = (queueNo: string, name: string, room: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  // CRITICAL: Stop any ongoing speech immediately in the main thread
  window.speechSynthesis.cancel();

  // Clean name for better pronunciation
  const cleanName = name.toLowerCase()
    .replace(/^dr\.\s+/i, '')
    .replace(/^h\.\s+/i, '') // Haji/Hajjah
    .replace(/^hj\.\s+/i, '');

  const text = queueNo 
    ? `Nomor antrian, ${queueNo.replace('-', ' ')}, atas nama ${cleanName}, silakan menuju ${room}.`
    : name; // Fallback for simple messages like "Monitor Aktif"
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Mencari suara wanita Indonesia
  // Note: We use synchronous getVoices here for better "User Gesture" compliance
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => 
    v.lang.startsWith('id') && 
    (v.name.includes('Gadis') || v.name.includes('Andini') || v.name.toLowerCase().includes('female'))
  ) || voices.find(v => v.lang.startsWith('id'));
  
  if (idVoice) {
    utterance.voice = idVoice;
  }
  
  utterance.lang = 'id-ID';
  utterance.rate = 0.95;
  utterance.pitch = 1.05; 
  utterance.volume = 1.0; // Ensure it follows system volume at max level
  
  // CRITICAL: speak() MUST be called in the same "tick" to pass browser security
  window.speechSynthesis.speak(utterance);
}
