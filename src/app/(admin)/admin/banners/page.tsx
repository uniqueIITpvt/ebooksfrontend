'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';

const API_URL = API_CONFIG.API_BASE_URL;

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  order: number;
  position: 'home_hero' | 'home_middle' | 'home_bottom';
  createdAt: string;
  updatedAt: string;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  isActive: boolean;
  order: number;
  position: 'home_hero' | 'home_middle' | 'home_bottom';
}

const initialFormData: BannerFormData = {
  title: '',
  subtitle: '',
  image: '',
  link: '',
  isActive: true,
  order: 0,
  position: 'home_hero',
};

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(initialFormData);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const getAdminToken = () => {
    if (typeof window === 'undefined') return '';
    return tokenStore.getAccessToken() || '';
  };

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/banners`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setBanners(data.data);
      } else {
        setError('Failed to load banners');
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('Failed to load banners. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        image: banner.image,
        link: banner.link || '',
        isActive: banner.isActive,
        order: banner.order,
        position: banner.position,
      });
      setImagePreview(banner.image);
    } else {
      setEditingBanner(null);
      setFormData(initialFormData);
      setImagePreview('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBanner(null);
    setFormData(initialFormData);
    setImagePreview('');
  };

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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenStore.getAccessToken() || ''}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data?.url) {
        setFormData((prev) => ({ ...prev, image: data.data.url }));
        setImagePreview(data.data.url);
      } else {
        setError('Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingBanner
        ? `${API_URL}/banners/${editingBanner._id}`
        : `${API_URL}/banners`;
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStore.getAccessToken() || ''}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        fetchBanners();
        handleCloseDialog();
      } else {
        setError(data.message || 'Failed to save banner');
      }
    } catch (err) {
      console.error('Error saving banner:', err);
      setError('Failed to save banner');
    }
  };

  const handleDeleteClick = (banner: Banner) => {
    setBannerToDelete(banner);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;

    try {
      const response = await fetch(`${API_URL}/banners/${bannerToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenStore.getAccessToken() || ''}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchBanners();
        setDeleteDialogOpen(false);
        setBannerToDelete(null);
      } else {
        setError(data.message || 'Failed to delete banner');
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError('Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await fetch(`${API_URL}/banners/${banner._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStore.getAccessToken() || ''}`,
        },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        fetchBanners();
      } else {
        setError(data.message || 'Failed to update banner');
      }
    } catch (err) {
      console.error('Error updating banner:', err);
      setError('Failed to update banner');
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'home_hero':
        return 'Home Hero';
      case 'home_middle':
        return 'Home Middle';
      case 'home_bottom':
        return 'Home Bottom';
      default:
        return position;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Banner Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Banner
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No banners found. Click "Add New Banner" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner._id}>
                  <TableCell>
                    {banner.image ? (
                      <Box
                        sx={{
                          width: 80,
                          height: 50,
                          position: 'relative',
                          borderRadius: 1,
                          overflow: 'hidden',
                          bgcolor: 'grey.100',
                        }}
                      >
                        <Image
                          src={banner.image}
                          alt={banner.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="80px"
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 80,
                          height: 50,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ImageIcon color="disabled" />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight={500}>
                      {banner.title}
                    </Typography>
                    {banner.subtitle && (
                      <Typography variant="body2" color="text.secondary">
                        {banner.subtitle}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{banner.order}</TableCell>
                  <TableCell>
                    <Chip
                      label={banner.isActive ? 'Active' : 'Hidden'}
                      size="small"
                      color={banner.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(banner)}
                      color={banner.isActive ? 'success' : 'default'}
                      title={banner.isActive ? 'Hide banner' : 'Show banner'}
                    >
                      {banner.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(banner)}
                      color="primary"
                      title="Edit banner"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(banner)}
                      color="error"
                      title="Delete banner"
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

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography component="span" variant="h6" fontWeight={600}>
            {editingBanner ? 'Edit Banner' : 'Add New Banner'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Title & Subtitle Row */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <TextField
                fullWidth
                size="small"
                label="Title"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Subtitle"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                }
              />
            </Box>

            {/* Order Row */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <TextField
                fullWidth
                size="small"
                label="Order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    order: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </Box>

            {/* Link */}
            <TextField
              fullWidth
              size="small"
              label="Link (optional)"
              value={formData.link}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, link: e.target.value }))
              }
              placeholder="https://example.com"
            />

            {/* Active Toggle */}
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                />
              }
              label={<Typography variant="body2">Active (visible on website)</Typography>}
            />

            {/* Image Upload Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Banner Image *
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.25, display: 'block' }}>
                Recommended size: 1920 x 480 px (4:1 ratio) for proper display on the home page.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  disabled={uploadingImage}
                  startIcon={uploadingImage ? <CircularProgress size={16} /> : <ImageIcon />}
                  sx={{ minWidth: 140 }}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                {imagePreview && (
                  <Box
                    sx={{
                      width: 160,
                      height: 100,
                      position: 'relative',
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: 'grey.100',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="160px"
                    />
                  </Box>
                )}
              </Box>
              {!imagePreview && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  Please upload a banner image
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="small"
            disabled={!formData.title || !formData.image}
          >
            {editingBanner ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the banner &quot;{bannerToDelete?.title}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
