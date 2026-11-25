import { MajorWorldEventId } from '../types/game';

export type SfxKind = 'click' | 'dice' | 'hit' | 'magic' | 'victory' | 'defeat' | 'coin';

export type AmbientLayerType =
  | 'lute_calm'
  | 'dragon_rumble'
  | 'demon_rift'
  | 'curse_whisper'
  | 'eclipse_drone'
  | 'plague_wind'
  | 'battle_drums'
  | 'arcane_storm'
  | 'caravan_gust'
  | 'monster_drums'
  | 'temple_chime';

export type AmbientProfileKey = 'calm' | MajorWorldEventId;

export interface WorldEventAmbientProfile {
  key: AmbientProfileKey;
  layerType: AmbientLayerType;
  intervalMs: number;
  filterFreq: number;
  oscType: OscillatorType;
  chords: number[][];
  windBandpassFreq?: number;
  drumPattern?: number[];
}

export const WORLD_EVENT_AMBIENT_PROFILES: Record<AmbientProfileKey, WorldEventAmbientProfile> = {
  calm: {
    key: 'calm',
    layerType: 'lute_calm',
    intervalMs: 2600,
    filterFreq: 680,
    oscType: 'triangle',
    chords: [
      [146.83, 220.0, 261.63, 329.63], // Dm7
      [130.81, 196.0, 246.94, 293.66], // Cmaj/G
      [116.54, 174.61, 220.0, 293.66], // Bbmaj7
      [110.0, 164.81, 220.0, 261.63], // Am
    ],
  },
  major_dragon_awakening: {
    key: 'major_dragon_awakening',
    layerType: 'dragon_rumble',
    intervalMs: 2200,
    filterFreq: 460,
    oscType: 'sawtooth',
    chords: [
      [65.41, 98.0, 130.81, 196.0], // Deep C5 power
      [73.42, 110.0, 146.83, 220.0], // D5
      [61.74, 92.5, 123.47, 185.0], // B4 dark fifth
    ],
    drumPattern: [0, 0.75, 1.45],
  },
  major_demon_rift: {
    key: 'major_demon_rift',
    layerType: 'demon_rift',
    intervalMs: 2100,
    filterFreq: 520,
    oscType: 'sawtooth',
    chords: [
      [73.42, 103.83, 138.59, 207.65], // Tritone abyssal
      [69.3, 98.0, 130.81, 196.0],
      [82.41, 116.54, 155.56, 233.08],
    ],
    windBandpassFreq: 280,
  },
  major_spreading_curse: {
    key: 'major_spreading_curse',
    layerType: 'curse_whisper',
    intervalMs: 2500,
    filterFreq: 540,
    oscType: 'sine',
    chords: [
      [123.47, 130.81, 185.0, 246.94], // Phrygian hex
      [110.0, 116.54, 164.81, 220.0],
      [98.0, 103.83, 146.83, 196.0],
    ],
    windBandpassFreq: 620,
  },
  major_blood_eclipse: {
    key: 'major_blood_eclipse',
    layerType: 'eclipse_drone',
    intervalMs: 2800,
    filterFreq: 420,
    oscType: 'triangle',
    chords: [
      [82.41, 123.47, 155.56, 233.08], // E minor dark
      [77.78, 116.54, 146.83, 220.0],
      [73.42, 110.0, 138.59, 207.65],
    ],
  },
  major_black_plague: {
    key: 'major_black_plague',
    layerType: 'plague_wind',
    intervalMs: 2400,
    filterFreq: 380,
    oscType: 'sine',
    chords: [
      [110.0, 116.54, 164.81, 220.0], // Bleak A-Bb-E drone
      [98.0, 103.83, 146.83, 196.0],
      [87.31, 92.5, 130.81, 174.61],
    ],
    windBandpassFreq: 340,
  },
  major_undead_invasion: {
    key: 'major_undead_invasion',
    layerType: 'battle_drums',
    intervalMs: 2000,
    filterFreq: 560,
    oscType: 'triangle',
    chords: [
      [98.0, 146.83, 155.56, 233.08], // Gm grim march
      [87.31, 130.81, 138.59, 207.65],
      [110.0, 164.81, 174.61, 261.63],
    ],
    drumPattern: [0, 0.35, 0.7, 1.05, 1.25, 1.6],
  },
  major_arcane_storm: {
    key: 'major_arcane_storm',
    layerType: 'arcane_storm',
    intervalMs: 1850,
    filterFreq: 960,
    oscType: 'sine',
    chords: [
      [164.81, 246.94, 329.63, 493.88], // Shimmering E9
      [146.83, 220.0, 293.66, 440.0],
      [196.0, 293.66, 392.0, 587.33],
    ],
    windBandpassFreq: 860,
  },
  major_vanishing_caravans: {
    key: 'major_vanishing_caravans',
    layerType: 'caravan_gust',
    intervalMs: 2700,
    filterFreq: 500,
    oscType: 'triangle',
    chords: [
      [130.81, 196.0, 233.08, 293.66], // Sparse Cm9
      [116.54, 174.61, 207.65, 261.63],
      [98.0, 146.83, 174.61, 220.0],
    ],
    windBandpassFreq: 480,
  },
  major_monster_uprising: {
    key: 'major_monster_uprising',
    layerType: 'monster_drums',
    intervalMs: 1950,
    filterFreq: 540,
    oscType: 'sawtooth',
    chords: [
      [87.31, 130.81, 155.56, 207.65], // Primal Fm7
      [82.41, 123.47, 146.83, 196.0],
      [98.0, 146.83, 174.61, 233.08],
    ],
    drumPattern: [0, 0.3, 0.6, 1.0, 1.3],
  },
  major_ancient_temple: {
    key: 'major_ancient_temple',
    layerType: 'temple_chime',
    intervalMs: 2600,
    filterFreq: 820,
    oscType: 'sine',
    chords: [
      [146.83, 207.65, 293.66, 440.0], // Mystical Dsus/dim chime
      [130.81, 196.0, 261.63, 392.0],
      [164.81, 246.94, 329.63, 493.88],
    ],
  },
};

const LEGACY_EVENT_AMBIENT_MAP: Record<string, AmbientProfileKey> = {
  event_dragon_roar: 'major_dragon_awakening',
  event_eclipse: 'major_blood_eclipse',
  event_frost_gale: 'major_black_plague',
  event_ember_rain: 'major_arcane_storm',
  event_market_boon: 'major_vanishing_caravans',
  event_ancient_omen: 'major_ancient_temple',
};

export function resolveAmbientProfileKey(
  activeEventIds?: MajorWorldEventId[],
  legacyEventId?: string | null
): AmbientProfileKey {
  if (activeEventIds && activeEventIds.length > 0) {
    for (let i = activeEventIds.length - 1; i >= 0; i--) {
      const id = activeEventIds[i];
      if (id in WORLD_EVENT_AMBIENT_PROFILES) {
        return id;
      }
    }
  }
  if (legacyEventId && legacyEventId in LEGACY_EVENT_AMBIENT_MAP) {
    return LEGACY_EVENT_AMBIENT_MAP[legacyEventId];
  }
  return 'calm';
}

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private musicPlaying = false;
  private stepIndex = 0;

  private activeProfileKey: AmbientProfileKey = 'calm';

  private musicEnabled = false;
  private sfxEnabled = true;
  private musicVolume = 0.35;
  private sfxVolume = 0.55;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? this.musicVolume * 0.25 : 0;
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = lastOut * 2.5;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  configure(opts: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
  }): void {
    this.musicEnabled = opts.musicEnabled;
    this.sfxEnabled = opts.sfxEnabled;
    this.musicVolume = Math.max(0, Math.min(1, opts.musicVolume));
    this.sfxVolume = Math.max(0, Math.min(1, opts.sfxVolume));

    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(
        this.musicEnabled ? this.musicVolume * 0.25 : 0,
        this.ctx.currentTime,
        0.08
      );
    }
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(
        this.sfxEnabled ? this.sfxVolume : 0,
        this.ctx.currentTime,
        0.04
      );
    }

    if (this.musicEnabled) {
      this.startAmbientLoop();
    } else {
      this.stopAmbientLoop();
    }
  }

  getActiveAmbientProfile(): WorldEventAmbientProfile {
    return WORLD_EVENT_AMBIENT_PROFILES[this.activeProfileKey];
  }

  setActiveWorldEvents(
    activeEventIds: MajorWorldEventId[],
    legacyEventId?: string | null
  ): AmbientProfileKey {
    const nextKey = resolveAmbientProfileKey(activeEventIds, legacyEventId);
    const changed = nextKey !== this.activeProfileKey;
    this.activeProfileKey = nextKey;

    if (changed && this.musicPlaying) {
      this.stepIndex = 0;
      this.stopAmbientLoop();
      this.startAmbientLoop();
    }

    return nextKey;
  }

  unlock(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.musicEnabled && !this.musicPlaying) {
      this.startAmbientLoop();
    }
  }

  private scheduleWindLayer(
    ctx: AudioContext,
    dest: AudioNode,
    now: number,
    durationSec: number,
    bandpassFreq: number,
    peakGain: number
  ): void {
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.6, now);
    filter.frequency.setValueAtTime(bandpassFreq * 0.85, now);
    filter.frequency.linearRampToValueAtTime(bandpassFreq * 1.3, now + durationSec * 0.45);
    filter.frequency.linearRampToValueAtTime(bandpassFreq * 0.8, now + durationSec);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peakGain, now + durationSec * 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    src.connect(filter);
    filter.connect(env);
    env.connect(dest);

    src.start(now);
    src.stop(now + durationSec + 0.05);
  }

  private scheduleBattleDrumHit(
    ctx: AudioContext,
    dest: AudioNode,
    hitTime: number,
    accent: boolean
  ): void {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    const startFreq = accent ? 112 : 92;
    osc.frequency.setValueAtTime(startFreq, hitTime);
    osc.frequency.exponentialRampToValueAtTime(38, hitTime + 0.22);

    env.gain.setValueAtTime(0.001, hitTime);
    env.gain.exponentialRampToValueAtTime(accent ? 0.38 : 0.24, hitTime + 0.014);
    env.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.26);

    osc.connect(env);
    env.connect(dest);
    osc.start(hitTime);
    osc.stop(hitTime + 0.28);

    // Subtle crisp drum skin transient
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(accent ? 700 : 900, hitTime);
    const nEnv = ctx.createGain();
    nEnv.gain.setValueAtTime(0.001, hitTime);
    nEnv.gain.exponentialRampToValueAtTime(accent ? 0.11 : 0.06, hitTime + 0.01);
    nEnv.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.09);

    noise.connect(hp);
    hp.connect(nEnv);
    nEnv.connect(dest);
    noise.start(hitTime);
    noise.stop(hitTime + 0.1);
  }

  private scheduleAmbientMeasure(): void {
    if (!this.musicEnabled || !this.ctx || !this.musicGain) return;
    const profile = WORLD_EVENT_AMBIENT_PROFILES[this.activeProfileKey];
    const chord = profile.chords[this.stepIndex % profile.chords.length];
    this.stepIndex += 1;

    const now = this.ctx.currentTime;
    const measureSec = profile.intervalMs / 1000;
    const stepSpacing =
      profile.layerType === 'arcane_storm' || profile.layerType === 'temple_chime' ? 0.28 : 0.42;

    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const env = this.ctx.createGain();

      osc.type = idx === 0 ? profile.oscType : 'sine';
      const start = now + idx * stepSpacing;
      osc.frequency.setValueAtTime(freq, start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(profile.filterFreq, start);

      const peak =
        profile.layerType === 'plague_wind' || profile.layerType === 'curse_whisper'
          ? idx === 0
            ? 0.16
            : 0.08
          : idx === 0
            ? 0.21
            : 0.11;

      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(peak, start + 0.28);
      env.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(1.8, measureSec - 0.15));

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.musicGain);

      osc.start(start);
      osc.stop(start + Math.max(1.9, measureSec));
    });

    // Event-specific procedural ambient layers
    if (profile.windBandpassFreq) {
      const peakWind =
        profile.layerType === 'plague_wind'
          ? 0.26
          : profile.layerType === 'curse_whisper' || profile.layerType === 'caravan_gust'
            ? 0.2
            : 0.15;
      this.scheduleWindLayer(
        this.ctx,
        this.musicGain,
        now,
        measureSec * 0.95,
        profile.windBandpassFreq,
        peakWind
      );
    }

    if (profile.drumPattern && profile.drumPattern.length > 0) {
      profile.drumPattern.forEach((offset, idx) => {
        if (!this.ctx || !this.musicGain) return;
        this.scheduleBattleDrumHit(this.ctx, this.musicGain, now + offset, idx === 0 || idx === 3);
      });
    }

    if (profile.layerType === 'temple_chime' || profile.layerType === 'eclipse_drone') {
      const chimeFreq = profile.layerType === 'temple_chime' ? 587.33 : 233.08;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(chimeFreq, now + 0.6);
      env.gain.setValueAtTime(0.0001, now + 0.6);
      env.gain.exponentialRampToValueAtTime(0.09, now + 0.63);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
      osc.connect(env);
      env.connect(this.musicGain);
      osc.start(now + 0.6);
      osc.stop(now + 2.15);
    }
  }

  startAmbientLoop(): void {
    if (typeof window === 'undefined' || !this.musicEnabled || this.musicPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const profile = WORLD_EVENT_AMBIENT_PROFILES[this.activeProfileKey];
    this.musicPlaying = true;
    this.scheduleAmbientMeasure();
    this.musicTimer = window.setInterval(() => {
      this.scheduleAmbientMeasure();
    }, profile.intervalMs);
  }

  stopAmbientLoop(): void {
    this.musicPlaying = false;
    if (typeof window !== 'undefined' && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playWorldEventSting(eventId: MajorWorldEventId): void {
    if (!this.sfxEnabled || this.sfxVolume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const profile = WORLD_EVENT_AMBIENT_PROFILES[eventId];
    const now = ctx.currentTime;

    if (profile.windBandpassFreq) {
      this.scheduleWindLayer(ctx, this.sfxGain, now, 0.9, profile.windBandpassFreq, 0.22);
    }
    if (profile.drumPattern) {
      this.scheduleBattleDrumHit(ctx, this.sfxGain, now, true);
      this.scheduleBattleDrumHit(ctx, this.sfxGain, now + 0.28, false);
    }
    const baseNote = profile.chords[0][0] * 2;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = profile.oscType;
    osc.frequency.setValueAtTime(baseNote, now);
    osc.frequency.exponentialRampToValueAtTime(baseNote * 0.92, now + 0.55);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.14, now + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  playSfx(kind: SfxKind): void {
    if (!this.sfxEnabled || this.sfxVolume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const playTone = (
      freqStart: number,
      freqEnd: number,
      duration: number,
      type: OscillatorType,
      offset = 0,
      peak = 0.22
    ) => {
      if (!this.sfxGain) return;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now + offset);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + offset + duration);
      env.gain.setValueAtTime(0.001, now + offset);
      env.gain.exponentialRampToValueAtTime(peak, now + offset + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now + offset);
      osc.stop(now + offset + duration + 0.02);
    };

    switch (kind) {
      case 'click':
        playTone(440, 320, 0.06, 'triangle', 0, 0.12);
        break;
      case 'dice':
        playTone(260, 420, 0.05, 'square', 0, 0.08);
        playTone(340, 560, 0.06, 'triangle', 0.06, 0.11);
        playTone(480, 620, 0.08, 'triangle', 0.12, 0.12);
        break;
      case 'hit':
        playTone(170, 65, 0.16, 'sawtooth', 0, 0.22);
        playTone(290, 110, 0.1, 'triangle', 0.02, 0.15);
        break;
      case 'magic':
        playTone(520, 880, 0.22, 'sine', 0, 0.16);
        playTone(780, 1180, 0.24, 'triangle', 0.06, 0.12);
        break;
      case 'coin':
        playTone(987, 1318, 0.09, 'sine', 0, 0.14);
        playTone(1318, 1760, 0.14, 'sine', 0.07, 0.12);
        break;
      case 'victory':
        playTone(392, 392, 0.14, 'triangle', 0, 0.16);
        playTone(493.88, 493.88, 0.14, 'triangle', 0.12, 0.16);
        playTone(587.33, 587.33, 0.28, 'triangle', 0.24, 0.18);
        break;
      case 'defeat':
        playTone(246.94, 185, 0.22, 'sawtooth', 0, 0.16);
        playTone(185, 110, 0.34, 'triangle', 0.18, 0.18);
        break;
    }
  }
}

export const soundEngine = new WebAudioEngine();
