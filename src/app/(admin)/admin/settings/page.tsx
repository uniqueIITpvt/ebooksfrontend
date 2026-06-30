'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Switch,
  Tooltip,
  Alert,
  CircularProgress,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import { BACKEND_URL } from '@/config/backend-url.config';
import { tokenStore } from '@/services/api/tokenStore';

const API_URL = `${BACKEND_URL}/api/v1`;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

interface Setting {
  _id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoLoading, setLogoLoading] = useState(false);

  // Get admin token
  const getAdminToken = () => {
    if (typeof window === 'undefined') return '';
    return tokenStore.getAccessToken() || '';
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
    isPublic: false,
  });

  const categories = ['general', 'site', 'seo', 'social', 'payment', 'email', 'banner'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_URL}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle 401 - Token expired
      if (response.status === 401) {
        localStorage.removeItem('admin_accessToken');
        localStorage.removeItem('admin_user');
        setError('Session expired. Please login again.');
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data || []);
        const siteLogo = (data.data || []).find((s: Setting) => s.key === 'site_logo');
        setLogoUrl(siteLogo?.value || '');
        setError('');
      } else {
        setError(data.message || 'Failed to fetch settings');
      }
    } catch (err) {
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (setting?: Setting) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        key: setting.key,
        value: setting.value,
        category: setting.category,
        description: setting.description || '',
        isPublic: setting.isPublic,
      });
    } else {
      setEditingSetting(null);
      setFormData({
        key: '',
        value: '',
        category: 'general',
        description: '',
        isPublic: false,
      });
    }
    setDialogOpen(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSetting(null);
    setError('');
  };

  const handleSave = async () => {
    if (!formData.key || !formData.value) {
      setError('Key and value are required');
      return;
    }

    try {
      const url = editingSetting
        ? `${API_URL}/settings/${editingSetting._id}`
        : `${API_URL}/settings`;
      const method = editingSetting ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        fetchSettings();
        handleCloseDialog();
      } else {
        setError(data.message || 'Failed to save setting');
      }
    } catch (err) {
      setError('Failed to save setting');
    }
  };

  const handleDeleteClick = (setting: Setting) => {
    setSettingToDelete(setting);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!settingToDelete) return;

    try {
      const response = await fetch(`${API_URL}/settings/${settingToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchSettings();
        setDeleteDialogOpen(false);
        setSettingToDelete(null);
      } else {
        setError(data.message || 'Failed to delete setting');
      }
    } catch (err) {
      setError('Failed to delete setting');
    }
  };

  const filteredSettings = settings.filter(
    (s) =>
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      general: 'default',
      site: 'primary',
      seo: 'success',
      social: 'info',
      payment: 'warning',
      email: 'secondary',
      banner: 'error',
    };
    return colors[category] || 'default';
  };

  const handleTogglePublic = async (setting: Setting) => {
    try {
      const response = await fetch(`${API_URL}/settings/${setting._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          description: setting.description,
          isPublic: !setting.isPublic,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchSettings();
      } else {
        setError(data.message || 'Failed to update setting');
      }
    } catch (err) {
      setError('Failed to update setting');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleLogoUpload = async (file: File) => {
    setError('');

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`Image size cannot exceed ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }

    setLogoLoading(true);

    try {
      const form = new FormData();
      form.append('file', file);

      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: form,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.success) {
        setError(uploadData?.message || 'Failed to upload logo');
        return;
      }

      const url = uploadData?.data?.url;
      if (!url) {
        setError('Upload succeeded but no URL was returned');
        return;
      }

      const saveRes = await fetch(`${API_URL}/settings/key/site_logo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          value: url,
          category: 'site',
          description: 'Site logo URL',
          isPublic: true,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData?.success) {
        setError(saveData?.message || 'Failed to save logo setting');
        return;
      }

      setLogoUrl(url);
      fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Failed to upload logo');
    } finally {
      setLogoLoading(false);
    }
  };

  const handleLogoDelete = async () => {
    setError('');
    setLogoLoading(true);
    try {
      const setting = settings.find((s) => s.key === 'site_logo');
      if (!setting?._id) {
        setLogoUrl('');
        return;
      }

      const res = await fetch(`${API_URL}/settings/${setting._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to delete logo setting');
        return;
      }

      setLogoUrl('');
      fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete logo setting');
    } finally {
      setLogoLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Setting
        </Button>
      </Box>

      {/* Logo Section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Site Logo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload/update the website logo. This is saved as a setting key: site_logo
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button component="label" variant="contained" disabled={logoLoading}>
                {logoLoading ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload(f);
                    e.currentTarget.value = '';
                  }}
                />
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={logoLoading || !logoUrl}
                onClick={handleLogoDelete}
              >
                Delete
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 160,
                height: 64,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.default',
                overflow: 'hidden',
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Site logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No logo
                </Typography>
              )}
            </Box>
            <Box sx={{ minWidth: 280, flex: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {logoUrl || '-'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search settings by key, value, or category..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Settings Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Public</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSettings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No settings found. Click "Add Setting" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSettings.map((setting) => (
                <TableRow key={setting._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {setting.key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {setting.value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={setting.category}
                      size="small"
                      color={getCategoryColor(setting.category) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={setting.isPublic} 
                      size="small" 
                      color="success"
                      onChange={() => handleTogglePublic(setting)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {setting.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(setting)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(setting)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSetting ? 'Edit Setting' : 'Add New Setting'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              disabled={!!editingSetting}
              helperText="Unique identifier (e.g., site_name, banner_visual)"
              fullWidth
              size="small"
            />
            <TextField
              label="Value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <TextField
              select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
              size="small"
              SelectProps={{ native: true }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </TextField>
            <TextField
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              size="small"
              helperText="Brief description of what this setting does"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <Typography variant="body2">Make this setting publicly accessible via API</Typography>
            </Box>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingSetting ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Setting</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the setting <strong>{settingToDelete?.key}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
