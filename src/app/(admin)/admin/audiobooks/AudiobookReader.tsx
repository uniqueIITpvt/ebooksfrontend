'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
} from '@mui/material';

interface AudiobookReaderProps {
  bookData: {
    title: string;
    author: string;
    coverUrl?: string;
    pages: {
      en: string[];
      hi: string[];
    };
    language: 'English' | 'Hindi' | 'Both';
    narratorName?: string;
    audioUrl?: string;
  };
  audioName?: string | null;
  scriptName?: string | null;
  transcriptName?: string | null;
  onAudioUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onScriptUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTranscriptUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onPublish?: () => void;
}

const COLORS = {
  bg: '#f7f6f3',
  surface: '#ffffff',
  border: '#e2e0db',
  borderStrong: '#c8c5be',
  text: '#1a1915',
  muted: '#6b6860',
  hint: '#a09e99',
  purpleLight: '#EEEDFE',
  purpleMid: '#7F77DD',
  purpleDark: '#3C3489',
  purpleBorder: '#AFA9EC',
  greenLight: '#EAF3DE',
  greenText: '#3B6D11',
  gold: '#c8a84b',
};

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function AudiobookReader({
  bookData,
  audioName,
  scriptName,
  transcriptName,
  onAudioUpload,
  onScriptUpload,
  onTranscriptUpload,
  onBack,
  onPublish,
}: AudiobookReaderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const script = useMemo(() => {
    if (bookData.language === 'Hindi') return bookData.pages.hi.join(' ');
    if (bookData.language === 'Both') {
      return [bookData.pages.en.join(' '), bookData.pages.hi.join(' ')].filter(Boolean).join('\n\n');
    }
    return bookData.pages.en.join(' ');
  }, [bookData.language, bookData.pages.en, bookData.pages.hi]);

  const words = useMemo(() => script.trim().split(/\s+/).filter(Boolean), [script]);
  const activeIndex = useMemo(() => {
    if (!words.length || !duration) return -1;
    return Math.min(Math.floor((currentTime / duration) * words.length), words.length - 1);
  }, [currentTime, duration, words.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [bookData.audioUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeIndex]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !bookData.audioUrl) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const hasAudio = Boolean(bookData.audioUrl);
  const hasScript = words.length > 0;
  const ready = hasAudio && hasScript;

  return (
    <Box
      sx={{
        minHeight: 640,
        bgcolor: COLORS.bg,
        color: COLORS.text,
        px: { xs: 2, md: 4 },
        py: 3,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <audio ref={audioRef} preload="metadata" src={bookData.audioUrl || undefined} />

      <Box sx={{ width: '100%', maxWidth: 780 }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 650, display: 'flex', alignItems: 'center', gap: 1 }}>
            Manual Audio Highlighter
          </Typography>
          <Typography sx={{ fontSize: 14, color: COLORS.muted, mt: 0.5 }}>
            Upload the script and MP3 here. Public users hear the uploaded audio while words highlight in sync.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box
            component="label"
            sx={{
              border: `1.5px ${hasAudio ? 'solid' : 'dashed'} ${hasAudio ? '#97C459' : COLORS.borderStrong}`,
              borderRadius: '14px',
              p: 3,
              textAlign: 'center',
              bgcolor: hasAudio ? COLORS.greenLight : COLORS.surface,
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              '&:hover': { borderColor: COLORS.purpleMid, bgcolor: hasAudio ? COLORS.greenLight : COLORS.purpleLight },
            }}
          >
            <input type="file" accept=".mp3,audio/mpeg" hidden onChange={onAudioUpload} />
            <Typography sx={{ fontSize: 26, mb: 1 }}>Audio</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>MP3 Audio</Typography>
            <Typography sx={{ fontSize: 12, color: hasAudio ? COLORS.greenText : COLORS.hint, mt: 0.5 }}>
              {hasAudio ? audioName || 'Uploaded audiobook ready' : 'Upload audiobook MP3'}
            </Typography>
          </Box>

          <Box
            component="label"
            sx={{
              bgcolor: hasScript ? COLORS.greenLight : COLORS.surface,
              border: `1.5px ${hasScript ? 'solid' : 'dashed'} ${hasScript ? '#97C459' : COLORS.borderStrong}`,
              borderRadius: '14px',
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              '&:hover': { borderColor: COLORS.purpleMid, bgcolor: hasScript ? COLORS.greenLight : COLORS.purpleLight },
            }}
          >
            <input type="file" accept=".txt,.md,text/plain" hidden onChange={onScriptUpload} />
            <Typography sx={{ fontSize: 26, mb: 1 }}>Script</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Manual Script</Typography>
            <Typography sx={{ fontSize: 12, color: hasScript ? COLORS.greenText : COLORS.hint, mt: 0.5 }}>
              {hasScript ? scriptName || `${words.length} words loaded` : 'Upload .txt script'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Button
            component="label"
            sx={{
              border: `1px solid ${transcriptName ? '#97C459' : COLORS.border}`,
              color: transcriptName ? COLORS.greenText : COLORS.muted,
              bgcolor: transcriptName ? COLORS.greenLight : COLORS.surface,
              textTransform: 'none',
              borderRadius: '10px',
              px: 2,
              py: 1,
            }}
          >
            {transcriptName || 'Upload timed transcript JSON for exact public sync'}
            <input type="file" accept=".json,application/json" hidden onChange={onTranscriptUpload} />
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            bgcolor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '14px',
            p: 2.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              type="button"
              onClick={togglePlay}
              disabled={!ready}
              sx={{
                minWidth: 44,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: `1.5px solid ${COLORS.purpleBorder}`,
                bgcolor: COLORS.purpleLight,
                color: COLORS.purpleDark,
                fontSize: 18,
                '&:hover': { bgcolor: COLORS.purpleMid, color: '#fff' },
                '&:disabled': { opacity: 0.35 },
              }}
            >
              {isPlaying ? 'II' : 'â–¶'}
            </Button>

            <Box sx={{ flex: 1 }}>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={Math.min(currentTime, duration || currentTime)}
                step={0.05}
                onChange={(event) => seek(Number(event.target.value))}
                style={{ width: '100%', accentColor: COLORS.purpleMid }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.muted }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 1.25, 1.5].map((value) => (
                <Button
                  key={value}
                  onClick={() => setSpeed(value)}
                  sx={{
                    minWidth: 'auto',
                    px: 1.2,
                    py: 0.5,
                    borderRadius: '999px',
                    border: `1px solid ${speed === value ? COLORS.purpleBorder : COLORS.borderStrong}`,
                    bgcolor: speed === value ? COLORS.purpleLight : COLORS.bg,
                    color: speed === value ? COLORS.purpleDark : COLORS.muted,
                    fontSize: 12,
                    fontWeight: 650,
                    textTransform: 'none',
                  }}
                >
                  {value}x
                </Button>
              ))}
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            bgcolor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '14px',
            p: 3,
            minHeight: 210,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: COLORS.hint }}>
              SCRIPT
            </Typography>
            <Typography sx={{ fontSize: 12, color: COLORS.hint }}>
              {hasScript ? `${words.length} words` : ''}
            </Typography>
          </Box>

          <Box
            sx={{
              maxHeight: 320,
              overflowY: 'auto',
              pr: 0.5,
              fontSize: 15.5,
              lineHeight: 1.9,
              color: COLORS.text,
            }}
          >
            {hasScript ? (
              words.map((word, index) => (
                <Box
                  key={`${word}-${index}`}
                  component="span"
                  ref={index === activeIndex ? activeWordRef : null}
                  sx={{
                    display: 'inline',
                    borderRadius: '4px',
                    px: '3px',
                    py: '1px',
                    mr: '2px',
                    color: index < activeIndex ? COLORS.hint : index === activeIndex ? COLORS.purpleDark : COLORS.text,
                    bgcolor: index === activeIndex ? COLORS.purpleLight : 'transparent',
                    transition: 'background 0.08s, color 0.08s',
                  }}
                >
                  {word}
                </Box>
              ))
            ) : (
              <Typography sx={{ fontSize: 14, color: COLORS.hint, fontStyle: 'italic' }}>
                Upload the script. Highlighted text will appear here.
              </Typography>
            )}
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: COLORS.muted, fontSize: 12 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: ready ? '#639922' : COLORS.borderStrong,
              }}
            />
            {ready ? 'Ready to preview uploaded audiobook' : 'Upload both files to get started'}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

