import { IMediaProvider, MediaProviderCallbacks } from '../../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// YT Player States
const YT_UNSTARTED = -1;
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;
const YT_VIDEO_CUED = 5;

export class YouTubeProvider implements IMediaProvider {
  private player: any = null;
  private container: HTMLElement | null = null;
  private callbacks: MediaProviderCallbacks | null = null;
  private timeUpdateInterval: any = null;
  private isDestroyed = false;
  private static apiLoadedPromise: Promise<void> | null = null;
  private _isBuffering = false;

  public canHandle(url: string): boolean {
    if (!url) return false;
    return (
      url.includes('youtube.com/watch') ||
      url.includes('youtu.be/') ||
      url.includes('youtube.com/embed/') ||
      url.includes('youtube.com/shorts/')
    );
  }

  public static extractVideoId(url: string): string | null {
    try {
      if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
        return parts || null;
      }
      if (url.includes('youtube.com/shorts/')) {
        const parts = url.split('youtube.com/shorts/')[1]?.split(/[?#]/)[0];
        return parts || null;
      }
      if (url.includes('youtube.com/embed/')) {
        const parts = url.split('youtube.com/embed/')[1]?.split(/[?#]/)[0];
        return parts || null;
      }
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v');
    } catch {
      return null;
    }
  }

  private static loadYouTubeAPI(): Promise<void> {
    if (window.YT && window.YT.Player) {
      return Promise.resolve();
    }
    if (this.apiLoadedPromise) {
      return this.apiLoadedPromise;
    }

    this.apiLoadedPromise = new Promise((resolve) => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        resolve();
      };
    });

    return this.apiLoadedPromise;
  }

  public async load(url: string, container: HTMLElement, callbacks: MediaProviderCallbacks): Promise<void> {
    this.container = container;
    this.callbacks = callbacks;
    this.isDestroyed = false;
    this._isBuffering = false;

    const videoId = YouTubeProvider.extractVideoId(url);
    if (!videoId) {
      callbacks.onError('Invalid YouTube URL or video ID not found');
      return;
    }

    await YouTubeProvider.loadYouTubeAPI();

    if (this.isDestroyed) return;

    // Create target wrapper element for iframe
    const playerId = `yt-player-${Math.random().toString(36).substring(2, 9)}`;
    container.innerHTML = `<div id="${playerId}" class="w-full h-full"></div>`;

    return new Promise((resolve) => {
      this.player = new window.YT.Player(playerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0, // CineMate's own synchronized controls
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (this.isDestroyed) return;
            this.startTimeTracker();
            callbacks.onReady();
            try {
              const dur = this.player.getDuration();
              if (dur) callbacks.onDurationChange(dur);
            } catch {}
            resolve();
          },
          onStateChange: (event: any) => {
            if (this.isDestroyed) return;

            // NOTE: We intentionally do NOT call onPlay/onPause here.
            // The sync system drives play/pause via provider.play()/pause() directly.
            // Firing onPlay/onPause from native YT state events creates an echo loop:
            // remote sync → player.playVideo() → PLAYING event → onPlay callback →
            // emits socket event → server rebroadcasts → infinite loop.
            //
            // We only handle BUFFERING and buffer recovery here.

            if (event.data === YT_BUFFERING) {
              if (!this._isBuffering) {
                this._isBuffering = true;
                callbacks.onBuffer();
              }
            } else if (event.data === YT_PLAYING) {
              if (this._isBuffering) {
                this._isBuffering = false;
                callbacks.onBufferEnd();
              }
            }
            // PAUSED / ENDED / UNSTARTED — handled by usePlaybackSync directly
          },
          onError: (e: any) => {
            let errorMsg = 'Error loading YouTube video';
            if (e.data === 101 || e.data === 150) {
              errorMsg = 'This video does not allow playback outside YouTube. Try another video link.';
            } else if (e.data === 100) {
              errorMsg = 'Video not found or removed.';
            }
            callbacks.onError(errorMsg);
          },
        },
      });
    });
  }

  private startTimeTracker() {
    this.stopTimeTracker();
    this.timeUpdateInterval = setInterval(() => {
      if (this.player && typeof this.player.getCurrentTime === 'function') {
        try {
          const t = this.player.getCurrentTime();
          if (typeof t === 'number') {
            this.callbacks?.onTimeUpdate(t);
          }
        } catch {}
      }
    }, 250);
  }

  private stopTimeTracker() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  public async play(): Promise<void> {
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  public async pause(): Promise<void> {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
  }

  public async seekTo(seconds: number): Promise<void> {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
    }
  }

  public getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      try {
        return this.player.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function') {
      try {
        return this.player.getDuration() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public isPlaying(): boolean {
    if (this.player && typeof this.player.getPlayerState === 'function') {
      return this.player.getPlayerState() === YT_PLAYING;
    }
    return false;
  }

  public setVolume(volume: number): void {
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(Math.round(volume * 100));
    }
  }

  public setMuted(muted: boolean): void {
    if (this.player) {
      if (muted) {
        this.player.mute?.();
      } else {
        this.player.unMute?.();
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stopTimeTracker();
    if (this.player && typeof this.player.destroy === 'function') {
      try {
        this.player.destroy();
      } catch {}
    }
    this.player = null;
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.callbacks = null;
  }
}
