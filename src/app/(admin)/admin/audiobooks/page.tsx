'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  InputBase,
  IconButton,
  Pagination,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Add, Refresh, Search, CloudUpload, AutoAwesome } from '@mui/icons-material';

import { audiobooksApi } from '@/services/api/audiobooksApi';
import { categoriesApi, type Category } from '@/services/api/categoriesApi';
import { API_CONFIG } from '@/config/api';
import type { Audiobook, AudiobookPayload } from '@/services/api/audiobooksApi';
import AdminAudiobooksTable from './parts/AdminAudiobooksTable';
import AudiobookDialog from './parts/AudiobookDialog';
import AudiobooksTopControls from './parts/AudiobooksTopControls';
import AudiobookReader from './AudiobookReader';
import {
  MAX_AUDIOBOOK_SIZE_BYTES,
  MAX_AUDIOBOOK_SIZE_MB,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  statuses,
} from './constants';
import type { AudiobookForm, ScriptData, ScriptLanguageKey, SnackbarState } from './types';
import {
  buildPreviewPages,
  getRequiredScriptKeys,
  getGeneratedAudioFile,
  getGeneratedAudioUrl,
  getScriptContent,
  getScriptLabel,
  getVoiceLanguageCode,
  isMaleNarrator,
  narratorMatchesLanguage,
  normalizeScripts,
  readJsonFile,
  toBackendUrl,
  validateReaderPages,
  validateTranscript,
} from './utils';

export default function AdminAudiobooksPage() {
  const router = useRouter();
  const [items, setItems] = useState<Audiobook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [narrators, setNarrators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [form, setForm] = useState<AudiobookForm | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const steps = [
    { number: 1, label: 'Book Details' },
    { number: 2, label: 'Preview & Publish' },
  ];

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [audiobookFile, setAudiobookFile] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [ebookPreview, setEbookPreview] = useState<string | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
  const [readerPagesPreview, setReaderPagesPreview] = useState<string | null>(null);
  const [cloudinaryReady, setCloudinaryReady] = useState<boolean | null>(null);
  const [cloudinaryMessage, setCloudinaryMessage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{
    active: boolean;
    percent: number;
    elapsedMs: number;
    completedMs?: number;
  }>({
    active: false,
    percent: 0,
    elapsedMs: 0,
  });
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [siteLogo, setSiteLogo] = useState('');

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (severity: SnackbarState['severity'], message: string) => {
    setSnackbar({ open: true, severity, message });
  };

  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audiobook?')) return;
    
    try {
      const res = await audiobooksApi.delete(id);
      if (res.success) {
        showSnackbar('success', 'Audiobook deleted successfully');
        await loadData();
      } else {
        showSnackbar('error', 'Failed to delete audiobook');
      }
    } catch (error) {
      showSnackbar('error', 'Failed to delete audiobook');
    }
  };

  const loadNarrators = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/narrators');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNarrators((data.data || []).filter(isMaleNarrator));
          return;
        }
      }
    } catch (error) {
      console.error('âŒ Failed to load narrators from API:', error);
    }
    
    // Fallback to hardcoded narrators if API fails
    const fallbackNarrators = [
      { id: 'david', name: 'David (Professional Male)', voiceType: 'browser', gender: 'male' },
      { id: 'microsoft-david', name: 'Microsoft David - English (United States)', voiceType: 'browser', gender: 'male' },
      { id: 'google-hindi-male', name: 'Google Hindi Male', voiceType: 'browser', language: 'hi', gender: 'male' },
    ];
    setNarrators(fallbackNarrators);
  };

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);

      try {
        const catRes = await categoriesApi.getActive();
        if (catRes.success) setCategories(catRes.data);
      } catch {
        setCategories([]);
      }

      // Load narrators
      await loadNarrators();

      // Add cache-busting timestamp to force fresh data
      const res = await audiobooksApi.getAll({ adminView: true, limit: 1000, _t: Date.now() });
      if (res.success) {
        // Check if data is in res.data or res.data.data
        let audiobooksArray: any[] = [];
        const responseData = res.data as any;
        if (Array.isArray(responseData)) {
          audiobooksArray = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
          audiobooksArray = responseData.data;
        }
        setItems(audiobooksArray);
      } else {
        setItems([]);
      }
    } catch (e: any) {
      setItems([]);
      showSnackbar('error', e?.message || 'Failed to load audiobooks');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const activeItems = items.filter((item: any) => {
      const timingStatus = item.audioProcessing?.status || item.generation?.status;
      return timingStatus === 'queued' || timingStatus === 'uploading' || timingStatus === 'processing';
    });

    if (!activeItems.length) return;

    const intervalId = window.setInterval(async () => {
      const statuses = await Promise.allSettled(
        activeItems
          .map((item: any) => item.id || item._id)
          .filter(Boolean)
          .map((id: string) => audiobooksApi.getProcessingStatus(id))
      );

      let hasTerminalUpdate = false;

      setItems((current) =>
        current.map((item: any) => {
          const id = item.id || item._id;
          const statusResult = statuses.find(
            (result) => result.status === 'fulfilled' && (result.value.data?.id === id || String(result.value.data?.id) === String(id))
          );

          if (!statusResult || statusResult.status !== 'fulfilled' || !statusResult.value.data) {
            return item;
          }

          const statusData = statusResult.value.data;
          if (statusData.status === 'ready' || statusData.status === 'failed') {
            hasTerminalUpdate = true;
          }

          return {
            ...item,
            status: statusData.publicationStatus || item.status,
            jobId: statusData.jobId || null,
            errorMessage: statusData.errorMessage || null,
            audioProcessing: {
              ...(item.audioProcessing || {}),
              status: statusData.status,
              jobId: statusData.jobId || null,
              errorMessage: statusData.errorMessage || null,
            },
            generation: statusData.generation || item.generation,
          };
        })
      );

      if (hasTerminalUpdate) {
        void loadData(false);
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [items]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(`${API_CONFIG.API_BASE_URL}/settings/public`);
        const data = await res.json();
        setSiteLogo(String(data?.data?.site_logo || ''));
      } catch {
        setSiteLogo('');
      }
    };

    fetchLogo();
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;

    // Skip upload check - backend endpoint not available
    setCloudinaryReady(true);
    setCloudinaryMessage('');
  }, [dialogOpen]); // Only depend on dialogOpen - removed form?.title to avoid 404 errors

  const filtered = useMemo(() => {
    let list = items;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      list = list.filter((b) => b.status === statusFilter);
    }
    return list;
  }, [items, searchQuery, statusFilter]);

  const rowsPerPage = 20;
  const totalTablePages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice(
    (tablePage - 1) * rowsPerPage,
    tablePage * rowsPerPage
  );

  useEffect(() => {
    setTablePage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (tablePage > totalTablePages) {
      setTablePage(totalTablePages);
    }
  }, [tablePage, totalTablePages]);

  const previewBookData = useMemo(() => {
    if (!form) return null;

    const englishContent = getScriptContent(form.scripts, 'english');
    const hindiContent = getScriptContent(form.scripts, 'hindi');

    return {
      title: form.title || 'Audiobook',
      author: form.author || 'Unknown',
      coverUrl: coverPreview || undefined,
      audioUrl: audioPreviewUrl || toBackendUrl(form.files?.audiobook?.url || getGeneratedAudioUrl(form) || ''),
      pages: {
        en: buildPreviewPages(englishContent),
        hi: buildPreviewPages(hindiContent),
      },
      language: (form.language || 'English') as 'English' | 'Hindi' | 'Both',
      narratorName: form.narratorName || form.narrator || undefined,
    };
  }, [form, coverPreview, audioPreviewUrl]);

  const canOpenPreviewStep = useMemo(() => {
    if (!form) return false;

    const requiredKeys = getRequiredScriptKeys(form.language);
    const generatedAudio = form.generatedAudio;
    const bookPages = form.bookPages;

    return requiredKeys.every((key) => {
      const hasAudio = key === 'english'
        ? !!(generatedAudio?.english?.url || (requiredKeys.length === 1 && generatedAudio?.url))
        : !!generatedAudio?.hindi?.url;

      const hasPages = key === 'english'
        ? !!((Array.isArray(bookPages?.english) && bookPages.english.length) || (requiredKeys.length === 1 && Array.isArray(bookPages) && bookPages.length))
        : !!(Array.isArray(bookPages?.hindi) && bookPages.hindi.length);

      return hasAudio && hasPages;
    });
  }, [form]);

  const voiceLanguageCode = getVoiceLanguageCode(form?.language);
  const languageNarrators = useMemo(() => {
    if (!voiceLanguageCode) return [];
    return narrators.filter((narrator) => isMaleNarrator(narrator) && narratorMatchesLanguage(narrator, voiceLanguageCode));
  }, [narrators, voiceLanguageCode]);
  const browserVoiceOptions = useMemo(
    () => languageNarrators.filter((narrator) => narrator.voiceType === 'browser'),
    [languageNarrators]
  );

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  const updateFormLanguage = (language: 'English' | 'Hindi' | 'Both') => {
    const nextVoiceLanguageCode = getVoiceLanguageCode(language);

    setForm((current) => {
      if (!current) return current;

      if (!nextVoiceLanguageCode) {
        return {
          ...current,
          language,
          narrator: '',
          narratorName: '',
          selectedVoice: '',
          voice: undefined,
        };
      }

      const narratorStillMatches =
        current.narrator &&
        narrators.some(
          (narrator) =>
            narrator.id === current.narrator &&
            narratorMatchesLanguage(narrator, nextVoiceLanguageCode)
        );
      const selectedVoiceStillMatches =
        current.selectedVoice &&
        narrators.some(
          (narrator) =>
            narrator.id === current.selectedVoice &&
            narratorMatchesLanguage(narrator, nextVoiceLanguageCode)
        );

      return {
        ...current,
        language,
        narrator: narratorStillMatches ? current.narrator : '',
        narratorName: narratorStillMatches ? current.narratorName : '',
        selectedVoice: selectedVoiceStillMatches ? current.selectedVoice : '',
        voice: narratorStillMatches
          ? { ...current.voice, gender: 'male', language: nextVoiceLanguageCode }
          : undefined,
      };
    });
  };

  const updateScriptContent = (key: ScriptLanguageKey, content: string) => {
    setForm((current) => {
      if (!current) return current;

      const nextScripts: ScriptData = { ...(current.scripts || {}) };
      if (content.trim()) {
        nextScripts[key] = { content };
      } else {
        delete nextScripts[key];
      }

      return { ...current, scripts: nextScripts };
    });
  };

  const handleScriptUpload = (key: ScriptLanguageKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      updateScriptContent(key, String(ev.target?.result || ''));
    };
    reader.readAsText(file);
  };

  const validateScriptInputs = () => {
    if (!form) return false;

    const missing = getRequiredScriptKeys(form.language).filter((key) => !getScriptContent(form.scripts, key).trim());
    if (missing.length) {
      const labels = missing.map(getScriptLabel).join(', ');
      showSnackbar('error', `${labels} script is required`);
      return false;
    }

    return true;
  };

  const openAdd = () => {
    setDialogMode('add');
    setCurrentStep(1);
    setForm({
      title: '',
      subtitle: '',
      author: '',
      description: '',
      category: '',
      price: 0,
      format: ['Audiobook'],
      featured: false,
      bestseller: false,
      status: 'draft',
      tags: [],
      publishDate: new Date().toISOString().split('T')[0],
      isbn: '',
      pages: undefined,
      rating: 0,
      reviews: 0,
      originalPrice: undefined,
      duration: '',
      narrator: '',
      language: 'English',
      isActive: true,
      isPublished: true,
      files: {},
      transcript: undefined,
      readerPages: undefined,
      scripts: {},
    });
    setCoverImageFile(null);
    setAudiobookFile(null);
    setEbookFile(null);
    setCoverPreview(null);
    setAudioPreviewUrl(null);
    setAudioPreview(null);
    setEbookPreview(null);
    setTranscriptPreview(null);
    setReaderPagesPreview(null);
    setCloudinaryReady(null);
    setCloudinaryMessage('');
    setUploadProgress({ active: false, percent: 0, elapsedMs: 0 });
    setDialogOpen(true);
  };

  const openEdit = async (b: Audiobook) => {
    try {
      // Fetch fresh data from API before opening edit dialog
      const bookId = b.id || b._id;
      if (!bookId) {
        showSnackbar('error', 'Book ID is missing');
        return;
      }
      const freshData = await audiobooksApi.getById(bookId);
      if (!freshData.success) {
        showSnackbar('error', 'Failed to fetch fresh audiobook data');
        return;
      }
      
      const book = freshData.data as any;
      setDialogMode('edit');
      setCurrentStep(1);
      setForm({
        _id: book._id || book.id,
        id: book.id,
        title: book.title || '',
        subtitle: book.subtitle || '',
        author: book.author || '',
        description: book.description || '',
        category: book.category || '',
        price: typeof book.price === 'string' ? parseFloat(book.price.replace(/[^0-9.]/g, '')) || 0 : (book.price as any) || 0,
        format: Array.isArray(book.format) && book.format.length ? Array.from(new Set([...book.format, 'Audiobook'])) : ['Audiobook'],
        featured: !!book.featured,
        bestseller: !!book.bestseller,
        status: book.status || 'draft',
        isActive: book.isActive ?? true,
        isPublished: book.isPublished ?? book.status === 'published',
        tags: Array.isArray(book.tags) ? book.tags : [],
        publishDate: book.publishDate ? String(book.publishDate).split('T')[0] : new Date().toISOString().split('T')[0],
        isbn: book.isbn || '',
        pages: book.pages,
        rating: book.rating,
        reviews: book.reviews,
        originalPrice: book.originalPrice ? (typeof book.originalPrice === 'string' ? parseFloat(book.originalPrice.replace(/[^0-9.]/g, '')) : (book.originalPrice as any)) : undefined,
        duration: book.duration || '',
        narrator: book.narrator || '',
        image: book.image,
        imageCloudinary: book.imageCloudinary,
        files: book.files,
        transcript: book.transcript,
        readerPages: book.readerPages,
        scripts: normalizeScripts(book.scripts, book.script, book.language || 'English'),
        wordSync: book.wordSync,
        generatedAudio: book.generatedAudio,
        bookPages: book.bookPages,
        generation: book.generation,
        narratorName: book.narratorName,
        voice: book.voice,
        selectedVoice: book.selectedVoice,
      });
      setCoverImageFile(null);
      setAudiobookFile(null);
      setEbookFile(null);
      setCoverPreview(book.image || book.imageCloudinary?.url || null);
      const existingAudioFile = book.files?.audiobook?.url
        ? book.files.audiobook
        : getGeneratedAudioFile(book);
      setAudioPreview(existingAudioFile?.originalName || existingAudioFile?.url || null);
      setAudioPreviewUrl(null);
      setEbookPreview(book.files?.ebook?.originalName || book.files?.ebook?.url || null);
      setTranscriptPreview(book.transcript?.languages?.length ? `${book.transcript.languages.length} transcript language(s)` : null);
      setReaderPagesPreview(book.readerPages?.length ? `${book.readerPages.length} reader page(s)` : null);
      setCloudinaryReady(null);
      setCloudinaryMessage('');
      setUploadProgress({ active: false, percent: 0, elapsedMs: 0 });
      // Small delay to ensure form state is set before dialog opens
      setTimeout(() => {
        setDialogOpen(true);
      }, 100);
    } catch (e: any) {
      showSnackbar('error', e?.message || 'Failed to open edit dialog');
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showSnackbar('error', 'Please select an image file');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showSnackbar('error', `Image size cannot exceed ${MAX_IMAGE_SIZE_MB}MB`);
      e.target.value = '';
      return;
    }
    setCoverImageFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedAudio =
      file.type.startsWith('audio/') ||
      ['video/mpeg', 'application/octet-stream'].includes(file.type) ||
      /\.(mp3|mpeg|mpga|m4a|mp4|aac|wav|wave|ogg|oga|opus|flac|webm)$/i.test(file.name);
    if (!allowedAudio) {
      showSnackbar('error', 'Please select an audio file');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_AUDIOBOOK_SIZE_BYTES) {
      showSnackbar('error', `Audiobook file size cannot exceed ${MAX_AUDIOBOOK_SIZE_MB}MB`);
      e.target.value = '';
      return;
    }
    setAudiobookFile(file);
    setAudioPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setAudioPreview(file.name);
    setUploadProgress({ active: false, percent: 0, elapsedMs: 0 });
  };

  const retryAudioProcessing = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await audiobooksApi.retryProcessing(id);
      if (!res.success) throw new Error(res.message || 'Failed to retry audio timing');
      showSnackbar('info', 'Audio timing retry queued');
      await loadData(false);
    } catch (error: any) {
      showSnackbar('error', error?.message || 'Failed to retry audio timing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEbookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = /\.(pdf|epub|txt)$/i;
    if (!allowedExtensions.test(file.name)) {
      showSnackbar('error', 'Please select a PDF, EPUB, or TXT ebook file');
      return;
    }

    setEbookFile(file);
    setEbookPreview(file.name);
  };

  const handleTranscriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    try {
      const transcript = await readJsonFile<Audiobook['transcript']>(file);
      validateTranscript(transcript);
      setForm((current) => (current ? { ...current, transcript } : current));
      setTranscriptPreview(file.name);
    } catch (error: any) {
      showSnackbar('error', error?.message || 'Invalid transcript JSON file');
    }
  };

  const handleReaderPagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    try {
      const readerPages = await readJsonFile<Audiobook['readerPages']>(file);
      validateReaderPages(readerPages);
      setForm((current) => (current ? { ...current, readerPages } : current));
      setReaderPagesPreview(file.name);
    } catch (error: any) {
      showSnackbar('error', error?.message || 'Invalid reader pages JSON file');
    }
  };

  const save = async () => {
    if (!form) return;

    if (!form.title.trim() || !form.author.trim() || !form.category.trim() || !form.description?.trim()) {
      showSnackbar('error', 'Please fill required fields (title, author, category, description)');
      return;
    }
    if (form.description.length > MAX_DESCRIPTION_LENGTH) {
      showSnackbar('error', `Description cannot be more than ${MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }
    if (!validateScriptInputs()) {
      return;
    }

    if (cloudinaryReady === false && (coverImageFile || audiobookFile || ebookFile)) {
      showSnackbar(
        'error',
        cloudinaryMessage ||
        'Cloudinary upload setup missing hai. Backend env vars configure karke phir upload karein.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const hasFilesToUpload = Boolean(coverImageFile || audiobookFile || ebookFile);
      const uploadStartedAt = Date.now();
      if (hasFilesToUpload) {
        setUploadProgress({ active: true, percent: 0, elapsedMs: 0 });
      }
      const handleUploadProgress = hasFilesToUpload
        ? ({ percent }: { percent: number }) => {
            setUploadProgress({
              active: percent < 100,
              percent,
              elapsedMs: Date.now() - uploadStartedAt,
              completedMs: percent >= 100 ? Date.now() - uploadStartedAt : undefined,
            });
          }
        : undefined;
      const normalizedScripts = normalizeScripts(form.scripts, undefined, form.language || 'English');
      const desiredStatus = form.status;
      const desiredIsPublished = desiredStatus === 'published';
      const hasExistingAudio = Boolean(form.files?.audiobook?.url);
      if (dialogMode === 'add' && !audiobookFile && !hasExistingAudio) {
        showSnackbar('error', 'Manual audio file is required');
        return;
      }

      const uploadedCover = form.imageCloudinary || null;
      const uploadedAudio = form.files?.audiobook || null;
      const uploadedEbook = form.files?.ebook || null;

      const payload: AudiobookPayload = {
        title: form.title.trim(),
        author: form.author.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        type: 'Audiobook',
        price: Number(form.price) || 0,
        originalPrice: form.originalPrice,
        rating: form.rating,
        reviews: form.reviews,
        pages: form.pages,
        duration: form.duration,
        narrator: voiceLanguageCode ? form.narrator : '',
        publishDate: form.publishDate,
        isbn: form.isbn?.trim() || undefined,
        format: Array.from(new Set([...(form.format || []), 'Audiobook'])),
        image: uploadedCover?.url || form.image,
        imageCloudinary: uploadedCover,
        featured: !!form.featured,
        bestseller: !!form.bestseller,
        tags: Array.isArray(form.tags) ? form.tags : [],
        status: audiobookFile ? 'review' : form.status,
        language: form.language,
        isActive: form.isActive ?? true,
        isPublished: audiobookFile ? false : desiredIsPublished,
        files: {
          ...(uploadedEbook ? { ebook: uploadedEbook } : {}),
          ...(uploadedAudio ? { audiobook: uploadedAudio } : {}),
        },
        transcript: audiobookFile ? undefined : form.transcript,
        readerPages: audiobookFile ? undefined : form.readerPages,
        scripts: normalizedScripts,
        wordSync: audiobookFile ? undefined : form.wordSync,
        generatedAudio: undefined,
        bookPages: audiobookFile ? undefined : form.bookPages,
        generation: audiobookFile
          ? {
              status: 'processing',
              progress: 45,
            }
          : form.generation,
        narratorName: form.narratorName || form.narrator || '',
      };

      let savedAudiobook;
      let savedMessage = '';
      if (dialogMode === 'add') {
        const res = await audiobooksApi.createWithFiles(payload, {
          coverImage: coverImageFile,
          audiobookFile,
          ebookFile,
        }, handleUploadProgress);
        if (!res.success) throw new Error('Failed to create audiobook');
        savedAudiobook = res.data;
        savedMessage = res.message || '';
      } else {
        if (!form.id) throw new Error('Missing audiobook ID for update');
        const res = await audiobooksApi.updateWithFiles(form.id, payload, {
          coverImage: coverImageFile,
          audiobookFile,
          ebookFile,
        }, handleUploadProgress);
        if (!res.success) throw new Error('Failed to update audiobook');
        savedAudiobook = res.data;
        savedMessage = res.message || '';
      }

      if (hasFilesToUpload) {
        setUploadProgress({
          active: false,
          percent: 100,
          elapsedMs: Date.now() - uploadStartedAt,
          completedMs: Date.now() - uploadStartedAt,
        });
      }

      if (!savedAudiobook?.id) {
        throw new Error('Audiobook saved without an id');
      }
      showSnackbar(
        savedMessage.includes('unavailable') ? 'warning' : audiobookFile ? 'info' : 'success',
        savedMessage ||
          (audiobookFile
            ? 'Audiobook saved. WhisperX timing is queued in the backend.'
            : 'Audiobook saved successfully.')
      );
      setDialogOpen(false);
      await loadData();
    } catch (e: any) {
      showSnackbar('error', e?.message || 'Failed to publish audiobook');
      await loadData();
    } finally {
      setSubmitting(false);
      setUploadProgress((current) => ({ ...current, active: false }));
    }
  };

  return (
    <Box>
      <AudiobooksTopControls
        loadData={loadData}
        loading={loading}
        openAdd={openAdd}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statuses={statuses}
      />
      <AdminAudiobooksTable
        loading={loading}
        filtered={filtered}
        paginated={paginated}
        tablePage={tablePage}
        rowsPerPage={rowsPerPage}
        totalTablePages={totalTablePages}
        submitting={submitting}
        setTablePage={setTablePage}
        openEdit={openEdit}
        handleDelete={handleDelete}
        retryAudioProcessing={retryAudioProcessing}
      />
      <AudiobookDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        dialogMode={dialogMode}
        cloudinaryReady={cloudinaryReady}
        cloudinaryMessage={cloudinaryMessage}
        form={form}
        setForm={setForm}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        canOpenPreviewStep={canOpenPreviewStep}
        updateFormLanguage={updateFormLanguage}
        categories={categories}
        submitting={submitting}
        uploadProgress={uploadProgress}
        coverPreview={coverPreview}
        audioPreview={audioPreview}
        ebookPreview={ebookPreview}
        transcriptPreview={transcriptPreview}
        readerPagesPreview={readerPagesPreview}
        handleCoverUpload={handleCoverUpload}
        handleAudioUpload={handleAudioUpload}
        handleEbookUpload={handleEbookUpload}
        handleTranscriptUpload={handleTranscriptUpload}
        handleReaderPagesUpload={handleReaderPagesUpload}
        handleScriptUpload={handleScriptUpload}
        updateScriptContent={updateScriptContent}
        voiceLanguageCode={voiceLanguageCode}
        languageNarrators={languageNarrators}
        browserVoiceOptions={browserVoiceOptions}
        previewBookData={previewBookData}
        save={save}
        validateScriptInputs={validateScriptInputs}
      />
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}>
        <Alert severity={snackbar.severity} onClose={closeSnackbar} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

