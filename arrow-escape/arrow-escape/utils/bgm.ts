// Background Music Manager
const BGM_URL = 'https://pub-e9a8f18bbe6141f28c8b86c4c54070e1.r2.dev/bgm/biubiu/biu_lifepower_bgmMartinsGarix.mp3';

let bgmAudio: HTMLAudioElement | null = null;

export const initBGM = () => {
    if (!bgmAudio) {
        bgmAudio = new Audio(BGM_URL);
        bgmAudio.loop = true;
        bgmAudio.volume = 0.3; // 30% volume
        bgmAudio.preload = 'auto';
    }
    return bgmAudio;
};

export const playBGM = () => {
    const audio = initBGM();
    audio.play().catch(e => console.log("BGM autoplay blocked", e));
};

export const pauseBGM = () => {
    if (bgmAudio) {
        bgmAudio.pause();
    }
};

export const setBGMVolume = (volume: number) => {
    if (bgmAudio) {
        bgmAudio.volume = Math.max(0, Math.min(1, volume));
    }
};

export const toggleBGM = () => {
    const audio = initBGM();
    if (audio.paused) {
        audio.play().catch(e => console.log("BGM play failed", e));
    } else {
        audio.pause();
    }
    return !audio.paused;
};
