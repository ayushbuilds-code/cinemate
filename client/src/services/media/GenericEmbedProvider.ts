import { IMediaProvider, MediaProviderCallbacks } from '../../types';

export class GenericEmbedProvider implements IMediaProvider {
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;
  private callbacks: MediaProviderCallbacks | null = null;

  public canHandle(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  public async load(url: string, container: HTMLElement, callbacks: MediaProviderCallbacks): Promise<void> {
    this.container = container;
    this.callbacks = callbacks;

    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.className = 'w-full h-full border-0 rounded-lg';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    // Notice banner for user about third-party un-synchronized embedding
    const banner = document.createElement('div');
    banner.className = 'absolute top-3 left-3 right-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs px-3 py-2 rounded-lg backdrop-blur-md flex items-center justify-between z-10 pointer-events-auto';
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <span>ℹ️</span>
        <span>Embedded successfully, but synchronized controls are not supported for this source.</span>
      </div>
      <button class="text-amber-300 font-medium hover:underline ml-2" onclick="this.parentElement.remove()">Dismiss</button>
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'relative w-full h-full';
    wrapper.appendChild(banner);
    wrapper.appendChild(iframe);

    container.appendChild(wrapper);
    this.iframe = iframe;

    iframe.onload = () => {
      callbacks.onReady();
    };

    iframe.onerror = () => {
      callbacks.onError('This website does not allow playback inside CineMate. Try a supported video link.');
    };
  }

  public async play(): Promise<void> {}
  public async pause(): Promise<void> {}
  public async seekTo(): Promise<void> {}
  public getCurrentTime(): number { return 0; }
  public getDuration(): number { return 0; }
  public isPlaying(): boolean { return false; }
  public setVolume(): void {}
  public setMuted(): void {}

  public destroy(): void {
    if (this.iframe) {
      this.iframe.src = 'about:blank';
      this.iframe.remove();
      this.iframe = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.callbacks = null;
  }
}

