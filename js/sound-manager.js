class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.enabled = false;
        this.loopInterval = null;
        this.effects = this._createEffects();

        document.addEventListener('visibilitychange', () => {
            if (!this.audioCtx) return;
            if (document.hidden && this.audioCtx.state === 'running') {
                this.audioCtx.suspend();
            } else if (!document.hidden && this.enabled) {
                this.audioCtx.resume();
            }
        });
    }

    _ensureContext() {
        if (this.audioCtx) {
            return this.audioCtx;
        }
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn('🔇 Web Audio API не поддерживается');
            return null;
        }
        this.audioCtx = new AudioContext();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.65;
        this.masterGain.connect(this.audioCtx.destination);
        return this.audioCtx;
    }

    enable() {
        const ctx = this._ensureContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        this.enabled = true;
    }

    mute(toggle) {
        if (!this.masterGain) return;
        this.masterGain.gain.value = toggle ? 0 : 0.65;
    }

    _createEffects() {
        return {
            start: {
                sequence: [
                    { freq: 440, duration: 0.18, type: 'sawtooth', volume: 1 },
                    { freq: 660, duration: 0.22, offset: 0.18, type: 'triangle', volume: 0.9 },
                    { freq: 880, duration: 0.25, offset: 0.34, type: 'square', volume: 0.8 }
                ]
            },
            transition: {
                sequence: [
                    { freq: 620, duration: 0.14, type: 'triangle', volume: 0.8 },
                    { freq: 780, duration: 0.12, offset: 0.16, type: 'triangle', volume: 0.7 }
                ]
            },
            countdown: {
                frequency: 820,
                duration: 0.12,
                type: 'square',
                volume: 0.7
            },
            countdownFinal: {
                sequence: [
                    { freq: 880, duration: 0.15, type: 'square', volume: 0.8 },
                    { freq: 1100, duration: 0.2, offset: 0.16, type: 'square', volume: 0.8 }
                ]
            },
            gameplayPulse: {
                sequence: [
                    { freq: 310, duration: 0.18, type: 'sawtooth', volume: 0.4 },
                    { freq: 420, duration: 0.16, offset: 0.22, type: 'triangle', volume: 0.35 }
                ]
            },
            success: {
                sequence: [
                    { freq: 740, duration: 0.18, type: 'triangle', volume: 0.85 },
                    { freq: 920, duration: 0.2, offset: 0.18, type: 'triangle', volume: 0.9 },
                    { freq: 1180, duration: 0.22, offset: 0.38, type: 'square', volume: 0.75 }
                ]
            },
            fail: {
                sequence: [
                    { freq: 320, duration: 0.35, type: 'sawtooth', volume: 0.8 },
                    { freq: 220, duration: 0.4, offset: 0.28, type: 'sawtooth', volume: 0.75 }
                ]
            },
            lifeLost: {
                sequence: [
                    { freq: 280, duration: 0.22, type: 'square', volume: 0.8 },
                    { freq: 180, duration: 0.3, offset: 0.2, type: 'square', volume: 0.7 }
                ]
            },
            jump: {
                frequency: 940,
                duration: 0.16,
                type: 'square',
                volume: 0.8
            },
            collectGood: {
                sequence: [
                    { freq: 1020, duration: 0.12, type: 'triangle', volume: 0.9 },
                    { freq: 1340, duration: 0.14, offset: 0.12, type: 'triangle', volume: 0.8 }
                ]
            },
            collectBad: {
                sequence: [
                    { freq: 320, duration: 0.2, type: 'sawtooth', volume: 0.8 },
                    { freq: 260, duration: 0.2, offset: 0.18, type: 'sawtooth', volume: 0.7 }
                ]
            },
            dropGood: {
                sequence: [
                    { freq: 660, duration: 0.1, type: 'triangle', volume: 0.8 },
                    { freq: 880, duration: 0.12, offset: 0.11, type: 'triangle', volume: 0.75 }
                ]
            },
            dropBad: {
                sequence: [
                    { freq: 260, duration: 0.24, type: 'sawtooth', volume: 0.75 },
                    { freq: 180, duration: 0.26, offset: 0.2, type: 'sawtooth', volume: 0.7 }
                ]
            },
            conveyorTick: {
                frequency: 520,
                duration: 0.08,
                type: 'square',
                volume: 0.5
            }
        };
    }

    playEffect(name, volumeScale = 1) {
        if (!this.enabled) return;
        const def = this.effects[name];
        if (!def) return;
        const ctx = this._ensureContext();
        if (!ctx) return;

        if (def.sequence) {
            const start = ctx.currentTime;
            def.sequence.forEach((step, index) => {
                const offset = step.offset !== undefined ? step.offset : index * 0.08;
                this._playTone({
                    frequency: step.freq,
                    type: step.type || def.type,
                    duration: step.duration || def.duration || 0.2,
                    volume: (step.volume ?? def.volume ?? 1) * volumeScale,
                    startTime: start + offset
                });
            });
        } else {
            this._playTone({
                frequency: def.frequency,
                type: def.type,
                duration: def.duration || 0.25,
                volume: (def.volume ?? 1) * volumeScale
            });
        }
    }

    _playTone({ frequency = 440, type = 'sine', duration = 0.2, volume = 1, startTime }) {
        const ctx = this._ensureContext();
        if (!ctx || !this.masterGain) return;
        const now = ctx.currentTime;
        const start = startTime ?? now;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.7 * volume), start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + duration + 0.02);
    }

    startGameplayLoop() {
        if (!this.enabled) return;
        this.stopGameplayLoop();
        this.loopInterval = setInterval(() => {
            this.playEffect('gameplayPulse', 0.4);
        }, 1200);
    }

    stopGameplayLoop() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
    }
}

window.SoundManager = SoundManager;
