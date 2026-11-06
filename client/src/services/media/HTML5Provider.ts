import { IMediaProvider, MediaProviderCallbacks } from '../../types';

export class HTML5Provider implements IMediaProvider {
  private videoElement: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  private callbacks: MediaProviderCallbacks | null = null;
  private isDestroyed = false;
  private _isBuffering = false;

  public canHandle(url: string): boolean {
    if (!url) return false;
    const cleanUrl = url.toLowerCase().split('?')[0].split('#')[0];
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.endsWith('.m4v') ||
      cleanUrl.endsWith('.mov')
    );
  }

  public async load(url: string, container: HTMLElement, callbacks: MediaProviderCallbacks): Promise<void> {
    this.container = container;
    this.callbacks = callbacks;
    this.isDestroyed = false;
    this._isBuffering = false;

    container.innerHTML = '';
    const video = document.createElement('video');
    video.src = url;
    video.className = 'w-full h-full object-contain bg-black';
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';

    this.videoElement = video;
    container.appendChild(video);

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        if (this.isDestroyed) return;
        callbacks.onDurationChange(video.duration || 0);
        callbacks.onReady();
        resolve();
      };

      // NOTE: onplay/onpause are intentionally NOT connected here.
      // The sync system calls play()/pause() directly via the provider API.
      // These native events would create an echo loop — remote sync triggers
      // play() → native 'play' event fires → onPlay callback → emits socket event → loop.
      // The PlaybackControls UI reads isPlaying state from usePlaybackSync, not from these events.

      video.ontimeupdate = () => {
        if (this.isDestroyed) return;
        callbacks.onTimeUpdate(video.currentTime);
      };

      video.onseeking = () => {
        if (this.isDestroyed) return;
        callbacks.onSeek(video.currentTime);
      };

      video.ondurationchange = () => {
        if (this.isDestroyed) return;
        if (video.duration && isFinite(video.duration)) {
          callbacks.onDurationChange(video.duration);
        }
      };

      // Buffering detection
      video.onwaiting = () => {
        if (this.isDestroyed || this._isBuffering) return;
        this._isBuffering = true;
        callbacks.onBuffer();
      };

      video.onstalled = () => {
        if (this.isDestroyed || this._isBuffering) return;
        this._isBuffering = true;
        callbacks.onBuffer();
      };

      video.oncanplay = () => {
        if (this.isDestroyed || !this._isBuffering) return;
        this._isBuffering = false;
        callbacks.onBufferEnd();
      };

      video.onplaying = () => {
        if (this.isDestroyed) return;
        // If we were buffering and playback resumed naturally, signal buffer end
        if (this._isBuffering) {
          this._isBuffering = false;
          callbacks.onBufferEnd();
        }
      };

      video.onerror = () => {
        if (this.isDestroyed) return;
        callbacks.onError(
          'Failed to load video file. Ensure the URL is directly accessible, CORS-friendly, and in MP4/WebM format.'
        );
      };
    });
  }

  public async play(): Promise<void> {
    if (this.videoElement) {
      try {
        await this.videoElement.play();
      } catch (err: any) {
        // Autoplay policy restriction or aborted
        if (err.name === 'NotAllowedError') {
          this.callbacks?.onError('Click anywhere on the player to enable audio playback (browser autoplay policy)');
        }
        // AbortError is common when play() is called while seeking — ignore it
      }
    }
  }

  public async pause(): Promise<void> {
    if (this.videoElement) {
      this.videoElement.pause();
    }
  }

  public async seekTo(seconds: number): Promise<void> {
    if (this.videoElement) {
      this.videoElement.currentTime = seconds;
    }
  }

  public getCurrentTime(): number {
    return this.videoElement?.currentTime || 0;
  }

  public getDuration(): number {
    return this.videoElement?.duration || 0;
  }

  public isPlaying(): boolean {
    return !!(
      this.videoElement &&
      !this.videoElement.paused &&
      !this.videoElement.ended &&
      this.videoElement.readyState > 2
    );
  }

  public setVolume(volume: number): void {
    if (this.videoElement) {
      this.videoElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public setMuted(muted: boolean): void {
    if (this.videoElement) {
      this.videoElement.muted = muted;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement.load();
      this.videoElement.remove();
      this.videoElement = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.callbacks = null;
  }
}
