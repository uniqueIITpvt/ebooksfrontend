'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';
import { LEGACY_FAQ_CATEGORIES } from '@/constants/faq';
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
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

const API_URL = API_CONFIG.API_BASE_URL;

interface Faq {
  _id: string;
  question: string;
  answer: string;
  detailedAnswer?: string;
  category: string;
  popular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface FaqFormData {
  question: string;
  answer: string;
  detailedAnswer: string;
  category: string;
  popular: boolean;
  isActive: boolean;
  sortOrder: number;
}

const initialFormData: FaqFormData = {
  question: '',
  answer: '',
  detailedAnswer: '',
  category: LEGACY_FAQ_CATEGORIES[0],
  popular: false,
  isActive: true,
  sortOrder: 0,
};

const getAuthHeaders = (includeJson = false) => {
  const token = tokenStore.getAccessToken() || '';

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
};

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<Faq | null>(null);
  const [formData, setFormData] = useState<FaqFormData>(initialFormData);

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/faqs/admin/all`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setFaqs(data.data);
        return;
      }

      setError(data.message || 'Failed to load FAQs');
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleOpenDialog = (faq?: Faq) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        detailedAnswer: faq.detailedAnswer || '',
        category: faq.category,
        popular: faq.popular,
        isActive: faq.isActive,
        sortOrder: faq.sortOrder,
      });
    } else {
      setEditingFaq(null);
      setFormData(initialFormData);
    }

    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFaq(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    try {
      const url = editingFaq ? `${API_URL}/faqs/${editingFaq._id}` : `${API_URL}/faqs`;
      const method = editingFaq ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          ...formData,
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          detailedAnswer: formData.detailedAnswer.trim(),
          category: formData.category.trim(),
        }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchFaqs();
        handleCloseDialog();
        return;
      }

      setError(data.message || 'Failed to save FAQ');
    } catch (err) {
      console.error('Error saving FAQ:', err);
      setError('Failed to save FAQ');
    }
  };

  const handleDeleteClick = (faq: Faq) => {
    setFaqToDelete(faq);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!faqToDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/faqs/${faqToDelete._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        await fetchFaqs();
        setDeleteDialogOpen(false);
        setFaqToDelete(null);
        return;
      }

      setError(data.message || 'Failed to delete FAQ');
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      setError('Failed to delete FAQ');
    }
  };

  const handleToggleActive = async (faq: Faq) => {
    try {
      const response = await fetch(`${API_URL}/faqs/${faq._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchFaqs();
        return;
      }

      setError(data.message || 'Failed to update FAQ');
    } catch (err) {
      console.error('Error updating FAQ:', err);
      setError('Failed to update FAQ');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
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
        FAQ Management
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
          Add New FAQ
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Question</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Flags</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  <Typography variant='body2' color='text.secondary'>
                    No FAQs found. Click "Add New FAQ" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              faqs.map((faq) => (
                <TableRow key={faq._id}>
                  <TableCell sx={{ maxWidth: 420 }}>
                    <Typography variant='body1' fontWeight={500}>
                      {faq.question}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {faq.answer}
                    </Typography>
                  </TableCell>
                  <TableCell>{faq.category}</TableCell>
                  <TableCell>{faq.sortOrder}</TableCell>
                  <TableCell>
                    {faq.popular ? (
                      <Chip label='Popular' size='small' color='primary' />
                    ) : (
                      <Chip label='Standard' size='small' variant='outlined' />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={faq.isActive ? 'Active' : 'Hidden'}
                      size='small'
                      color={faq.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <IconButton
                      size='small'
                      onClick={() => handleToggleActive(faq)}
                      color={faq.isActive ? 'success' : 'default'}
                      title={faq.isActive ? 'Hide FAQ' : 'Show FAQ'}
                    >
                      {faq.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => handleOpenDialog(faq)}
                      color='primary'
                      title='Edit FAQ'
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => handleDeleteClick(faq)}
                      color='error'
                      title='Delete FAQ'
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
            {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              size='small'
              label='Question'
              required
              value={formData.question}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, question: e.target.value }))
              }
            />
            <TextField
              fullWidth
              size='small'
              label='Category'
              required
              select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
            >
              {LEGACY_FAQ_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size='small'
              label='Answer'
              required
              multiline
              minRows={3}
              value={formData.answer}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, answer: e.target.value }))
              }
            />
            <TextField
              fullWidth
              size='small'
              label='Detailed Answer (optional)'
              multiline
              minRows={4}
              value={formData.detailedAnswer}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  detailedAnswer: e.target.value,
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    size='small'
                    checked={formData.popular}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        popular: e.target.checked,
                      }))
                    }
                  />
                }
                label={
                  <Typography variant='body2'>Popular question</Typography>
                }
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
                  <Typography variant='body2'>Active on website</Typography>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={handleCloseDialog} size='small' sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            size='small'
            disabled={
              !formData.question.trim() ||
              !formData.answer.trim() ||
              !formData.category.trim()
            }
          >
            {editingFaq ? 'Update' : 'Create'}
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
            Are you sure you want to delete the FAQ &quot;{faqToDelete?.question}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
