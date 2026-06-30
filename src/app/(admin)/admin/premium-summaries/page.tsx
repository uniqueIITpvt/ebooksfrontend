'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
  Pagination,
  InputAdornment,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  CloudUpload,
  Close,
} from '@mui/icons-material';
import { premiumSummariesApi, type PremiumSummary, type PremiumSummaryFormData } from '@/services/api/premiumSummariesApi';
import { categoriesApi } from '@/services/api/categoriesApi';

interface ValidationErrors {
  title?: string;
  author?: string;
  category?: string;
  description?: string;
  price?: string;
  pages?: string;
}

const initialFormData: PremiumSummaryFormData = {
  title: '',
  subtitle: '',
  author: 'UniqueIIT Research Center',
  description: '',
  category: '',
  originalBook: '',
  price: 0,
  originalPrice: undefined,
  pages: undefined,
  readingTime: '',
  featured: false,
  isActive: true,
  tags: [],
};

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export default function PremiumSummariesPage() {
  const [premiumSummaries, setPremiumSummaries] = useState<PremiumSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ name: '', description: '', color: '#1976d2' });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PremiumSummaryFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const limit = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summariesData, categoriesData] = await Promise.all([
        premiumSummariesApi.getPremiumSummaries({ page, limit, search: searchQuery || undefined }),
        categoriesApi.getActive(),
      ]);
      setPremiumSummaries(summariesData.data);
      setTotalPages(summariesData.pagination?.pages || 1);
      setCategories(categoriesData.data.map((c: any) => c.name));
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchQuery]);

  const handleOpen = (summary?: PremiumSummary) => {
    if (summary) {
      setEditingId(summary._id);
      setFormData({
        title: summary.title,
        subtitle: summary.subtitle || '',
        author: summary.author,
        description: summary.description,
        category: summary.category,
        originalBook: summary.originalBook || '',
        price: summary.price,
        originalPrice: summary.originalPrice,
        pages: summary.pages,
        readingTime: summary.readingTime || '',
        featured: summary.featured,
        isActive: summary.isActive,
        tags: summary.tags || [],
      });
      setImagePreview(summary.image || null);
    } else {
      setEditingId(null);
      setFormData(initialFormData);
      setImagePreview(null);
    }
    setImageFile(null);
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        alert(`Image size cannot exceed ${MAX_IMAGE_SIZE_MB}MB`);
        event.target.value = '';
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingId) {
        await premiumSummariesApi.updatePremiumSummaryWithFiles(editingId, formData, imageFile || undefined);
        setSnackbar({ open: true, message: 'Premium summary updated successfully', severity: 'success' });
      } else {
        await premiumSummariesApi.createPremiumSummaryWithFiles(formData, imageFile || undefined);
        setSnackbar({ open: true, message: 'Premium summary created successfully', severity: 'success' });
      }
      handleClose();
      fetchData();
    } catch (error: any) {
      console.error('Error saving premium summary:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to save', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await premiumSummariesApi.deletePremiumSummary(id);
      setSnackbar({ open: true, message: 'Premium summary deleted successfully', severity: 'success' });
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting premium summary:', error);
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) {
      setSnackbar({ open: true, message: 'Category name is required', severity: 'error' });
      return;
    }

    try {
      const response = await categoriesApi.create({
        name: newCategoryData.name.trim(),
        description: newCategoryData.description.trim() || undefined,
        color: newCategoryData.color,
      });

      if (response.success) {
        const categoriesData = await categoriesApi.getActive();
        setCategories(categoriesData.data.map((c: any) => c.name));
        setFormData({ ...formData, category: response.data.name });
        setNewCategoryData({ name: '', description: '', color: '#1976d2' });
        setCategoryDialogOpen(false);
        setSnackbar({ open: true, message: `Category "${response.data.name}" created successfully`, severity: 'success' });
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to create category', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Premium Summaries Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search premium summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 400 }}
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
          >
            Refresh
          </Button>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add Premium Summary
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Pages</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : premiumSummaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No premium summaries found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              premiumSummaries.map((summary) => (
                <TableRow key={summary._id}>
                  <TableCell>
                    <Avatar
                      src={summary.image}
                      variant="rounded"
                      sx={{ width: 50, height: 50 }}
                    >
                      {summary.title[0]}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{summary.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {summary.author}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={summary.category} size="small" />
                  </TableCell>
                  <TableCell>₹{summary.price.toFixed(2)}</TableCell>
                  <TableCell>{summary.pages || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={summary.featured ? 'Featured' : 'No'}
                      color={summary.featured ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={summary.isActive ? 'Active' : 'Inactive'}
                      color={summary.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpen(summary)}>
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirm(summary._id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Premium Summary' : 'Add Premium Summary'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Author *"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                error={!!errors.author}
                helperText={errors.author}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category *"
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.category && (
                    <FormControl component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.5 }}>
                      {errors.category}
                    </FormControl>
                  )}
                </FormControl>
                <Tooltip title="Add New Category">
                  <IconButton onClick={() => setCategoryDialogOpen(true)} sx={{ mt: 1 }}>
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Original Book"
                value={formData.originalBook}
                onChange={(e) => setFormData({ ...formData, originalBook: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Price *"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                error={!!errors.price}
                helperText={errors.price}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Original Price"
                type="number"
                value={formData.originalPrice || ''}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pages"
                type="number"
                value={formData.pages || ''}
                onChange={(e) => setFormData({ ...formData, pages: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reading Time"
                value={formData.readingTime}
                onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
                placeholder="e.g., 15 min"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                </Button>
                {imagePreview && (
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={imagePreview}
                      variant="rounded"
                      sx={{ width: 100, height: 100 }}
                    />
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  />
                }
                label="Featured"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={newCategoryData.name}
              onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
              sx={{ mb: 2 }}
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              value={newCategoryData.description}
              onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">Color:</Typography>
              <input
                type="color"
                value={newCategoryData.color}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, color: e.target.value })}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: newCategoryData.color,
                  border: '1px solid #ddd',
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={!newCategoryData.name.trim()}
          >
            Create Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this premium summary?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Backdrop open={loading} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress />
      </Backdrop>
    </Box>
  );
}
