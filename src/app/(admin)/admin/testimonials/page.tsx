'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { tokenStore } from '@/services/api/tokenStore';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Rating,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

const API_URL = API_CONFIG.API_BASE_URL;

interface Testimonial {
  _id: string;
  name: string;
  role?: string;
  company?: string;
  image?: string;
  content: string;
  detailedContent?: string;
  rating: number;
  format?: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface TestimonialFormData {
  name: string;
  role: string;
  company: string;
  image: string;
  content: string;
  detailedContent: string;
  rating: number;
  format: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface TestimonialStat {
  label: string;
  value: string;
}

const initialFormData: TestimonialFormData = {
  name: '',
  role: '',
  company: '',
  image: '',
  content: '',
  detailedContent: '',
  rating: 5,
  format: 'Books',
  featured: false,
  isActive: true,
  sortOrder: 0,
};

const defaultStats: TestimonialStat[] = [
  { label: 'Resources Shared', value: '700+' },
  { label: 'Verified Reviews', value: 'Real' },
  { label: 'Curated Content', value: 'Weekly' },
  { label: 'Years of Work', value: '5+' },
];

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const getAuthHeaders = (includeJson = false) => {
  const token = tokenStore.getAccessToken() || '';

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
};

const getErrorMessage = (data: unknown, fallback: string) => {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const errorData = data as {
    error?: unknown;
    message?: unknown;
  };

  if (typeof errorData.error === 'string') {
    return errorData.error;
  }

  if (typeof errorData.message === 'string') {
    return errorData.message;
  }

  if (errorData.error && typeof errorData.error === 'object') {
    return JSON.stringify(errorData.error);
  }

  if (errorData.message && typeof errorData.message === 'object') {
    return JSON.stringify(errorData.message);
  }

  return fallback;
};

export default function AdminTestimonialsPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] =
    useState<Testimonial | null>(null);
  const [formData, setFormData] =
    useState<TestimonialFormData>(initialFormData);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState<TestimonialStat[]>(defaultStats);
  const [savingStats, setSavingStats] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    try {
      const token = tokenStore.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/testimonials/admin/all`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setTestimonials(data.data);
        return;
      }

      setError(data.message || 'Failed to load testimonials');
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/settings/public`);
      const data = await response.json();

      if (data.success && typeof data.data?.testimonial_stats === 'string') {
        const parsedStats = JSON.parse(data.data.testimonial_stats);
        if (Array.isArray(parsedStats)) {
          setStats(parsedStats);
        }
      }
    } catch (err) {
      console.error('Error fetching testimonial stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    fetchTestimonials();
  }, [authLoading, fetchTestimonials, isAdmin]);

  const handleStatChange = (
    index: number,
    field: keyof TestimonialStat,
    value: string
  ) => {
    setStats((prev) =>
      prev.map((stat, statIndex) =>
        statIndex === index ? { ...stat, [field]: value } : stat
      )
    );
  };

  const handleSaveStats = async () => {
    try {
      setSavingStats(true);
      setError(null);

      const response = await fetch(`${API_URL}/testimonials/admin/stats`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ stats }),
      });
      const data = await response.json();

      if (response.status === 404) {
        setError(
          'Testimonial stats route is not loaded yet. Please restart the backend server and try again.'
        );
        return;
      }

      if (data.success && Array.isArray(data.data)) {
        setStats(data.data);
        return;
      }

      setError(getErrorMessage(data, 'Failed to save testimonial stats'));
    } catch (err) {
      console.error('Error saving testimonial stats:', err);
      setError('Failed to save testimonial stats');
    } finally {
      setSavingStats(false);
    }
  };

  const handleOpenDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        name: testimonial.name,
        role: testimonial.role || '',
        company: testimonial.company || '',
        image: testimonial.image || '',
        content: testimonial.content,
        detailedContent: testimonial.detailedContent || '',
        rating: testimonial.rating || 5,
        format: testimonial.format || 'Books',
        featured: testimonial.featured,
        isActive: testimonial.isActive,
        sortOrder: testimonial.sortOrder,
      });
    } else {
      setEditingTestimonial(null);
      setFormData(initialFormData);
    }

    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTestimonial(null);
    setFormData(initialFormData);
  };

  const buildPayload = () => ({
    ...formData,
    name: formData.name.trim(),
    role: formData.role.trim(),
    company: formData.company.trim(),
    image: formData.image.trim(),
    content: formData.content.trim(),
    detailedContent: formData.detailedContent.trim(),
    format: formData.format.trim(),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`Image size cannot exceed ${MAX_IMAGE_SIZE_MB}MB`);
      e.target.value = '';
      return;
    }

    try {
      setUploadingImage(true);

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: uploadFormData,
      });
      const data = await response.json();

      if (data.success && data.data?.url) {
        setFormData((prev) => ({ ...prev, image: data.data.url }));
        return;
      }

      setError(data.message || 'Failed to upload image');
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingTestimonial
        ? `${API_URL}/testimonials/${editingTestimonial._id}`
        : `${API_URL}/testimonials`;
      const method = editingTestimonial ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify(buildPayload()),
      });
      const data = await response.json();

      if (data.success) {
        await fetchTestimonials();
        handleCloseDialog();
        return;
      }

      setError(data.message || 'Failed to save testimonial');
    } catch (err) {
      console.error('Error saving testimonial:', err);
      setError('Failed to save testimonial');
    }
  };

  const handleDeleteClick = (testimonial: Testimonial) => {
    setTestimonialToDelete(testimonial);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testimonialToDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/testimonials/${testimonialToDelete._id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();

      if (data.success) {
        await fetchTestimonials();
        setDeleteDialogOpen(false);
        setTestimonialToDelete(null);
        return;
      }

      setError(data.message || 'Failed to delete testimonial');
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      setError('Failed to delete testimonial');
    }
  };

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      const response = await fetch(
        `${API_URL}/testimonials/${testimonial._id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(true),
          body: JSON.stringify({ isActive: !testimonial.isActive }),
        }
      );
      const data = await response.json();

      if (data.success) {
        await fetchTestimonials();
        return;
      }

      setError(data.message || 'Failed to update testimonial');
    } catch (err) {
      console.error('Error updating testimonial:', err);
      setError('Failed to update testimonial');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' sx={{ mb: 3, fontWeight: 600 }}>
        Testimonials Management
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Testimonial
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2.5 }}>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: 2,
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant='h6' fontWeight={600}>
              Public Section Stats
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Edit the four stat cards shown above public testimonials.
            </Typography>
          </Box>
          <Button
            variant='outlined'
            onClick={handleSaveStats}
            disabled={
              savingStats ||
              stats.some((stat) => !stat.label.trim() || !stat.value.trim())
            }
          >
            {savingStats ? 'Saving...' : 'Save Stats'}
          </Button>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              xl: 'repeat(4, 1fr)',
            },
          }}
        >
          {stats.map((stat, index) => (
            <Box
              key={index}
              sx={{
                display: 'grid',
                gap: 1.25,
                gridTemplateColumns: '0.8fr 1.2fr',
              }}
            >
              <TextField
                fullWidth
                size='small'
                label='Value'
                value={stat.value}
                onChange={(e) =>
                  handleStatChange(index, 'value', e.target.value)
                }
              />
              <TextField
                fullWidth
                size='small'
                label='Label'
                value={stat.label}
                onChange={(e) =>
                  handleStatChange(index, 'label', e.target.value)
                }
              />
            </Box>
          ))}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reader</TableCell>
              <TableCell>Review</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Flags</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  <Typography variant='body2' color='text.secondary'>
                    No testimonials found. Click "Add New Testimonial" to add
                    a real review.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              testimonials.map((testimonial) => (
                <TableRow key={testimonial._id}>
                  <TableCell sx={{ minWidth: 220 }}>
                    <Typography variant='body1' fontWeight={500}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {[testimonial.role, testimonial.company]
                        .filter(Boolean)
                        .join(' at ') || 'Reader'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 420 }}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                      }}
                    >
                      {testimonial.content}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Rating value={testimonial.rating} readOnly size='small' />
                  </TableCell>
                  <TableCell>{testimonial.sortOrder}</TableCell>
                  <TableCell>
                    {testimonial.featured ? (
                      <Chip label='Featured' size='small' color='primary' />
                    ) : (
                      <Chip label='Standard' size='small' variant='outlined' />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={testimonial.isActive ? 'Published' : 'Hidden'}
                      size='small'
                      color={testimonial.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <IconButton
                      size='small'
                      onClick={() => handleToggleActive(testimonial)}
                      color={testimonial.isActive ? 'success' : 'default'}
                      title={
                        testimonial.isActive
                          ? 'Hide testimonial'
                          : 'Publish testimonial'
                      }
                    >
                      {testimonial.isActive ? (
                        <VisibilityIcon />
                      ) : (
                        <VisibilityOffIcon />
                      )}
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => handleOpenDialog(testimonial)}
                      color='primary'
                      title='Edit testimonial'
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => handleDeleteClick(testimonial)}
                      color='error'
                      title='Delete testimonial'
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography component='span' variant='h6' fontWeight={600}>
            {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: '1fr 1fr' } }}>
              <TextField
                fullWidth
                size='small'
                label='Reader Name'
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <TextField
                fullWidth
                size='small'
                label='Role / Designation'
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
              />
            </Box>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: '1fr 1fr' } }}>
              <TextField
                fullWidth
                size='small'
                label='Company / Organization'
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
              />
              <TextField
                fullWidth
                size='small'
                label='Image URL'
                value={formData.image}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, image: e.target.value }))
                }
                placeholder='Paste image URL'
                InputProps={{
                  endAdornment: (
                    <Button
                      component='label'
                      size='small'
                      disabled={uploadingImage}
                      startIcon={
                        uploadingImage ? (
                          <CircularProgress size={14} />
                        ) : (
                          <ImageIcon fontSize='small' />
                        )
                      }
                      sx={{ ml: 1, whiteSpace: 'nowrap' }}
                    >
                      {uploadingImage ? 'Uploading' : 'Upload'}
                      <input
                        type='file'
                        hidden
                        accept='image/*'
                        onChange={handleImageUpload}
                      />
                    </Button>
                  ),
                }}
                helperText='Paste a URL or upload a file'
              />
            </Box>
            {formData.image && (
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  gap: 1.5,
                }}
              >
                <Box
                  component='img'
                  src={formData.image}
                  alt='Reader preview'
                  sx={{
                    bgcolor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    height: 56,
                    objectFit: 'cover',
                    width: 56,
                  }}
                />
                <Button
                  size='small'
                  color='inherit'
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, image: '' }))
                  }
                >
                  Remove Image
                </Button>
              </Box>
            )}
            <TextField
              fullWidth
              size='small'
              label='Short Review'
              required
              multiline
              minRows={3}
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
            />
            <TextField
              fullWidth
              size='small'
              label='Detailed Review'
              multiline
              minRows={4}
              value={formData.detailedContent}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  detailedContent: e.target.value,
                }))
              }
            />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: '1fr 1fr 1fr' } }}>
              <TextField
                fullWidth
                size='small'
                label='Format'
                select
                value={formData.format}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, format: e.target.value }))
                }
              >
                {['Books', 'Audiobooks', 'Summaries', 'Mixed Learning'].map(
                  (format) => (
                    <MenuItem key={format} value={format}>
                      {format}
                    </MenuItem>
                  )
                )}
              </TextField>
              <TextField
                fullWidth
                size='small'
                label='Rating'
                type='number'
                inputProps={{ min: 1, max: 5 }}
                value={formData.rating}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rating: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
                  }))
                }
              />
              <TextField
                fullWidth
                size='small'
                label='Sort Order'
                type='number'
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sortOrder: Number(e.target.value) || 0,
                  }))
                }
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    size='small'
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        featured: e.target.checked,
                      }))
                    }
                  />
                }
                label={<Typography variant='body2'>Featured review</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    size='small'
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                }
                label={
                  <Typography variant='body2'>Published on website</Typography>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={handleCloseDialog}
            size='small'
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            size='small'
            disabled={!formData.name.trim() || !formData.content.trim()}
          >
            {editingTestimonial ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the testimonial from "
            {testimonialToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color='error'
            variant='contained'
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
