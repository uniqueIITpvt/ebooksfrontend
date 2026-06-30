'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { bookFormatsApi, BookFormat, BookFormatPayload } from '@/services/api/bookFormatsApi';

interface FormData {
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  isActive: true,
  sortOrder: 0,
};

export default function BookFormatsPage() {
  const [formats, setFormats] = useState<BookFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<BookFormat | null>(null);
  const [deletingFormat, setDeletingFormat] = useState<BookFormat | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const fetchFormats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookFormatsApi.getAll(true);
      setFormats(response.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load book formats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormats();
  }, [fetchFormats]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingFormat(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (format: BookFormat) => {
    setEditingFormat(format);
    setFormData({
      name: format.name,
      description: format.description || '',
      isActive: format.isActive,
      sortOrder: format.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFormat(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload: BookFormatPayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      if (editingFormat) {
        await bookFormatsApi.update(editingFormat._id, payload);
        showSuccess('Book format updated successfully');
      } else {
        await bookFormatsApi.create(payload);
        showSuccess('Book format created successfully');
      }

      handleCloseDialog();
      await fetchFormats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save book format');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (format: BookFormat) => {
    setDeletingFormat(format);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingFormat) return;
    try {
      setSaving(true);
      setError(null);
      await bookFormatsApi.delete(deletingFormat._id);
      showSuccess('Book format deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingFormat(null);
      await fetchFormats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete book format');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (format: BookFormat) => {
    try {
      await bookFormatsApi.update(format._id, { isActive: !format.isActive });
      showSuccess(`Format ${format.isActive ? 'deactivated' : 'activated'} successfully`);
      await fetchFormats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update format status');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Book Formats
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Add Format
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="center"><strong>Sort Order</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No book formats found. Click &quot;Add Format&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                formats.map((format) => (
                  <TableRow key={format._id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{format.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{format.sortOrder}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={format.isActive ? 'Click to deactivate' : 'Click to activate'}>
                        <Chip
                          label={format.isActive ? 'Active' : 'Inactive'}
                          color={format.isActive ? 'success' : 'default'}
                          size="small"
                          onClick={() => handleToggleActive(format)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEdit(format)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleOpenDelete(format)}>
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
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFormat ? 'Edit Book Format' : 'Add Book Format'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            fullWidth
            required
            placeholder="e.g. Hardcover, Paperback, E-book"
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            placeholder="Optional description"
          />
          <TextField
            label="Sort Order"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingFormat ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Book Format</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingFormat?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
