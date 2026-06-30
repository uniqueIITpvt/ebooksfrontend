'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Save, Download, Upload, Zap, Clock, Check } from 'lucide-react';
import { Button } from '../primitives/Button';

interface SyncSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
  status: 'pending' | 'syncing' | 'synced';
}

interface TranscriptSyncToolProps {
  audioSrc: string;
  rawScript: string;
  onSyncComplete?: (syncedSegments: SyncSegment[]) => void;
}

export default function TranscriptSyncTool({
  audioSrc,
  rawScript,
  onSyncComplete
}: TranscriptSyncToolProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState<SyncSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [syncMode, setSyncMode] = useState<'manual' | 'auto'>('manual');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize segments from raw script
  useEffect(() => {
    if (rawScript) {
      const sentences = rawScript
        .split(/[.!?]+/)
        .filter(sentence => sentence.trim().length > 10)
        .map((sentence, index) => ({
          id: `segment-${index + 1}`,
          text: sentence.trim() + (sentence.includes('?') ? '?' : sentence.includes('!') ? '!' : '.'),
          startTime: 0,
          endTime: 0,
          speaker: 'Dr. Syed M. Quadri',
          status: 'pending' as const
        }));
      
      setSegments(sentences);
      segmentRefs.current = new Array(sentences.length);
    }
  }, [rawScript]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Format time helper
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = time;
    setCurrentTime(time);
  };

  // Mark start time for current segment
  const markStartTime = () => {
    if (currentSegmentIndex < segments.length) {
      const updatedSegments = [...segments];
      updatedSegments[currentSegmentIndex] = {
        ...updatedSegments[currentSegmentIndex],
        startTime: currentTime,
        status: 'syncing'
      };
      setSegments(updatedSegments);
    }
  };

  // Mark end time for current segment
  const markEndTime = () => {
    if (currentSegmentIndex < segments.length) {
      const updatedSegments = [...segments];
      updatedSegments[currentSegmentIndex] = {
        ...updatedSegments[currentSegmentIndex],
        endTime: currentTime,
        status: 'synced'
      };
      setSegments(updatedSegments);
      
      // Auto-advance to next segment
      if (currentSegmentIndex < segments.length - 1) {
        setCurrentSegmentIndex(currentSegmentIndex + 1);
        
        // Scroll to next segment
        const nextSegmentRef = segmentRefs.current[currentSegmentIndex + 1];
        if (nextSegmentRef) {
          nextSegmentRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Auto-sync using speech detection (simplified version)
  const autoSync = () => {
    setSyncMode('auto');
    
    // This is a simplified auto-sync - you could integrate with Web Speech API
    // or use silence detection for automatic segment boundaries
    const segmentDuration = duration / segments.length;
    
    const updatedSegments = segments.map((segment, index) => ({
      ...segment,
      startTime: index * segmentDuration,
      endTime: (index + 1) * segmentDuration,
      status: 'synced' as const
    }));
    
    setSegments(updatedSegments);
    alert('Auto-sync completed! Please review and adjust timing manually if needed.');
  };

  // Export synced transcript
  const exportTranscript = () => {
    const exportData = {
      audioMetadata: {
        title: "Demo Audiobook Experience",
        description: "Dr. Syed M. Quadri introduces the upcoming voice book platform",
        audioSrc: audioSrc,
        duration: duration,
        speaker: "Dr. Syed M. Quadri"
      },
      segments: segments.filter(seg => seg.status === 'synced')
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synced-transcript.json';
    a.click();
    URL.revokeObjectURL(url);

    onSyncComplete?.(segments.filter(seg => seg.status === 'synced'));
  };

  // Import existing transcript
  const importTranscript = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.segments) {
          setSegments(data.segments);
        }
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const getSegmentStyle = (segment: SyncSegment, index: number) => {
    if (index === currentSegmentIndex) {
      return 'bg-blue-100 border-l-4 border-blue-500 shadow-md';
    }
    if (segment.status === 'synced') {
      return 'bg-green-50 border-l-2 border-green-400';
    }
    if (segment.status === 'syncing') {
      return 'bg-yellow-50 border-l-2 border-yellow-400';
    }
    return 'bg-gray-50 border-l-2 border-gray-200';
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transcript Sync Tool</h2>
            <p className="text-gray-600 text-sm">
              Sync your script with audio timing. Play audio and mark start/end times for each segment.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={autoSync}>
              <Zap className="w-4 h-4 mr-2" />
              Auto-Sync
            </Button>
            <Button variant="outline" size="sm" onClick={exportTranscript}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => document.getElementById('transcript-import')?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                id="transcript-import"
                type="file"
                accept=".json"
                onChange={importTranscript}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="p-6 border-b border-gray-100">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full h-2 bg-gray-200 rounded-full relative">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* Segment markers */}
            {segments.map((segment, index) => (
              segment.status === 'synced' && (
                <div
                  key={segment.id}
                  className="absolute top-0 h-full w-1 bg-green-500"
                  style={{ left: `${(segment.startTime / duration) * 100}%` }}
                  title={`Segment ${index + 1} start`}
                />
              )
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => seekTo(Math.max(0, currentTime - 5))}>
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
          
          <Button variant="ghost" size="sm" onClick={() => seekTo(Math.min(duration, currentTime + 5))}>
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Sync Controls */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={markStartTime}
            disabled={currentSegmentIndex >= segments.length}
            className="flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>Mark Start ({formatTime(currentTime)})</span>
          </Button>
          
          <Button
            onClick={markEndTime}
            disabled={currentSegmentIndex >= segments.length || segments[currentSegmentIndex]?.status !== 'syncing'}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Mark End ({formatTime(currentTime)})</span>
          </Button>
        </div>
      </div>

      {/* Script Segments */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Script Segments ({segments.filter(s => s.status === 'synced').length}/{segments.length} synced)
          </h3>
          <div className="text-sm text-gray-600">
            Current: Segment {currentSegmentIndex + 1}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-3">
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              ref={(el) => { segmentRefs.current[index] = el; }}
              className={`p-4 rounded-lg border transition-all duration-200 ${getSegmentStyle(segment, index)}`}
              onClick={() => setCurrentSegmentIndex(index)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900">
                  Segment {index + 1}
                </span>
                <div className="flex items-center space-x-2">
                  {segment.status === 'synced' && (
                    <span className="text-xs text-green-600 font-medium">
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    segment.status === 'synced' ? 'bg-green-100 text-green-700' :
                    segment.status === 'syncing' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {segment.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {segment.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <h4 className="font-medium text-gray-900 mb-2">How to Sync:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Play the audio and listen to each segment</li>
          <li>2. Click "Mark Start" when a segment begins</li>
          <li>3. Click "Mark End" when the segment finishes</li>
          <li>4. The tool will automatically move to the next segment</li>
          <li>5. Export the synced transcript when complete</li>
        </ol>
      </div>
    </div>
  );
}
