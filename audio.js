/**
 * Audio Engine for Birthday Reel Studio
 * Synthesizes dreamy, emotional music box and soft lofi piano melodies
 * and handles user-uploaded audio with seamless Web Audio routing & video export support.
 */

class ReelAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.mediaStreamDest = null;
    this.isPlaying = false;
    this.currentPreset = 'music_box'; // 'music_box' | 'lofi_piano' | 'celeste_harp' | 'custom'
    this.volume = 0.85;
    this.userAudioElement = null;
    this.userAudioSource = null;
    this.activeTimeouts = [];
    this.customAudioBlobUrl = null;
    this.customAudioBuffer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Create algorithmic dreamy stereo reverb / ambient space
      this.reverbNode = this.createDreamyReverb();

      // Create MediaStreamDestination for video recording capture
      this.mediaStreamDest = this.ctx.createMediaStreamDestination();

      // Route master to both speakers and recording stream
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.mediaStreamDest);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  createDreamyReverb() {
    // Multi-tap delay network for lush, ethereal ambient tail
    const convolver = this.ctx.createConvolver();
    const rate = this.ctx.sampleRate;
    const length = rate * 2.8; // 2.8s lush decay
    const decay = 3.2;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const env = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }
    convolver.buffer = impulse;

    const dryGain = this.ctx.createGain();
    dryGain.gain.value = 0.7;
    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.45;

    const input = this.ctx.createGain();
    const output = this.ctx.createGain();

    input.connect(dryGain);
    input.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(output);
    wetGain.connect(output);

    output.connect(this.masterGain);
    return input;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.userAudioElement) {
      this.userAudioElement.volume = this.volume;
    }
  }

  // Play a single synthesized note
  playNote(frequency, time, duration = 1.2, type = 'music_box', velocity = 0.8) {
    if (!this.ctx || !this.reverbNode) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (type === 'music_box') {
      // Bell-like high chime: pure sine + octave overtone + resonant bandpass
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, time);
      osc2.frequency.setValueAtTime(frequency * 2.002, time); // slight detune sparkle

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(frequency * 1.8, time);
      filter.Q.setValueAtTime(3.5, time);

      // Music box envelope: instantaneous ping attack, gentle exponential decay
      const peak = velocity * 0.4;
      noteGain.gain.setValueAtTime(0.0001, time);
      noteGain.gain.exponentialRampToValueAtTime(peak, time + 0.003);
      noteGain.gain.exponentialRampToValueAtTime(peak * 0.35, time + 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.00001, time + duration);

    } else if (type === 'lofi_piano') {
      // Warm mellow electric piano: triangle + sine through warm lowpass
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, time);
      osc2.frequency.setValueAtTime(frequency * 0.998, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, time);
      filter.frequency.exponentialRampToValueAtTime(350, time + duration);
      filter.Q.setValueAtTime(1.2, time);

      const peak = velocity * 0.35;
      noteGain.gain.setValueAtTime(0.0001, time);
      noteGain.gain.exponentialRampToValueAtTime(peak, time + 0.012);
      noteGain.gain.exponentialRampToValueAtTime(peak * 0.5, time + 0.3);
      noteGain.gain.exponentialRampToValueAtTime(0.00001, time + duration * 1.4);

    } else { // 'celeste_harp'
      // Delicate ethereal celeste
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(frequency, time);
      osc2.frequency.setValueAtTime(frequency * 3.0, time);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, time);
      filter.Q.setValueAtTime(0.8, time);

      const peak = velocity * 0.3;
      noteGain.gain.setValueAtTime(0.0001, time);
      noteGain.gain.exponentialRampToValueAtTime(peak, time + 0.005);
      noteGain.gain.exponentialRampToValueAtTime(0.00001, time + duration * 0.9);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.reverbNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.2);
    osc2.stop(time + duration + 0.2);
  }

  // Sparkling celestial glissando / chime sweep
  playSparkleChime(time) {
    const notes = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02]; // C6, E6, G6, C7, E7
    notes.forEach((freq, idx) => {
      this.playNote(freq, time + idx * 0.08, 0.9, 'music_box', 0.5);
    });
  }

  /**
   * Schedule the entire 30-second heartwarming composition
   * Progression:
   * 00s-03s: Intro chime & soft opening chords (Fmaj7 - C/E)
   * 03s-07s: Polaroid entrance beat (Dm7 - Am7 - Bbmaj9)
   * 07s-12s: Candid memories playful arpeggio (C7 - Fmaj7 - Gm7 - C)
   * 12s-18s: Scrapbook collage emotional rise (Bbmaj7 - Am7 - Gm7 - C7)
   * 18s-24s: Golden hour hero portrait - grand romantic swell & chime
   * 24s-30s: Birthday celebration melody (Happy Birthday theme in dreamy music box)
   */
  scheduleSong(startTime = 0) {
    if (this.currentPreset === 'custom' && this.userAudioElement) {
      this.userAudioElement.currentTime = startTime;
      this.userAudioElement.play().catch(e => console.log('Audio autoplay prevented:', e));
      return;
    }

    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.clearTimeouts();
    const now = this.ctx.currentTime;
    const offset = startTime;

    // Frequencies (Hz)
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, Bb4 = 466.16, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, Bb5 = 932.33, C6 = 1046.50, D6 = 1174.66, E6 = 1318.51;

    // Full score note events: [timestampInSeconds, frequency, duration, velocity]
    const events = [
      // 00.0s - 03.0s: Scene 1: "someone very special was born... ♡"
      [0.0, C5, 1.8, 0.7], [0.35, E5, 1.6, 0.6], [0.7, G5, 2.0, 0.8], [1.2, C6, 2.2, 0.9],
      [1.8, A5, 1.5, 0.65], [2.3, G5, 1.8, 0.75],

      // 03.0s - 07.0s: Scene 2: "and the world got a little more beautiful 🎀"
      [3.0, F4, 1.5, 0.7], [3.0, A4, 1.5, 0.6], [3.0, C5, 2.0, 0.8], // Beat 1 chord
      [3.5, E5, 1.2, 0.6], [4.0, F5, 1.5, 0.8], [4.5, A5, 1.4, 0.7],
      [5.0, G5, 1.6, 0.75], [5.5, E5, 1.2, 0.6], [6.0, D5, 1.5, 0.7], [6.5, C5, 1.8, 0.8],

      // 07.0s - 12.0s: Scene 3: "my favourite memories have you in them ♡"
      [7.0, D4, 1.8, 0.7], [7.0, F4, 1.8, 0.65], [7.0, A4, 2.0, 0.8], // Beat 2 chord
      [7.4, C5, 1.2, 0.6], [7.8, D5, 1.4, 0.7], [8.4, F5, 1.5, 0.85],
      [9.0, E5, 1.3, 0.65], [9.5, D5, 1.2, 0.6], [10.0, C5, 1.6, 0.8],
      [10.6, G4, 1.2, 0.55], [11.2, A4, 1.4, 0.7], [11.8, C5, 1.8, 0.75],

      // 12.0s - 18.0s: Scene 4: "thank you for being YOU 🧸"
      [12.0, Bb4, 2.0, 0.8], [12.0, D5, 2.0, 0.75], [12.0, F5, 2.2, 0.9], // Cozy chord
      [12.6, G5, 1.3, 0.65], [13.2, F5, 1.5, 0.8], [13.8, E5, 1.2, 0.6],
      [14.4, D5, 1.6, 0.7], [15.0, C5, 2.0, 0.85], [15.6, E5, 1.4, 0.6],
      [16.2, G5, 1.8, 0.8], [16.8, A5, 1.5, 0.75], [17.4, C6, 2.2, 0.95],

      // 18.0s - 24.0s: Scene 5: "you deserve every beautiful thing life has to offer."
      // Warm romantic golden hour swell
      [18.0, F4, 2.5, 0.85], [18.0, C5, 2.5, 0.8], [18.0, A5, 2.8, 0.95],
      [18.5, G5, 1.4, 0.7], [19.0, F5, 1.5, 0.8], [19.6, E5, 1.3, 0.65],
      [20.2, D5, 1.6, 0.75], [20.8, C5, 2.0, 0.85],
      [21.4, D5, 1.4, 0.7], [22.0, E5, 1.6, 0.8], [22.6, F5, 1.8, 0.85],
      [23.2, G5, 2.2, 0.9],

      // 24.0s - 30.0s: Scene 6: "HAPPY BIRTHDAY... ♡ stay cute, stay happy..."
      // Dreamy, nostalgic music-box "Happy Birthday" variation
      [24.0, C5, 0.8, 0.75], [24.4, C5, 0.6, 0.65], [24.8, D5, 1.2, 0.85],
      [25.4, C5, 1.2, 0.8], [26.0, F5, 1.5, 0.95], [26.6, E5, 2.0, 0.9], // "Happy Birthday to you..."
      [27.4, C5, 0.8, 0.75], [27.8, C5, 0.6, 0.65], [28.2, D5, 1.2, 0.85],
      [28.8, C5, 1.2, 0.8], [29.3, G5, 1.5, 0.95], [29.8, F5, 2.5, 1.0], // "...to you!"

      // Sparkling ending resolution chime
      [30.2, A5, 2.0, 0.7], [30.5, C6, 2.5, 0.85], [30.9, F6 || 1396.91, 3.0, 0.9]
    ];

    events.forEach(([t, freq, dur, vel]) => {
      if (t >= offset && t <= 32) {
        const scheduleTime = now + (t - offset);
        this.playNote(freq, scheduleTime, dur, this.currentPreset, vel);
      }
    });

    // Add extra chime flourishes at scene change beats
    const chimes = [3.0, 7.0, 12.0, 18.0, 24.0];
    chimes.forEach(ct => {
      if (ct >= offset && ct <= 30) {
        this.playSparkleChime(now + (ct - offset));
      }
    });

    this.isPlaying = true;
  }

  stop() {
    this.clearTimeouts();
    const bgAudio = document.getElementById('bgMusicAudio');
    if (bgAudio) {
      bgAudio.pause();
    }
    if (this.userAudioElement) {
      this.userAudioElement.pause();
    }
    if (this.ctx && this.masterGain) {
      // Gentle fade out of remaining rings
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      setTimeout(() => {
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
      }, 160);
    }
    this.isPlaying = false;
  }

  clearTimeouts() {
    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeTimeouts = [];
  }

  // Interactive Sound Effects for Scrapbook
  playPageFlip() {
    if (!this.ctx) this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  playBlowCandles() {
    if (!this.ctx) this.init();
    const t = this.ctx.currentTime;
    // White noise breath whoosh
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.45);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);

    // Magical chime afterwards
    setTimeout(() => {
      this.playSparkleChime();
    }, 280);
  }

  playCelebrationCheer() {
    if (!this.ctx) this.init();
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major glissando
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, this.ctx.currentTime, 1.4, 'music_box', 0.9);
      }, idx * 75);
    });
  }

  playStamp() {
    if (!this.ctx) this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  startContinuousMusic() {
    this.init();
    const bgAudio = document.getElementById('bgMusicAudio');
    if (bgAudio && (this.currentPreset === 'music_box' || !this.currentPreset)) {
      this.stop();
      bgAudio.volume = this.volume;
      const playPromise = bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlaying = true;
        }).catch(err => {
          console.warn('HTML5 audio play blocked:', err);
          this.startSynthLoop();
        });
        return;
      }
    }
    this.startSynthLoop();
  }

  startSynthLoop() {
    this.stop();
    this.scheduleSong(0);

    // Loop every 30 seconds
    this.loopInterval = setInterval(() => {
      if (this.isPlaying) {
        this.scheduleSong(0);
      }
    }, 30000);
  }

  stopContinuousMusic() {
    const bgAudio = document.getElementById('bgMusicAudio');
    if (bgAudio) {
      bgAudio.pause();
    }
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.stop();
  }

  loadCustomAudio(file) {
    if (!this.ctx) this.init();
    if (this.customAudioBlobUrl) {
      URL.revokeObjectURL(this.customAudioBlobUrl);
    }
    this.customAudioBlobUrl = URL.createObjectURL(file);
    if (!this.userAudioElement) {
      this.userAudioElement = new Audio();
      this.userAudioElement.crossOrigin = 'anonymous';
      this.userAudioSource = this.ctx.createMediaElementSource(this.userAudioElement);
      this.userAudioSource.connect(this.masterGain);
    }
    this.userAudioElement.src = this.customAudioBlobUrl;
    this.currentPreset = 'custom';
    return true;
  }

  getAudioStream() {
    if (!this.ctx) this.init();
    return this.mediaStreamDest.stream;
  }
}

window.reelAudio = new ReelAudioEngine();
