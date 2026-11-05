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

    // Notice banner for user explaining third-party embed limitations & direct link button
    const banner = document.createElement('div');
    banner.className = 'absolute top-3 left-3 right-3 bg-[#181824]/95 border border-amber-500/40 text-amber-200 text-xs px-3.5 py-2.5 rounded-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-auto shadow-2xl';
    banner.innerHTML = `
      <div class="flex items-center gap-2 flex-1">
        <span class="text-base">⚠️</span>
        <div>
          <p class="font-semibold text-slate-200">Third-Party Website Notice</p>
          <p class="text-[11px] text-slate-400">If this website refuses to connect, it has enabled <code class="text-amber-300 font-mono">X-Frame-Options: DENY</code> which blocks embedding.</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
          Open in New Tab ↗
        </a>
        <button class="text-slate-400 hover:text-white text-xs px-2 py-1 rounded" onclick="this.closest('.z-20').remove()">✕</button>
      </div>
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
      callbacks.onError('This website does not allow playback inside CineMate. Try a supported video link or direct MP4/WebM URL.');
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
