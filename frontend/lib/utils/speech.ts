/**
 * Vocal Announcement Utility for Clinic Queue System
 * Uses window.speechSynthesis to announce patient queue numbers sequentially
 */

interface SpeechItem {
  utterance: SpeechSynthesisUtterance;
  onStart?: () => void;
  onEnd?: () => void;
}

let speechQueue: SpeechItem[] = [];
let isSpeaking = false;

const processQueue = () => {
  if (isSpeaking || speechQueue.length === 0) return;

  const item = speechQueue.shift();
  if (!item) return;

  const { utterance, onStart, onEnd } = item;
  isSpeaking = true;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    isSpeaking = false;
    if (onEnd) onEnd();
    processQueue();
  };

  utterance.onerror = () => {
    isSpeaking = false;
    if (onEnd) onEnd();
    processQueue();
  };

  window.speechSynthesis.speak(utterance);
};

export const announceQueue = (
  queueNo: string, 
  name: string, 
  room: string, 
  onStart?: () => void, 
  onEnd?: () => void
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  // Clean name for better pronunciation
  const cleanName = name.toLowerCase()
    .replace(/^dr\.\s+/i, '')
    .replace(/^h\.\s+/i, '')
    .replace(/^hj\.\s+/i, '');

  const text = queueNo 
    ? `Nomor antrian, ${queueNo.replace('-', ' ')}, atas nama ${cleanName}, silakan menuju ${room}.`
    : name;
  
  const utterance = new SpeechSynthesisUtterance(text);
  
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
  utterance.volume = 1.0;
  
  // Add to queue and process
  speechQueue.push({ utterance, onStart, onEnd });
  processQueue();
}
