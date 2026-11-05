import { IMediaProvider, MediaProviderType } from '../../types';
import { YouTubeProvider } from './YouTubeProvider';
import { HTML5Provider } from './HTML5Provider';
import { VimeoProvider } from './VimeoProvider';
import { GenericEmbedProvider } from './GenericEmbedProvider';

export class MediaProviderFactory {
  public static detectProvider(url: string): MediaProviderType {
    if (!url) return 'none';
    const yt = new YouTubeProvider();
    if (yt.canHandle(url)) return 'youtube';

    const vimeo = new VimeoProvider();
    if (vimeo.canHandle(url)) return 'vimeo';

    const html5 = new HTML5Provider();
    if (html5.canHandle(url)) return 'html5';

    const embed = new GenericEmbedProvider();
    if (embed.canHandle(url)) return 'embed';

    return 'none';
  }

  public static createProvider(type: MediaProviderType): IMediaProvider | null {
    switch (type) {
      case 'youtube':
        return new YouTubeProvider();
      case 'html5':
        return new HTML5Provider();
      case 'vimeo':
        return new VimeoProvider();
      case 'embed':
        return new GenericEmbedProvider();
      default:
        return null;
    }
  }
}

