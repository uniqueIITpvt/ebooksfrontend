'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Languages, Download, Share2 } from 'lucide-react';
import { Button } from '../primitives/Button';

// Types for transcript data
interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface TranscriptLanguage {
  code: string;
  name: string;
  segments: TranscriptSegment[];
}

interface AudioPlayerProps {
  audioSrc: string;
  title: string;
  description?: string;
  transcripts: TranscriptLanguage[];
  defaultLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function AudioPlayer({
  audioSrc,
  title,
  description,
  transcripts,
  defaultLanguage = 'en',
  onLanguageChange,
  onTimeUpdate
}: AudioPlayerProps) {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Get current transcript
  const currentTranscript = transcripts.find(t => t.code === currentLanguage) || transcripts[0];

  // Find active segment based on current time
  const findActiveSegment = useCallback((time: number): TranscriptSegment | null => {
    if (!currentTranscript) return null;
    return currentTranscript.segments.find(
      segment => time >= segment.startTime && time <= segment.endTime
    ) || null;
  }, [currentTranscript]);

  // Format time helper
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      setCurrentTime(current);
      
      // Find and set active segment
      const activeSegment = findActiveSegment(current);
      setActiveSegmentId(activeSegment?.id || null);
      
      // Scroll to active segment only once when audio starts playing
      if (activeSegment && transcriptContainerRef.current && !hasScrolledOnce && isPlaying) {
        const activeElement = document.getElementById(`segment-${activeSegment.id}`);
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHasScrolledOnce(true);
        }
      }

      onTimeUpdate?.(current);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setHasScrolledOnce(false); // Reset scroll flag when audio ends
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [findActiveSegment, onTimeUpdate]);

  // Play/Pause control
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Seek control
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Skip controls
  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Playback rate control
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Language switching
  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    onLanguageChange?.(languageCode);
  };

  // Jump to segment
  const jumpToSegment = (startTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = startTime;
    setCurrentTime(startTime);
    
    // Reset scroll flag when user manually jumps to allow one more auto-scroll
    setHasScrolledOnce(false);
    
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  // Share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: window.location.href
        });
      } catch {}
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            {description && (
              <p className="text-gray-600 text-sm">{description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Player Controls */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div
            ref={progressBarRef}
            className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-150"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg transition-all duration-150"
              style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={skipBackward}>
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={skipForward}>
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between">
          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          {/* Playback Speed */}
          <div className="flex space-x-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
              <Button
                key={rate}
                variant={playbackRate === rate ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handlePlaybackRateChange(rate)}
                className="text-xs"
              >
                {rate}x
              </Button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <Languages className="w-4 h-4 text-gray-500" />
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {transcripts.map(transcript => (
                <option key={transcript.code} value={transcript.code}>
                  {transcript.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transcript Section */}
      {currentTranscript && (
        <div className="border-t border-gray-100">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              Transcript ({currentTranscript.name})
            </h3>
            <p className="text-sm text-gray-600">
              Click on any text to jump to that part of the audio
            </p>
          </div>
          
          <div
            ref={transcriptContainerRef}
            className="max-h-96 overflow-y-auto p-4 space-y-3"
          >
            {currentTranscript.segments.map((segment) => (
              <div
                key={segment.id}
                id={`segment-${segment.id}`}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  activeSegmentId === segment.id
                    ? 'bg-blue-100 border-l-4 border-blue-500 transform scale-[1.02]'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => jumpToSegment(segment.startTime)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-blue-600 font-medium">
                    {formatTime(segment.startTime)}
                  </span>
                  {segment.speaker && (
                    <span className="text-xs text-gray-500 font-medium">
                      {segment.speaker}
                    </span>
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${
                  activeSegmentId === segment.id ? 'text-gray-900 font-medium' : 'text-gray-700'
                }`}>
                  {segment.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
