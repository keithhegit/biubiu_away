// Sound Manager using HTML5 Audio for external files
const SOUND_URLS = {
  swoosh: 'https://taira-komori.net/sound_os2/arms01/laser4.mp3',
  error: 'https://taira-komori.net/sound_os2/game01/blip01.mp3',
  win: 'https://taira-komori.net/sound_os2/anime01/fanfare2.mp3',
  lost: 'https://pub-4785f27b55bc484db8005d5841a1735a.r2.dev/failure3s.wav'
};

const sounds: { [key: string]: HTMLAudioElement } = {};

// Preload sounds
if (typeof window !== 'undefined') {
  Object.entries(SOUND_URLS).forEach(([key, url]) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    sounds[key] = audio;
  });
}

const playSound = (key: string, volume = 1.0) => {
  const audio = sounds[key];
  if (audio) {
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(e => console.log("Sound play failed", e));
  }
};

export const playSwoosh = () => playSound('swoosh', 0.4);
export const playError = () => playSound('error', 0.5);
export const playWin = () => playSound('win', 0.4);
export const playLost = () => playSound('lost', 0.6);