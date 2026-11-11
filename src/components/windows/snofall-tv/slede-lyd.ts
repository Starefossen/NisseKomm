import { SoundManager } from "@/lib/sounds";

/**
 * Synthesized sound for the sledesimulator on SoundManager's shared context:
 * a filtered-noise wind that follows the speed, bells at beacons, a dull
 * crash, a rising sprang arpeggio and a brass-ish fanfare. Nothing plays
 * when the app's sounds are off (SoundManager.context() is null).
 */
export class SledeLyd {
  private vind: {
    src: AudioBufferSourceNode;
    filter: BiquadFilterNode;
    gain: GainNode;
  } | null = null;

  startVind() {
    const ctx = SoundManager.context();
    if (!ctx || this.vind) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 400;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    this.vind = { src, filter, gain };
  }

  /** fart 0..2 (1 = cruise); kast −1..1 pushes the pitch for gusts. */
  setVind(fart: number, kast: number) {
    const ctx = SoundManager.context();
    if (!ctx) {
      // Sounds were switched off mid-flight.
      if (this.vind) this.vind.gain.gain.value = 0;
      return;
    }
    if (!this.vind) this.startVind();
    if (!this.vind) return;
    const t = ctx.currentTime;
    this.vind.filter.frequency.setTargetAtTime(
      250 + fart * 600 + Math.abs(kast) * 500,
      t,
      0.15,
    );
    this.vind.gain.gain.setTargetAtTime(
      0.05 + fart * 0.06 + Math.abs(kast) * 0.05,
      t,
      0.2,
    );
  }

  stop() {
    if (!this.vind) return;
    try {
      this.vind.src.stop();
    } catch {}
    this.vind.src.disconnect();
    this.vind.gain.disconnect();
    this.vind = null;
  }

  private tone(
    ctx: AudioContext,
    freq: number,
    at: number,
    dur: number,
    type: OscillatorType,
    vol: number,
  ) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    o.connect(g).connect(ctx.destination);
    o.start(at);
    o.stop(at + dur + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  /** The bell climbs a step per multiplier so a long run sounds like a run. */
  bjelle(mult = 1) {
    const ctx = SoundManager.context();
    if (!ctx) return;
    const t = ctx.currentTime;
    const k = Math.pow(2, (mult - 1) / 6);
    this.tone(ctx, 1800 * k, t, 0.25, "sine", 0.18);
    this.tone(ctx, 2400 * k, t + 0.06, 0.3, "sine", 0.12);
    this.tone(ctx, 3600 * k, t + 0.06, 0.12, "triangle", 0.05);
  }

  stjerne() {
    const ctx = SoundManager.context();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(ctx, 1320, t, 0.1, "square", 0.05);
    this.tone(ctx, 1760, t + 0.07, 0.14, "square", 0.05);
  }

  krasj() {
    const ctx = SoundManager.context();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(ctx, 90, t, 0.35, "square", 0.2);
    this.tone(ctx, 60, t + 0.05, 0.4, "sawtooth", 0.12);
    // The reindeer sneeze the snow out again.
    this.tone(ctx, 700, t + 0.5, 0.08, "triangle", 0.08);
    this.tone(ctx, 500, t + 0.58, 0.14, "triangle", 0.08);
  }

  sprang() {
    const ctx = SoundManager.context();
    if (!ctx) return;
    const t = ctx.currentTime;
    [440, 554, 659, 880, 1109, 1319].forEach((f, i) =>
      this.tone(ctx, f, t + i * 0.05, 0.16, "square", 0.06),
    );
    this.tone(ctx, 110, t + 0.3, 1.6, "sawtooth", 0.05);
  }

  port() {
    const ctx = SoundManager.context();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784].forEach((f, i) =>
      this.tone(ctx, f, t + i * 0.09, 0.6, "triangle", 0.12),
    );
  }

  fanfare() {
    const ctx = SoundManager.context();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      this.tone(ctx, f, t + i * 0.14, 0.5, "triangle", 0.14);
      this.tone(ctx, f / 2, t + i * 0.14, 0.5, "sawtooth", 0.04);
    });
    this.tone(ctx, 1047, t + 0.7, 1.2, "triangle", 0.12);
  }
}
