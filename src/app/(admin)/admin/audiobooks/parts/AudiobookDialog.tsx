import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { CloudUpload, Save } from '@mui/icons-material';

import { MAX_DESCRIPTION_LENGTH } from '../constants';
import { getRequiredScriptKeys, getScriptContent, getScriptLabel } from '../utils';

type AnySetter = React.Dispatch<React.SetStateAction<any>>;

type AudiobookDialogProps = {
  [key: string]: any;
  categories: any[];
  setForm: AnySetter;
  setCurrentStep: AnySetter;
};

function formatElapsed(ms?: number) {
  if (!ms || ms < 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AudiobookDialog(props: AudiobookDialogProps) {
  const {
    dialogOpen,
    setDialogOpen,
    dialogMode,
    cloudinaryReady,
    cloudinaryMessage,
    form,
    setForm,
    categories,
    submitting,
    uploadProgress,
    coverPreview,
    audioPreview,
    ebookPreview,
    handleCoverUpload,
    handleAudioUpload,
    handleEbookUpload,
    handleScriptUpload,
    updateScriptContent,
    updateFormLanguage,
    save,
  } = props;

  const scripts = getRequiredScriptKeys(form?.language);
  const hasExistingAudio = Boolean(form?.files?.audiobook?.url);

  return (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#ffffff' } }}>
      <DialogTitle sx={{ bgcolor: '#ffffff', color: '#17211d', fontSize: 20, fontWeight: 700 }}>
        {dialogMode === 'add' ? 'Add Manual Audiobook' : 'Edit Manual Audiobook'}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: '#ffffff', p: 3 }}>
        {cloudinaryReady === false ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {cloudinaryMessage || 'Cloudinary upload setup is missing. Audio upload needs backend Cloudinary configuration.'}
          </Alert>
        ) : null}

        {!form ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Paper sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8a6d1d', textTransform: 'uppercase', mb: 2 }}>
                Book Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label="Title" value={form.title || ''} onChange={(e) => setForm((f: any) => (f ? { ...f, title: e.target.value } : f))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label="Author" value={form.author || ''} onChange={(e) => setForm((f: any) => (f ? { ...f, author: e.target.value } : f))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Subtitle" value={form.subtitle || ''} onChange={(e) => setForm((f: any) => (f ? { ...f, subtitle: e.target.value } : f))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <Select displayEmpty value={form.category || ''} onChange={(e) => setForm((f: any) => (f ? { ...f, category: e.target.value } : f))}>
                      <MenuItem value="" disabled>Book category</MenuItem>
                      {categories.map((category: any) => (
                        <MenuItem key={category._id || category.id || category.name} value={category.name}>{category.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="number" label="Price" value={form.price ?? 0} onChange={(e) => setForm((f: any) => (f ? { ...f, price: Number(e.target.value) } : f))} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="number" label="Original price" value={form.originalPrice ?? ''} onChange={(e) => setForm((f: any) => (f ? { ...f, originalPrice: e.target.value === '' ? undefined : Number(e.target.value) } : f))} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <Select value={form.status || 'draft'} onChange={(e) => setForm((f: any) => (f ? { ...f, status: e.target.value, isPublished: e.target.value === 'published' } : f))}>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="review">Review</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    minRows={4}
                    label="Description"
                    value={form.description || ''}
                    onChange={(e) => setForm((f: any) => (f ? { ...f, description: e.target.value } : f))}
                    inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
                    helperText={`${(form.description || '').length}/${MAX_DESCRIPTION_LENGTH}`}
                  />
                </Grid>
              </Grid>
              {uploadProgress?.active || uploadProgress?.completedMs ? (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 0.75 }}>
                    <Typography variant="caption" sx={{ color: '#475467', fontWeight: 600 }}>
                      {uploadProgress.active ? 'Uploading files' : 'Upload complete'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475467' }}>
                      {uploadProgress.percent}% · {formatElapsed(uploadProgress.completedMs || uploadProgress.elapsedMs)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress.percent || 0}
                    sx={{ height: 8, borderRadius: 999 }}
                  />
                </Box>
              ) : null}
            </Paper>

            <Paper sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8a6d1d', textTransform: 'uppercase', mb: 2 }}>
                Manual Audio Script
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {['English', 'Hindi', 'Both'].map((language) => (
                  <Button
                    key={language}
                    variant={form.language === language ? 'contained' : 'outlined'}
                    onClick={() => updateFormLanguage(language)}
                    sx={{ textTransform: 'none' }}
                  >
                    {language}
                  </Button>
                ))}
              </Box>

              {scripts.map((scriptKey) => {
                const content = getScriptContent(form.scripts, scriptKey);
                return (
                  <Box key={scriptKey} sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      minRows={9}
                      label={`${getScriptLabel(scriptKey)} script`}
                      value={content}
                      onChange={(e) => updateScriptContent(scriptKey, e.target.value)}
                      helperText={`${content.split(/\s+/).filter(Boolean).length} words`}
                    />
                    <Button component="label" size="small" variant="outlined" startIcon={<CloudUpload />} sx={{ mt: 1, textTransform: 'none' }}>
                      Upload {getScriptLabel(scriptKey)} .txt
                      <input type="file" accept=".txt,text/plain" hidden onChange={handleScriptUpload(scriptKey)} />
                    </Button>
                  </Box>
                );
              })}
            </Paper>

            <Paper sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8a6d1d', textTransform: 'uppercase', mb: 2 }}>
                Upload Files
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Button component="label" fullWidth variant="outlined" startIcon={<CloudUpload />} sx={{ height: 44, textTransform: 'none' }}>
                    Cover image
                    <input type="file" accept="image/*" hidden onChange={handleCoverUpload} />
                  </Button>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#667085' }}>
                    {coverPreview ? 'Cover selected' : 'Optional'}
                  </Typography>
                  {coverPreview ? <Box component="img" src={coverPreview} alt="Cover preview" sx={{ width: 88, height: 116, objectFit: 'cover', borderRadius: 1, mt: 1 }} /> : null}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button component="label" fullWidth variant="outlined" startIcon={<CloudUpload />} sx={{ height: 44, textTransform: 'none' }}>
                    Manual audio
                    <input type="file" accept="audio/*,.mp3,.mpeg,.mpga,.m4a,.mp4,.aac,.wav,.wave,.ogg,.oga,.opus,.flac,.webm" hidden onChange={handleAudioUpload} />
                  </Button>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#667085' }}>
                    {audioPreview || (hasExistingAudio ? 'Existing audio saved' : 'Required for new timing')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button component="label" fullWidth variant="outlined" startIcon={<CloudUpload />} sx={{ height: 44, textTransform: 'none' }}>
                    Ebook file
                    <input type="file" accept=".pdf,.epub,.txt" hidden onChange={handleEbookUpload} />
                  </Button>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#667085' }}>
                    {ebookPreview || 'Optional'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel control={<Switch checked={!!form.featured} onChange={(e) => setForm((f: any) => (f ? { ...f, featured: e.target.checked } : f))} />} label="Featured" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel control={<Switch checked={!!form.bestseller} onChange={(e) => setForm((f: any) => (f ? { ...f, bestseller: e.target.checked } : f))} />} label="Bestseller" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel control={<Switch checked={form.accessLevel === 'free'} onChange={(e) => setForm((f: any) => (f ? { ...f, accessLevel: e.target.checked ? 'free' : 'premium' } : f))} />} label="Free access" />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#ffffff', p: 3 }}>
        <Button onClick={() => setDialogOpen(false)} disabled={submitting} sx={{ color: '#666666' }}>
          Cancel
        </Button>
        <Button
          onClick={save}
          disabled={submitting || !form}
          variant="contained"
          startIcon={submitting ? <CircularProgress size={16} /> : <Save />}
          sx={{ bgcolor: '#17463b', color: '#ffffff', '&:hover': { bgcolor: '#10342b' } }}
        >
          {submitting ? 'Saving...' : 'Save manual audiobook'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
