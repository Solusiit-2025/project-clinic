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

// Function to process the queue
const processQueue = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  if (isSpeaking || speechQueue.length === 0) return;

  const item = speechQueue.shift();
  if (!item) return;

  const { utterance, onStart, onEnd } = item;
  isSpeaking = true;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  const cleanup = () => {
    isSpeaking = false;
    if (onEnd) onEnd();
    // Small delay before next to avoid browser glitches
    setTimeout(processQueue, 100);
  };

  utterance.onend = cleanup;
  utterance.onerror = cleanup;

  // Crucial: cancel any ongoing speech to prevent getting stuck
  window.speechSynthesis.cancel();
  
  // Actually speak
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

  // Format Queue Number for better pronunciation (e.g., A-01 -> A, 0 1)
  const formattedQueueNo = queueNo
    ? queueNo.split('').join(' ').replace(' - ', ', ')
    : '';

  const text = queueNo 
    ? `Nomor antrian, ${formattedQueueNo}, atas nama ${cleanName}, silakan menuju ${room}.`
    : name;
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find Indonesian voice
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => 
      v.lang.startsWith('id') && 
      (v.name.includes('Gadis') || v.name.includes('Andini') || v.name.toLowerCase().includes('female'))
    ) || voices.find(v => v.lang.startsWith('id'));
    
    if (idVoice) {
      utterance.voice = idVoice;
    }
  };

  loadVoices();
  // If voices weren't loaded yet, try again when they change (though usually they are ready by now)
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  
  utterance.lang = 'id-ID';
  utterance.rate = 0.95; 
  utterance.pitch = 1.05; 
  utterance.volume = 1.0;
  
  // Add to queue and process
  speechQueue.push({ utterance, onStart, onEnd });
  processQueue();
}

/**
 * Call this to "unlock" speech on user interaction if needed,
 * or to clear any stuck states.
 */
export const resetSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speechQueue = [];
    
    // Play a silent or very short utterance to "prime" the engine
    const prime = new SpeechSynthesisUtterance('');
    prime.volume = 0;
    window.speechSynthesis.speak(prime);
  }
};
