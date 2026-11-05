import React, { useState } from 'react';
import { Film, Play, AlertCircle, Sparkles } from 'lucide-react';
import { MediaProviderFactory } from '../../services/media/MediaProviderFactory';

interface MovieUrlInputProps {
  onLoadUrl: (url: string) => void;
  isLoading?: boolean;
  canLoad?: boolean;
}

const SAMPLE_VIDEOS = [
  {
    name: 'Big Buck Bunny (MP4 direct)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'HTML5 Direct',
  },
  {
    name: 'Sintel Blender Animated (MP4 direct)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    type: 'HTML5 Direct',
  },
  {
    name: 'Tears of Steel (MP4 direct)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    type: 'HTML5 Direct',
  },
  {
    name: 'YouTube: Blender Animation',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    type: 'YouTube',
  },
];

export const MovieUrlInput: React.FC<MovieUrlInputProps> = ({ onLoadUrl, isLoading, canLoad = true }) => {
  const [url, setUrl] = useState('');
  const [detectedType, setDetectedType] = useState<string>('none');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    const provider = MediaProviderFactory.detectProvider(val.trim());
    setDetectedType(provider);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onLoadUrl(url.trim());
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setDetectedType(MediaProviderFactory.detectProvider(sampleUrl));
    onLoadUrl(sampleUrl);
  };

  return (
    <div className="bg-[#181824] border border-slate-800 rounded-2xl p-4 shadow-xl">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Film className="w-4 h-4" />
          </div>
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Paste YouTube, Vimeo, MP4/WebM video URL or compatible stream link..."
            disabled={!canLoad || isLoading}
            className="w-full bg-[#11111B] border border-slate-800 focus:border-purple-500 pl-10 pr-24 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
          />

          {detectedType !== 'none' && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {detectedType}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!canLoad || !url.trim() || isLoading}
          className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/25 border border-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isLoading ? 'Loading...' : 'Load Movie'}</span>
        </button>
      </form>

      {/* Preset Fast Sample Links */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" /> Quick test links:
        </span>
        {SAMPLE_VIDEOS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectSample(s.url)}
            className="text-xs bg-[#11111B] hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
};

