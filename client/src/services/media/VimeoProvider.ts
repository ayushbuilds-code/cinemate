import { IMediaProvider, MediaProviderCallbacks } from '../../types';

declare global {
  interface Window {
    Vimeo: any;
  }
}

export class VimeoProvider implements IMediaProvider {
  private player: any = null;
  private container: HTMLElement | null = null;
  private callbacks: MediaProviderCallbacks | null = null;
  private isDestroyed = false;
  private static apiLoadedPromise: Promise<void> | null = null;

  public canHandle(url: string): boolean {
    if (!url) return false;
    return url.includes('vimeo.com/') || url.includes('player.vimeo.com/video/');
  }

  private static loadVimeoSDK(): Promise<void> {
    if (window.Vimeo && window.Vimeo.Player) {
      return Promise.resolve();
    }
    if (this.apiLoadedPromise) {
      return this.apiLoadedPromise;
    }

    this.apiLoadedPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Vimeo SDK'));
      document.head.appendChild(script);
    });

    return this.apiLoadedPromise;
  }

  public async load(url: string, container: HTMLElement, callbacks: MediaProviderCallbacks): Promise<void> {
    this.container = container;
    this.callbacks = callbacks;
    this.isDestroyed = false;

    await VimeoProvider.loadVimeoSDK();
    if (this.isDestroyed) return;

    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full h-full flex items-center justify-center';
    container.appendChild(wrapper);

    try {
      this.player = new window.Vimeo.Player(wrapper, {
        url,
        responsive: true,
        autoplay: false,
        controls: false, // Unified player controls
      });

      await this.player.ready();
      if (this.isDestroyed) return;

      const dur = await this.player.getDuration();
      callbacks.onDurationChange(dur || 0);
      callbacks.onReady();

      this.player.on('play', (data: any) => {
        callbacks.onPlay(data.seconds);
      });

      this.player.on('pause', (data: any) => {
        callbacks.onPause(data.seconds);
      });

      this.player.on('timeupdate', (data: any) => {
        callbacks.onTimeUpdate(data.seconds);
      });

      this.player.on('seeked', (data: any) => {
        callbacks.onSeek(data.seconds);
      });

      this.player.on('error', (err: any) => {
        callbacks.onError(err.message || 'Error occurred during Vimeo playback');
      });
    } catch (err: any) {
      callbacks.onError(
        'Unable to load Vimeo video. Ensure the video is public and permits embedding.'
      );
    }
  }

  public async play(): Promise<void> {
    try {
      await this.player?.play();
    } catch {}
  }

  public async pause(): Promise<void> {
    try {
      await this.player?.pause();
    } catch {}
  }

  public async seekTo(seconds: number): Promise<void> {
    try {
      await this.player?.setCurrentTime(seconds);
    } catch {}
  }

  public getCurrentTime(): number {
    return 0; // Handled dynamically via timeupdate events in Vimeo SDK
  }

  public getDuration(): number {
    return 0;
  }

  public isPlaying(): boolean {
    return false;
  }

  public setVolume(volume: number): void {
    try {
      this.player?.setVolume(volume);
    } catch {}
  }

  public setMuted(muted: boolean): void {
    try {
      this.player?.setMuted(muted);
    } catch {}
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.player) {
      try {
        this.player.destroy();
      } catch {}
      this.player = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.callbacks = null;
  }
}

