'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  InputAdornment,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  Save,
  ArrowBack,
  Add as AddIcon,
  Close,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { blogsApi, type BlogPayload, type Blog } from '@/services/api/blogsApi';
import ImageUpload from '@/components/ui/ImageUpload';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { stripHtmlTags, getWordCount, calculateReadTime } from '@/utils/htmlUtils';

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorBio: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  readTime: string;
  publishDate: string;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
}

interface ValidationErrors {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  author?: string;
  readTime?: string;
  publishDate?: string;
}

const defaultCategories = [
  'Research Updates',
  'Audiobook Insights',
  'Learning Tips',
  'Study Resources',
  'Exam Prep',
  'Technology & Innovation',
  'Career Development',
  'Science & Education',
  'Book Summaries',
  'Community',
];

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    author: 'UniqueIIT Research Center',
    authorBio: '',
    authorAvatar: '',
    category: '',
    tags: [],
    readTime: '5 min read',
    publishDate: new Date().toISOString().split('T')[0],
    featured: false,
    status: 'draft',
  });
  const [originalBlog, setOriginalBlog] = useState<Blog | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (blogId) {
      loadBlogData();
    }
  }, [blogId]);

  const loadBlogData = async () => {
    try {
      setLoading(true);
      const response = await blogsApi.getBlogById(blogId);

      if (response.success && response.data) {
        const blog = response.data;
        setOriginalBlog(blog);

        // Convert date to YYYY-MM-DD format
        const publishDate = blog.publishDate
          ? new Date(blog.publishDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        setFormData({
          title: blog.title || '',
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          author: blog.author || 'UniqueIIT Research Center',
          authorBio: blog.authorBio || '',
          authorAvatar: blog.authorAvatar || '',
          category: blog.category || '',
          tags: blog.tags || [],
          readTime: blog.readTime || '5 min read',
          publishDate,
          featured: blog.featured || false,
          status: blog.status || 'draft',
        });

        // Set image preview if exists
        if (blog.image) {
          setImagePreview(blog.image);
        }
      } else {
        showErrorAlert('Blog not found');
        setTimeout(() => router.push('/admin/blogs'), 2000);
      }
    } catch (error) {
      console.error('Error loading blog:', error);
      showErrorAlert('Failed to load blog data');
      setTimeout(() => router.push('/admin/blogs'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BlogFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = (file: File | null, preview: string | null) => {
    setImageFile(file);
    setImagePreview(preview);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }

    if (!formData.excerpt.trim()) {
      errors.excerpt = 'Excerpt is required';
    } else if (formData.excerpt.trim().length < 10) {
      errors.excerpt = 'Excerpt must be at least 10 characters';
    } else if (formData.excerpt.length > 500) {
      errors.excerpt = 'Excerpt must not exceed 500 characters';
    }

    const contentPlainText = stripHtmlTags(formData.content).trim();
    if (!contentPlainText) {
      errors.content = 'Content is required';
    } else if (contentPlainText.length < 50) {
      errors.content = 'Content must be at least 50 characters';
    } else if (contentPlainText.length > 50000) {
      errors.content = 'Content must not exceed 50,000 characters';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.author.trim()) {
      errors.author = 'Author is required';
    }

    if (!formData.readTime.trim()) {
      errors.readTime = 'Read time is required';
    }

    if (!formData.publishDate) {
      errors.publishDate = 'Publish date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorAlert('Please fix the validation errors');
      return;
    }

    try {
      setSubmitting(true);

      const blogPayload: Partial<BlogPayload> = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(), // Plain text
        content: formData.content, // Keep HTML
        author: formData.author.trim(),
        category: formData.category,
        tags: formData.tags,
        readTime: formData.readTime.trim(),
        publishDate: formData.publishDate,
        featured: formData.featured,
        status: formData.status,
      };

      let response;
      if (imageFile) {
        response = await blogsApi.updateBlogWithFiles(blogId, blogPayload, imageFile);
      } else {
        response = await blogsApi.updateBlog(blogId, blogPayload);
      }

      if (response.success) {
        showSuccessAlert('Blog updated successfully!');
        setTimeout(() => {
          router.push('/admin/blogs');
        }, 1500);
      } else {
        showErrorAlert(response.message || 'Failed to update blog');
      }
    } catch (error: any) {
      console.error('Error updating blog:', error);
      showErrorAlert(error.message || 'Failed to update blog');
    } finally {
      setSubmitting(false);
    }
  };

  const showSuccessAlert = (message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const showErrorAlert = (message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={600} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/admin/blogs"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            Blogs
          </Link>
          <Typography color="text.primary">Edit Blog</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Edit Blog
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update blog post content and settings
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/admin/blogs')}
          >
            Back to Blogs
          </Button>
        </Box>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Blog Content
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                label="Title"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!validationErrors.title}
                helperText={validationErrors.title || `${formData.title.length}/200 characters`}
                sx={{ mb: 3 }}
                inputProps={{ maxLength: 200 }}
              />

              <TextField
                fullWidth
                label="Excerpt"
                required
                multiline
                rows={4}
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                error={!!validationErrors.excerpt}
                helperText={
                  validationErrors.excerpt || 
                  `${formData.excerpt.length}/500 characters`
                }
                placeholder="Enter a brief excerpt..."
                sx={{ mb: 3 }}
                inputProps={{ maxLength: 500 }}
              />

              <RichTextEditor
                label="Content"
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                error={!!validationErrors.content}
                helperText={
                  validationErrors.content ||
                  `${stripHtmlTags(formData.content).length}/50,000 characters - ${getWordCount(formData.content)} words - ${calculateReadTime(formData.content)}`
                }
                placeholder="Write your blog content here (supports rich text formatting)..."
                height={400}
                required
              />

              {/* Image Upload */}
              <ImageUpload
                label="Featured Image"
                value={imagePreview || undefined}
                onChange={handleImageUpload}
                maxSize={5}
                acceptedFormats={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']}
              />
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Publishing Options */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Publishing
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Publish Date"
                type="date"
                required
                value={formData.publishDate}
                onChange={(e) => handleInputChange('publishDate', e.target.value)}
                error={!!validationErrors.publishDate}
                helperText={validationErrors.publishDate}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 3 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                  />
                }
                label="Featured Blog"
              />
            </Paper>

            {/* Author Information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Author
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                label="Author Name"
                required
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                error={!!validationErrors.author}
                helperText={validationErrors.author}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Author Bio"
                multiline
                rows={3}
                value={formData.authorBio}
                onChange={(e) => handleInputChange('authorBio', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Author Avatar URL"
                value={formData.authorAvatar}
                onChange={(e) => handleInputChange('authorAvatar', e.target.value)}
                placeholder="/sayyed-quadri.png"
              />
            </Paper>

            {/* Category & Tags */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Organization
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <FormControl fullWidth sx={{ mb: 3 }} required error={!!validationErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {defaultCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {validationErrors.category}
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Read Time"
                required
                value={formData.readTime}
                onChange={(e) => handleInputChange('readTime', e.target.value)}
                error={!!validationErrors.readTime}
                helperText={validationErrors.readTime || 'e.g., "5 min read"'}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Add Tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Press Enter to add"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleAddTag} edge="end" size="small">
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    deleteIcon={<Close />}
                    size="small"
                  />
                ))}
              </Box>
            </Paper>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Blog'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
