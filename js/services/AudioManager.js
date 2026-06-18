/**
 * Менеджер звуков с предзагрузкой и пулом Audio элементов.
 * Позволяет воспроизводить один звук несколько раз одновременно.
 */
export class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.5;
        this.poolSize = 3; // количество экземпляров каждого звука для одновременного воспроизведения
        this.loaded = false;
    }

    async load() {
        const soundFiles = {
            explosion: 'sounds/Explosion.wav',
            break: 'sounds/Break.wav',
            fire: 'sounds/Fire.wav',
            collision: 'sounds/Collision.wav',
            ricochet: 'sounds/Ricochet.wav',
            hit: 'sounds/Hit.wav',
            pickup: 'sounds/Pickup.wav'
        };

        const promises = Object.entries(soundFiles).map(async ([key, path]) => {
            this.sounds[key] = [];
            for (let i = 0; i < this.poolSize; i++) {
                const audio = new Audio(path);
                audio.volume = this.volume;
                await new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', resolve, { once: true });
                    audio.addEventListener('error', reject, { once: true });
                    audio.load();
                });
                this.sounds[key].push(audio);
            }
        });

        try {
            await Promise.all(promises);
            this.loaded = true;
            console.log('✅ Все звуки загружены');
        } catch (e) {
            console.error('❌ Ошибка загрузки звуков:', e);
        }
    }

    play(soundName) {
        if (this.muted || !this.loaded) return;

        const pool = this.sounds[soundName];
        if (!pool || pool.length === 0) return;

        const audio = pool.find(a => a.paused || a.ended);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn('Audio play error:', e));
        }
    }

    setMuted(muted) {
        this.muted = muted;
        if (muted) {
            Object.values(this.sounds).forEach(pool => {
                pool.forEach(audio => {
                    audio.pause();
                    audio.currentTime = 0;
                });
            });
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(pool => {
            pool.forEach(audio => {
                audio.volume = this.volume;
            });
        });
    }

    isMuted() {
        return this.muted;
    }
}