"use client";

import { useEffect, useRef } from "react";
import { StorageManager as Storage } from "./storage";

// Sound effects wrapper using Web Audio API
export class SoundManager {
  private static jingleAudio: HTMLAudioElement | null = null;
  private static enabled: boolean = true;
  private static musicEnabled: boolean = false;
  private static musicVolume: number = 0.3;
  private static sfxVolume: number = 0.5;

  // Sound effect configurations
  private static soundConfigs = {
    click: { frequency: 800, duration: 100, waveType: "square" as const },
    success: { frequency: 1200, duration: 150, waveType: "sine" as const },
    error: { frequency: 300, duration: 200, waveType: "sawtooth" as const },
    open: { frequency: 600, duration: 150, waveType: "sine" as const },
    close: { frequency: 400, duration: 100, waveType: "sine" as const },
    type: { frequency: 1000, duration: 50, waveType: "square" as const },
    boot: { frequency: 500, duration: 300, waveType: "triangle" as const },
  };

  static initialize() {
    if (typeof window === "undefined") return;
    if (this.jingleAudio) return; // Already initialized

    // Initialize jingle audio (HTML5 Audio for music)
    this.jingleAudio = new Audio(
      "/music/christmas-dreams-jingle-bells-268299.mp3",
    );
    this.jingleAudio.volume = this.musicVolume;
    this.jingleAudio.loop = true;

    // Get saved preferences
    this.enabled = Storage.isSoundsEnabled();
    this.musicEnabled = Storage.isMusicEnabled();
  }
  static playSound(soundName: keyof typeof SoundManager.soundConfigs) {
    if (!this.enabled || typeof window === "undefined") return;

    try {
      const config = this.soundConfigs[soundName];
      if (config) {
        // Use Web Audio API to generate beep sound
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = config.waveType;
        oscillator.frequency.value = config.frequency;

        // Apply envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          this.sfxVolume * 0.3,
          audioContext.currentTime + 0.01,
        );
        gainNode.gain.linearRampToValueAtTime(
          0,
          audioContext.currentTime + config.duration / 1000,
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + config.duration / 1000);
      }
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  }

  static playJingle() {
    if (!this.musicEnabled || typeof window === "undefined") return;

    try {
      if (this.jingleAudio) {
        this.jingleAudio.play().catch((e) => {
          console.log("Jingle play prevented:", e.message);
        });
      }
    } catch (e) {
      console.error("Error playing jingle:", e);
    }
  }

  static stopJingle() {
    if (typeof window === "undefined") return;

    try {
      if (this.jingleAudio) {
        this.jingleAudio.pause();
        this.jingleAudio.currentTime = 0;
      }
    } catch (e) {
      console.error("Error stopping jingle:", e);
    }
  }

  static toggle() {
    this.enabled = !this.enabled;
    Storage.setSoundsEnabled(this.enabled);

    if (!this.enabled) {
      this.stopJingle();
    }

    return this.enabled;
  }

  static isEnabled() {
    return this.enabled;
  }

  static setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.jingleAudio) {
      this.jingleAudio.volume = this.musicVolume;
    }
  }

  static setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  static toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    Storage.setMusicEnabled(this.musicEnabled);

    if (!this.musicEnabled) {
      this.stopJingle();
    } else {
      this.playJingle();
    }

    return this.musicEnabled;
  }

  static isMusicEnabled() {
    return this.musicEnabled;
  }
}

// React hook for using sounds
export function useSounds() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      SoundManager.initialize();
      initialized.current = true;
    }
  }, []);

  return {
    playSound: (soundName: Parameters<typeof SoundManager.playSound>[0]) =>
      SoundManager.playSound(soundName),
    playJingle: () => SoundManager.playJingle(),
    stopJingle: () => SoundManager.stopJingle(),
    toggle: () => SoundManager.toggle(),
    isEnabled: () => SoundManager.isEnabled(),
    toggleMusic: () => SoundManager.toggleMusic(),
    isMusicEnabled: () => SoundManager.isMusicEnabled(),
    setMusicVolume: (volume: number) => SoundManager.setMusicVolume(volume),
    setSFXVolume: (volume: number) => SoundManager.setSFXVolume(volume),
  };
}
