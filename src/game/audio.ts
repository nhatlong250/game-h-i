import { GameSettings } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmTimer: number | null = null;
  private sizzleSource: AudioBufferSourceNode | null = null;
  private sizzleGain: GainNode | null = null;
  private lastVoiceTime: number = 0;
  private viVoices: SpeechSynthesisVoice[] = [];

  private settings: GameSettings = {
    mouseSensitivity: 1.0,
    invertY: false,
    cameraBobbing: true,
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.5,
    voiceVolume: 0.95,
  };

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const all = window.speechSynthesis.getVoices();
      this.viVoices = all.filter(v => 
        v.lang.toLowerCase().includes('vi') || 
        v.lang.toLowerCase().includes('vn') ||
        v.name.toLowerCase().includes('vietnam')
      );
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.settings.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.settings.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.settings.musicVolume;
    this.musicGain.connect(this.masterGain);

    this.voiceGain = this.ctx.createGain();
    this.voiceGain.gain.value = this.settings.voiceVolume;
    this.voiceGain.connect(this.masterGain);

    this.startBGM();
    this.initVoices();
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateSettings(settings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...settings };
    if (this.masterGain && this.settings.masterVolume !== undefined) {
      this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx?.currentTime || 0);
    }
    if (this.sfxGain && this.settings.sfxVolume !== undefined) {
      this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx?.currentTime || 0);
    }
    if (this.musicGain && this.settings.musicVolume !== undefined) {
      this.musicGain.gain.setValueAtTime(this.settings.musicVolume, this.ctx?.currentTime || 0);
    }
    if (this.voiceGain && this.settings.voiceVolume !== undefined) {
      this.voiceGain.gain.setValueAtTime(this.settings.voiceVolume, this.ctx?.currentTime || 0);
    }
  }

  // --- SOUND EFFECTS ---

  public playFootstep() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(70 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playPlace() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playChop() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  public setSizzle(active: boolean, intensity: number = 1.0) {
    if (!this.ctx || !this.sfxGain) return;

    if (active) {
      if (!this.sizzleGain) {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.1;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        filter.Q.value = 1.2;

        this.sizzleGain = this.ctx.createGain();
        this.sizzleGain.gain.value = 0.18 * intensity;

        source.connect(filter);
        filter.connect(this.sizzleGain);
        this.sizzleGain.connect(this.sfxGain);
        source.start();
        this.sizzleSource = source;
      } else {
        this.sizzleGain.gain.setValueAtTime(0.18 * intensity, this.ctx.currentTime);
      }
    } else {
      if (this.sizzleGain && this.sizzleSource) {
        this.sizzleGain.gain.setValueAtTime(0, this.ctx.currentTime);
        try {
          this.sizzleSource.stop();
        } catch {
          // ignore
        }
        this.sizzleSource = null;
        this.sizzleGain = null;
      }
    }
  }

  public playPlateDing() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05);
    osc.frequency.setValueAtTime(1760, now + 0.05);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  public playServiceBell() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const freqs = [1046.5, 2093.0, 3135.9];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = (0.35 / (idx + 1));
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.8);
    });
  }

  public playTrash() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playBell() {
    this.playServiceBell();
  }

  public playSuccess() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  public playCombo(comboCount: number) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    const baseIndex = Math.min(notes.length - 3, Math.max(0, comboCount - 2));

    for (let i = 0; i < 3; i++) {
      const freq = notes[baseIndex + i];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.3, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.35);
    }
  }

  public playCashRegister() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Bell 'ching'
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1760, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // Coin chatter
    for (let i = 0; i < 4; i++) {
      const coinOsc = this.ctx.createOscillator();
      const coinGain = this.ctx.createGain();
      coinOsc.type = 'sine';
      coinOsc.frequency.setValueAtTime(2500 + Math.random() * 800, now + 0.08 + i * 0.04);
      coinGain.gain.setValueAtTime(0.15, now + 0.08 + i * 0.04);
      coinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14 + i * 0.04);
      coinOsc.connect(coinGain);
      coinGain.connect(this.sfxGain);
      coinOsc.start(now + 0.08 + i * 0.04);
      coinOsc.stop(now + 0.16 + i * 0.04);
    }
  }

  public playFail() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [260, 230, 200].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.25);
    });
  }

  public playNewOrder() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880.0, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playBurnWarning() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- AMBIENT BGM (Warm Acoustic Vietnamese Café / Saigon Lo-Fi) ---
  private isRushBGM: boolean = false;

  public setRushMode(rush: boolean) {
    if (this.isRushBGM === rush) return;
    this.isRushBGM = rush;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.startBGM();
  }

  private startBGM() {
    if (!this.ctx || !this.musicGain) return;

    const chords = [
      [261.63, 329.63, 392.0, 523.25], // C maj
      [220.0, 261.63, 329.63, 440.0],  // A min
      [174.61, 220.0, 261.63, 349.23], // F maj
      [196.0, 246.94, 293.66, 392.0],  // G maj
    ];

    let chordIndex = 0;
    let step = 0;

    const playArpNote = () => {
      if (!this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIndex];
      const freq = currentChord[step % currentChord.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.isRushBGM ? 0.035 : 0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (this.isRushBGM ? 0.6 : 0.9));

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + (this.isRushBGM ? 0.6 : 0.9));

      step++;
      if (step >= 8) {
        step = 0;
        chordIndex = (chordIndex + 1) % chords.length;
      }
    };

    const interval = this.isRushBGM ? 220 : 320;
    this.bgmTimer = window.setInterval(playArpNote, interval);
  }

  // --- VIETNAMESE VOICE SYNTHESIS FOR ALL GAMEPLAY ---
  public speakVietnamese(
    text: string,
    role: 'duyen' | 'chu_ba' | 'system' | 'customer_hung' | 'customer_mai' | 'customer_nam' | 'customer_lan' | 'customer_tuan' = 'duyen',
    onEnd?: () => void
  ) {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.volume = Math.max(0.1, this.settings.voiceVolume * this.settings.masterVolume);

      if (role === 'duyen') {
        utterance.pitch = 1.18; // 21yo enthusiastic Vietnamese female voice
        utterance.rate = 1.08;
      } else if (role === 'chu_ba') {
        utterance.pitch = 0.85; // Warm mature male mentor voice
        utterance.rate = 0.95;
      } else if (role === 'customer_mai' || role === 'customer_lan') {
        utterance.pitch = 1.25; // Friendly female customer
        utterance.rate = 1.12;
      } else if (role === 'customer_nam' || role === 'customer_tuan') {
        utterance.pitch = 0.76; // Respectful elder/teacher male
        utterance.rate = 0.92;
      } else if (role === 'customer_hung') {
        utterance.pitch = 1.02; // Energetic university student
        utterance.rate = 1.1;
      } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
      }

      // Pick best Vietnamese voice available in browser
      if (this.viVoices.length === 0) {
        this.initVoices();
      }

      if (this.viVoices.length > 0) {
        // Prefer natural/Google/Microsoft Vietnamese voice
        const naturalVi = this.viVoices.find(v => 
          v.name.includes('Natural') || 
          v.name.includes('Google') || 
          v.name.includes('HoaiMy') || 
          v.name.includes('NamMinh')
        ) || this.viVoices[0];
        utterance.voice = naturalVi;
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.playMelodicVoiceChime(text.length);
        if (onEnd) onEnd();
      };

      try {
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Fallback
      }
    }

    // Melodic synthesized audio chime fallback
    this.playMelodicVoiceChime(text.length);
    if (onEnd) setTimeout(onEnd, Math.min(text.length * 40, 3000));
  }

  /**
   * Dedicated game event voice cues in Vietnamese (spoken by Duyên / Chú Ba)
   */
  public speakGameAction(action: string) {
    const now = Date.now();
    // Don't spam voice lines faster than once every 2.5 seconds
    if (now - this.lastVoiceTime < 2500) return;
    this.lastVoiceTime = now;

    const voiceLines: Record<string, { text: string; role: 'duyen' | 'chu_ba' | 'system' }> = {
      shift_start: { text: 'Bắt đầu ca làm mới thôi! Cố lên Duyên ơi!', role: 'duyen' },
      pickup_bread: { text: 'Bánh mì nóng giòn rụm đây rồi!', role: 'duyen' },
      pickup_egg: { text: 'Lấy quả trứng gà tươi ngon nè.', role: 'duyen' },
      pickup_pate: { text: 'Pa-tê gan béo ngậy thơm lừng.', role: 'duyen' },
      pickup_cucumber: { text: 'Dưa leo tươi giòn mát rượi.', role: 'duyen' },
      pickup_scallion: { text: 'Hành hoa thái nhỏ thơm phức.', role: 'duyen' },
      pickup_sausage: { text: 'Lạp xưởng Mai Quế Lộ đậm vị.', role: 'duyen' },
      pickup_rice: { text: 'Cơm nóng dẻo thơm vừa nấu xong.', role: 'duyen' },
      pickup_plate: { text: 'Lấy một chiếc đĩa sạch để bày món nào.', role: 'duyen' },
      start_chop: { text: 'Thái lát đều tay và thật cẩn thận nhé.', role: 'duyen' },
      finish_chop: { text: 'Sơ chế xong rồi! Nguyên liệu đều tăm tắp.', role: 'duyen' },
      start_fry: { text: 'Trứng vào chảo nghe xèo xèo đã tai quá!', role: 'duyen' },
      egg_ready: { text: 'Trứng ốp la chín vàng lòng đào chuẩn vị rồi!', role: 'duyen' },
      rice_ready: { text: 'Cơm chiên hạt vàng bóng bẩy thơm nức!', role: 'duyen' },
      burn_warning: { text: 'Ối coi chừng khét lửa, gắp ra mau thôi!', role: 'duyen' },
      deliver_success: { text: 'Món ăn đã sẵn sàng! Chúc quý khách ngon miệng ạ!', role: 'duyen' },
      service_bell: { text: 'Kính coong! Đơn hàng đã hoàn thành xong xuôi!', role: 'duyen' },
      urgent_order: { text: 'Khách đang chờ gấp kìa Duyên ơi, nhanh tay lên nhé!', role: 'chu_ba' },
      shift_end_success: { text: 'Xuất sắc lắm con gái! Một ca làm rất thành công!', role: 'chu_ba' },
      shift_end_fail: { text: 'Không sao con, lần sau chú cháu mình làm tốt hơn nhé!', role: 'chu_ba' },
      chapter_select: { text: 'Chào mừng bạn đến với căn bếp khởi đầu của Duyên!', role: 'duyen' },
    };

    const cue = voiceLines[action];
    if (cue) {
      this.speakVietnamese(cue.text, cue.role);
    }
  }

  private playMelodicVoiceChime(length: number) {
    if (!this.ctx || !this.voiceGain) return;
    const syllables = Math.min(Math.max(Math.floor(length / 5), 2), 8);
    const now = this.ctx.currentTime;
    for (let i = 0; i < syllables; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const pitch = 360 + Math.sin(i * 1.5) * 80;
      osc.frequency.setValueAtTime(pitch, now + i * 0.12);
      gain.gain.setValueAtTime(0.12, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.1);
      osc.connect(gain);
      gain.connect(this.voiceGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.1);
    }
  }

  public dispose() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundEngine();
