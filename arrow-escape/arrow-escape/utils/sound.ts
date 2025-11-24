// Simple Web Audio API wrapper to avoid external assets
// External audio file URLs
const SOUND_URLS = {
  swoosh: 'https://taira-komori.net/sound_os2/arms01/laser4.mp3',
  error: 'https://taira-komori.net/sound_os2/game01/blip01.mp3',
  win: 'https://taira-komori.net/sound_os2/anime01/fanfare2.mp3',
  lost: 'https://pub-4785f27b55bc484db8005d5841a1735a.r2.dev/failure3s.wav'
};

// Preload audio
const audioCache: Record<string, HTMLAudioElement> = {};

const loadAudio = (key: keyof typeof SOUND_URLS) => {
  if (!audioCache[key]) {
    audioCache[key] = new Audio(SOUND_URLS[key]);
    audioCache[key].preload = 'auto';
  }
  return audioCache[key];
};

// Preload all sounds
Object.keys(SOUND_URLS).forEach(key => loadAudio(key as keyof typeof SOUND_URLS));

export const playSwoosh = () => {
  try {
    const audio = loadAudio('swoosh');
    audio.currentTime = 0; // Reset to start
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Audio play failed", e));
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playError = () => {
  try {
    const audio = loadAudio('error');
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Audio play failed", e));
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playWin = () => {
  try {
    const audio = loadAudio('win');
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Audio play failed", e));
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playLost = () => {
  try {
    const audio = loadAudio('lost');
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Audio play failed", e));
  } catch (e) {
    console.error("Audio play failed", e);
  }
};