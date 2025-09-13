import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Play, 
  ExternalLink, 
  Heart, 
  Search, 
  Loader, 
  AlertCircle,
  Sparkles,
  Headphones,
  Volume2,
  Clock,
  User,
  Album,
  Shuffle,
  SkipForward,
  RefreshCw
} from 'lucide-react';
import jiosaavnService from '../services/jiosaavnService';

interface JioSaavnMusicPlayerProps {
  currentEmotion: string;
  isVisible: boolean;
  onClose: () => void;
}

interface JioSaavnTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  image: string;
  url: string;
  preview_url?: string;
  external_urls: {
    jiosaavn: string;
  };
  emotion?: string;
}

interface JioSaavnPlaylist {
  id: string;
  name: string;
  description: string;
  image: string;
  tracks: JioSaavnTrack[];
  external_urls: {
    jiosaavn: string;
  };
}

const JioSaavnMusicPlayer: React.FC<JioSaavnMusicPlayerProps> = ({ 
  currentEmotion, 
  isVisible, 
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{
    tracks: JioSaavnTrack[];
    playlists: JioSaavnPlaylist[];
  }>({ tracks: [], playlists: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JioSaavnTrack[]>([]);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'playlists' | 'search'>('recommendations');
  const [isSearching, setIsSearching] = useState(false);

  // Load emotion-based recommendations when component mounts or emotion changes
  useEffect(() => {
    if (isVisible && currentEmotion) {
      loadEmotionRecommendations();
    }
  }, [isVisible, currentEmotion]);

  const loadEmotionRecommendations = async () => {
    if (!jiosaavnService.isConfigured()) {
      setError('JioSaavn integration not configured properly.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await jiosaavnService.getEmotionBasedRecommendations(currentEmotion);
      
      const tracks = result.tracks.map(track => 
        jiosaavnService.convertToTrack(track, currentEmotion)
      );
      
      setRecommendations({
        tracks,
        playlists: result.playlists
      });
    } catch (err) {
      console.error('Failed to load JioSaavn recommendations:', err);
      setError('Unable to load JioSaavn recommendations. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const results = await jiosaavnService.searchTracksByQuery(searchQuery);
      setSearchResults(results);
      setActiveTab('search');
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayTrack = (track: JioSaavnTrack) => {
    if (track.preview_url) {
      // Play preview if available
      const audio = new Audio(track.preview_url);
      audio.play().catch(console.error);
    } else {
      // Open in JioSaavn
      window.open(track.external_urls.jiosaavn, '_blank');
    }
  };

  const handleOpenInJioSaavn = (url: string) => {
    window.open(url, '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border-2 border-neutral-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">JioSaavn Music Therapy</h2>
                  <p className="text-green-100">Emotion: {currentEmotion}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200">
          {[
            { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
            { id: 'playlists', label: 'Playlists', icon: Album },
            { id: 'search', label: 'Search', icon: Search }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                activeTab === id
                  ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          
          {/* Search Bar */}
          {activeTab === 'search' && (
            <div className="mb-6">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search songs, artists, or albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSearching ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span>Search</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                <p className="text-neutral-600">Loading music recommendations...</p>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && !isLoading && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-neutral-800">
                  Recommended for {currentEmotion} mood
                </h3>
                <button
                  onClick={loadEmotionRecommendations}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="grid gap-4">
                {recommendations.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-xl hover:bg-green-50 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-800 truncate">{track.title}</h4>
                      <p className="text-sm text-neutral-600 truncate">{track.artist}</p>
                      <p className="text-xs text-neutral-500 truncate">{track.album}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-neutral-500">{formatDuration(track.duration)}</span>
                      <button
                        onClick={() => handlePlayTrack(track)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenInJioSaavn(track.external_urls.jiosaavn)}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists Tab */}
          {activeTab === 'playlists' && !isLoading && (
            <div>
              <h3 className="text-xl font-bold text-neutral-800 mb-6">
                Therapeutic Playlists
              </h3>

              <div className="grid gap-4">
                {recommendations.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-xl hover:bg-green-50 transition-colors group"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Album className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-800 truncate">{playlist.name}</h4>
                      <p className="text-sm text-neutral-600 truncate">{playlist.description}</p>
                      <p className="text-xs text-neutral-500">{playlist.tracks.length} tracks</p>
                    </div>

                    <button
                      onClick={() => handleOpenInJioSaavn(playlist.external_urls.jiosaavn)}
                      className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Open</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Tab */}
          {activeTab === 'search' && !isSearching && (
            <div>
              <h3 className="text-xl font-bold text-neutral-800 mb-6">
                Search Results for "{searchQuery}"
              </h3>

              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No results found. Try a different search term.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-xl hover:bg-green-50 transition-colors group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-800 truncate">{track.title}</h4>
                        <p className="text-sm text-neutral-600 truncate">{track.artist}</p>
                        <p className="text-xs text-neutral-500 truncate">{track.album}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-neutral-500">{formatDuration(track.duration)}</span>
                        <button
                          onClick={() => handlePlayTrack(track)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenInJioSaavn(track.external_urls.jiosaavn)}
                          className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && activeTab === 'recommendations' && recommendations.tracks.length === 0 && (
            <div className="text-center py-12">
              <Headphones className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">No recommendations available for this emotion.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <div className="flex items-center space-x-2">
              <Music className="w-4 h-4" />
              <span>Powered by JioSaavn</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>🎵 Music Therapy</span>
              <span>💚 Mental Wellness</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JioSaavnMusicPlayer;
