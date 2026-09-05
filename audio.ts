// Web Audio API Synthesizer for Voxel Nomad
// Generates cozy 8-bit & chime sounds without any external audio files

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Sonar Echo Pulse
  playSonarPing() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    // Soft echo ping
    setTimeout(() => {
      if (!this.ctx) return;
      const echoNow = this.ctx.currentTime;
      const echoOsc = this.ctx.createOscillator();
      const echoGain = this.ctx.createGain();

      echoOsc.type = 'sine';
      echoOsc.frequency.setValueAtTime(880, echoNow);
      echoOsc.frequency.exponentialRampToValueAtTime(1100, echoNow + 0.1);

      echoGain.gain.setValueAtTime(0.08, echoNow);
      echoGain.gain.exponentialRampToValueAtTime(0.0001, echoNow + 0.4);

      echoOsc.connect(echoGain);
      echoGain.connect(this.ctx.destination);

      echoOsc.start(echoNow);
      echoOsc.stop(echoNow + 0.4);
    }, 180);
  }

  // Shovel Dig / Crunch
  playDig() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(200, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  }

  // Chest Open Jingle
  playChestOpen() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C E G C E
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  // Rare Relic Found Fanfare
  playRelicFound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      { f: 523.25, t: 0.0 }, // C5
      { f: 659.25, t: 0.1 }, // E5
      { f: 783.99, t: 0.2 }, // G5
      { f: 1046.50, t: 0.35 }, // C6
      { f: 1318.51, t: 0.5 }, // E6
    ];

    chords.forEach(({ f, t }) => {
      const now = ctx.currentTime + t;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    });
  }

  // Obelisk Awakening (Deep harmonic drone + mystic shimmer)
  playObeliskIgnite() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Deep sub-drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'triangle';
    drone.frequency.setValueAtTime(110, now); // A2
    drone.frequency.exponentialRampToValueAtTime(220, now + 1.2);

    droneGain.gain.setValueAtTime(0.001, now);
    droneGain.gain.linearRampToValueAtTime(0.3, now + 0.3);
    droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    drone.connect(droneGain);
    droneGain.connect(ctx.destination);
    drone.start(now);
    drone.stop(now + 1.8);

    // Chime harmonics
    [554.37, 659.25, 880, 1108.73].forEach((f, i) => {
      const chimeNow = now + 0.3 + i * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, chimeNow);

      gain.gain.setValueAtTime(0.12, chimeNow);
      gain.gain.exponentialRampToValueAtTime(0.0001, chimeNow + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chimeNow);
      osc.stop(chimeNow + 1.0);
    });
  }

  // Companion Joy / Bark / Chirp
  playPetSound(type: 'fox' | 'dog' | 'capybara' = 'fox') {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'dog') {
      // Bark: pitch bend down
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    } else if (type === 'fox') {
      // High curious yip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } else {
      // Capybara cozy soft grunt
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.1);
      osc.frequency.linearRampToValueAtTime(130, now + 0.25);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Campfire Rest / Sizzle
  playCampfireRest() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [329.63, 392.00, 493.88, 587.33]; // E minor cozy arpeggio
    notes.forEach((f, i) => {
      const noteTime = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, noteTime);

      gain.gain.setValueAtTime(0.14, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }

  // Level up cheer
  playLevelUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [392, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      const now = ctx.currentTime + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    });
  }
}

export const sounds = new SoundEngine();
