import React from 'react';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Chip,
  Chip as MuiChip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Close, CloudUpload, Delete } from '@mui/icons-material';
import { ImageIcon } from 'lucide-react';

type AnySetter = React.Dispatch<React.SetStateAction<any>>;

type BooksDialogsProps = {
  [key: string]: any;
  books: any[];
  categories: any[];
  bookTypes: any[];
  bookFormats: any[];
  bookHubs: any[];
  bookStatusesList: any[];
  gstList: any[];
  languageList: any[];
  setSelectedBook: AnySetter;
  setValidationErrors: AnySetter;
  setSnackbar: AnySetter;
  setNewCategoryData: AnySetter;
  setNewBookTypeData: AnySetter;
  setNewBookFormatData: AnySetter;
  setNewBookHubData: AnySetter;
  setNewBookStatusData: AnySetter;
  setNewGstData: AnySetter;
  setNewLanguageData: AnySetter;
};

export default function BooksDialogs(props: BooksDialogsProps) {
  const {
  dialogOpen,
  books,
  handleDialogClose,
  dialogMode,
  selectedBook,
  setSelectedBook,
  validationErrors,
  setValidationErrors,
  categories,
  setCategoryDialogOpen,
  bookTypes,
  setBookTypeDialogOpen,
  bookFormats,
  setBookFormatDialogOpen,
  bookHubs,
  setBookHubDialogOpen,
  bookStatusesList,
  setBookStatusDialogOpen,
  gstList,
  setGstDialogOpen,
  languageList,
  setLanguageDialogOpen,
  isReadOnlyMode,
  statuses,
  imagePreview,
  imageFile,
  bookFile,
  audioFile,
  bookFilePreview,
  audioFilePreview,
  coverInputRef,
  ebookInputRef,
  audioInputRef,
  handleImageUpload,
  handleBookFileUpload,
  handleAudioFileUpload,
  handleRemoveImage,
  handleRemoveBookFile,
  handleRemoveAudioFile,
  openUploadPicker,
  getUploadZoneStateSx,
  handleUploadZoneDragEnter,
  handleUploadZoneDragOver,
  handleUploadZoneDragLeave,
  handleUploadZoneDrop,
  handleUploadZoneKeyDown,
  dragOverTarget,
  submitting,
  handleSaveBook,
  confirmDialog,
  handleConfirmDialogClose,
  snackbar,
  setSnackbar,
  loading,
  categoryDialogOpen,
  newCategoryData,
  setNewCategoryData,
  handleCreateCategory,
  bookTypeDialogOpen,
  newBookTypeData,
  setNewBookTypeData,
  handleCreateBookType,
  bookFormatDialogOpen,
  newBookFormatData,
  setNewBookFormatData,
  handleCreateBookFormat,
  bookHubDialogOpen,
  newBookHubData,
  setNewBookHubData,
  handleCreateBookHub,
  bookStatusDialogOpen,
  newBookStatusData,
  setNewBookStatusData,
  handleCreateBookStatus,
  gstDialogOpen,
  newGstData,
  setNewGstData,
  handleCreateGst,
  languageDialogOpen,
  newLanguageData,
  setNewLanguageData,
  handleCreateLanguage
  } = props;

  return (
    <>
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiInputBase-input.Mui-disabled': {
            WebkitTextFillColor: '#111827',
            color: '#111827',
            opacity: 1,
          },
          '& .MuiSelect-select.Mui-disabled': {
            WebkitTextFillColor: '#111827',
            color: '#111827',
            opacity: 1,
          },
          '& .MuiInputLabel-root.Mui-disabled': {
            color: '#4b5563',
          },
          '& .MuiFormHelperText-root.Mui-disabled': {
            color: '#6b7280',
          },
          '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9ca3af',
          },
          '& .MuiSvgIcon-root.MuiSelect-icon.Mui-disabled': {
            color: '#4b5563',
          },
        }}
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Book' :
            dialogMode === 'edit' ? 'Edit Book' : 'Book Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={selectedBook?.title || ''}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setSelectedBook({ ...selectedBook, title: newTitle });

                  // Auto-generate subtitle if subtitle is empty and title has content
                  if (newTitle.trim() && !selectedBook?.subtitle?.trim()) {
                    const generatedSubtitle = `A comprehensive guide to ${newTitle.trim()}`;
                    setSelectedBook((prev: any) => ({ ...prev, title: newTitle, subtitle: generatedSubtitle }));
                  }

                  // Clear validation error when user starts typing
                  if (validationErrors.title) {
                    setValidationErrors({ ...validationErrors, title: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.title}
                helperText={validationErrors.title}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Author"
                value={selectedBook?.author || ''}
                onChange={(e) => {
                  setSelectedBook({ ...selectedBook, author: e.target.value });
                  if (validationErrors.author) {
                    setValidationErrors({ ...validationErrors, author: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.author}
                helperText={validationErrors.author}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subtitle"
                value={selectedBook?.subtitle || ''}
                onChange={(e) => setSelectedBook({ ...selectedBook, subtitle: e.target.value })}
                disabled={dialogMode === 'view'}
                placeholder="Optional subtitle for the book"
                helperText="Optional: Add a subtitle to provide more context"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth error={!!validationErrors.category}>
                  <InputLabel>Book Category *</InputLabel>
                  <Select
                    value={selectedBook?.category || ''}
                    label="Book Category *"
                    onChange={(e) => setSelectedBook({ ...selectedBook, category: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.category && (
                    <FormHelperText>{validationErrors.category}</FormHelperText>
                  )}
                </FormControl>
                <Tooltip title="Add New Category">
                  <IconButton
                    onClick={() => setCategoryDialogOpen(true)}
                    disabled={dialogMode === 'view'}
                    sx={{
                      mt: 1,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'grey.300',
                        color: 'grey.500'
                      }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <InputLabel>Book Type</InputLabel>
                  <Select
                    value={selectedBook?.type || 'Books'}
                    label="Book Type"
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      // Strip 'Audiobook' from format array — it's managed by Type, not Format
                      const currentFormat = (selectedBook?.format || []).filter((f: string) => f !== 'Audiobook');
                      const defaultFormat = currentFormat.length > 0 ? currentFormat : (newType === 'Audiobook' ? [] : ['E-book']);
                      setSelectedBook({ ...selectedBook, type: newType, format: defaultFormat });
                    }}
                    disabled={dialogMode === 'view'}
                  >
                    {bookTypes.length > 0 ? (
                      bookTypes.map((type) => (
                        <MenuItem key={type._id} value={type.name}>
                          {type.name}
                        </MenuItem>
                      ))
                    ) : (
                      <>
                        <MenuItem value="Books">Books</MenuItem>
                        <MenuItem value="Audiobook">Audiobook</MenuItem>
                      </>
                    )}
                  </Select>
                </FormControl>
                <Tooltip title="Add New Book Type">
                  <IconButton
                    onClick={() => setBookTypeDialogOpen(true)}
                    disabled={dialogMode === 'view'}
                    sx={{
                      mt: 1,
                      bgcolor: 'secondary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'secondary.dark',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'grey.300',
                        color: 'grey.500'
                      }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <InputLabel>Books Hub</InputLabel>
                  <Select
                    value={selectedBook?.componentType || 'none'}
                    label="Books Hub"
                    onChange={(e) => setSelectedBook({ ...selectedBook, componentType: e.target.value as any })}
                    disabled={dialogMode === 'view'}
                  >
                    {/* Always include None option first */}
                    <MenuItem value="none">None (Regular Book)</MenuItem>
                    {bookHubs.length > 0 ? (
                      bookHubs.map((hub) => (
                        <MenuItem key={hub._id} value={hub.value}>
                          {hub.name}
                        </MenuItem>
                      ))
                    ) : (
                      <>
                        <MenuItem value="free-summaries">Free Summaries</MenuItem>
                        <MenuItem value="trending-books">Trending Books</MenuItem>
                        <MenuItem value="premium-summaries">Premium Summaries</MenuItem>
                      </>
                    )}
                  </Select>
                </FormControl>
                <Tooltip title="Add New Books Hub">
                  <IconButton
                    onClick={() => setBookHubDialogOpen(true)}
                    disabled={dialogMode === 'view'}
                    sx={{
                      mt: 1,
                      bgcolor: 'success.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'success.dark',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'grey.300',
                        color: 'grey.500'
                      }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedBook?.status || ''}
                    label="Status"
                    onChange={(e) =>
                      setSelectedBook({
                        ...selectedBook,
                        status: e.target.value as 'draft' | 'review' | 'published' | 'archived'
                      })
                    }
                    disabled={dialogMode === 'view'}
                  >
                    {bookStatusesList.length > 0 ? (
                      bookStatusesList.map((status: any) => (
                        <MenuItem key={status._id} value={status.value}>
                          {status.name}
                        </MenuItem>
                      ))
                    ) : (
                      statuses.map((status: any) => (
                        <MenuItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Tooltip title="Add New Status">
                  <IconButton
                    onClick={() => setBookStatusDialogOpen(true)}
                    disabled={dialogMode === 'view'}
                    sx={{
                      mt: 1,
                      bgcolor: 'warning.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'warning.dark',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'grey.300',
                        color: 'grey.500'
                      }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Discount Price"
                type="number"
                value={selectedBook?.discountPrice || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setSelectedBook({ ...selectedBook, discountPrice: value });
                  if (validationErrors.discountPrice) {
                    setValidationErrors({ ...validationErrors, discountPrice: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                InputProps={{ startAdornment: '₹' }}
                error={!!validationErrors.discountPrice}
                helperText={validationErrors.discountPrice}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Original Price"
                type="number"
                value={selectedBook?.originalPrice || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setSelectedBook({ ...selectedBook, originalPrice: value });
                }}
                disabled={dialogMode === 'view'}
                InputProps={{ startAdornment: '₹' }}
                helperText="For discount calculations (optional)"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={(selectedBook as any)?.language || 'English'}
                    label="Language"
                    onChange={(e) => setSelectedBook({ ...selectedBook, language: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {languageList.map((lang) => (
                      <MenuItem key={lang._id} value={lang.name}>
                        {lang.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Language of the book</FormHelperText>
                </FormControl>
                <Tooltip title="Add New Language">
                  <IconButton
                    onClick={() => setLanguageDialogOpen(true)}
                    disabled={dialogMode === 'view'}
                    sx={{
                      mt: 1,
                      bgcolor: 'purple',
                      color: 'white',
                      '&:hover': { bgcolor: '#6a0dad' },
                      '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <InputLabel>GST Percentage (%)</InputLabel>
                  <Select
                    value={selectedBook?.gst || 0}
                    label="GST Percentage (%)"
                    onChange={(e) => setSelectedBook({ ...selectedBook, gst: e.target.value as number })}
                    disabled={dialogMode === 'view'}
                  >
                    <MenuItem value={0}>No GST (0%)</MenuItem>
                    {gstList.map((gst) => (
                      <MenuItem key={gst._id} value={gst.percentage}>
                        {gst.percentage}% GST
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Add New GST %">
                  <IconButton
                    onClick={() => setGstDialogOpen(true)}
                    disabled={dialogMode === 'view'}
                    sx={{
                      mt: 1,
                      bgcolor: 'info.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'info.dark',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'grey.300',
                        color: 'grey.500'
                      }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pages"
                type="number"
                value={selectedBook?.pages || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                  setSelectedBook({ ...selectedBook, pages: value });
                  if (validationErrors.pages) {
                    setValidationErrors({ ...validationErrors, pages: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.pages}
                helperText={validationErrors.pages}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ISBN"
                value={selectedBook?.isbn || ''}
                onChange={(e) => {
                  setSelectedBook({ ...selectedBook, isbn: e.target.value });
                  if (validationErrors.isbn) {
                    setValidationErrors({ ...validationErrors, isbn: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.isbn}
                helperText={validationErrors.isbn || 'Optional: Enter ISBN-10 or ISBN-13 format'}
                placeholder="978-0-123456-78-9 or 0123456789"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={selectedBook?.description || ''}
                onChange={(e) => {
                  setSelectedBook({ ...selectedBook, description: e.target.value });
                  if (validationErrors.description) {
                    setValidationErrors({ ...validationErrors, description: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
                required
                placeholder="Enter a detailed description of the book..."
              />
            </Grid>

            {/* Publish Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Publish Date"
                type="date"
                value={selectedBook?.publishDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setSelectedBook({ ...selectedBook, publishDate: e.target.value });
                  if (validationErrors.publishDate) {
                    setValidationErrors({ ...validationErrors, publishDate: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.publishDate}
                helperText={validationErrors.publishDate || 'Date when the book was published'}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Rating */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rating"
                type="number"
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                value={selectedBook?.rating || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setSelectedBook({ ...selectedBook, rating: value });
                  if (validationErrors.rating) {
                    setValidationErrors({ ...validationErrors, rating: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.rating}
                helperText={validationErrors.rating || 'Rating out of 5 stars'}
              />
            </Grid>

            {/* Reviews Count */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reviews Count"
                type="number"
                value={selectedBook?.reviews || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setSelectedBook({ ...selectedBook, reviews: value });
                  if (validationErrors.reviews) {
                    setValidationErrors({ ...validationErrors, reviews: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.reviews}
                helperText={validationErrors.reviews}
              />
            </Grid>

            {/* Sales Count */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sales Count"
                type="number"
                value={selectedBook?.sales ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setSelectedBook({ ...selectedBook, sales: value });
                  if (validationErrors.sales) {
                    setValidationErrors({ ...validationErrors, sales: undefined });
                  }
                }}
                disabled={dialogMode === 'view'}
                error={!!validationErrors.sales}
                helperText={validationErrors.sales}
              />
            </Grid>

            {/* Book Formats */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={
                      bookFormats.length > 0
                        ? bookFormats.map(f => f.name).filter(n => n !== 'Audiobook')
                        : ['Hardcover', 'Paperback', 'E-book']
                    }
                    value={(selectedBook?.format || ['E-book']).filter((f: string) => f !== 'Audiobook')}
                    onChange={(event, newValue) => {
                      const formatValue = newValue && newValue.length > 0 ? newValue : ['E-book'];
                      setSelectedBook({ ...selectedBook, format: formatValue });
                      if (validationErrors.format) {
                        setValidationErrors({ ...validationErrors, format: undefined });
                      }
                    }}
                    disabled={dialogMode === 'view'}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <MuiChip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Book Formats"
                        placeholder="Add formats..."
                        error={!!validationErrors.format}
                        helperText={validationErrors.format || 'Physical/digital format — "Audiobook" is set automatically by Book Type'}
                      />
                    )}
                  />
                </Box>
                <Tooltip title="Add New Format">
                  <IconButton
                    onClick={() => setBookFormatDialogOpen(true)}
                    disabled={dialogMode === 'view'}
                    sx={{
                      mt: 1,
                      bgcolor: 'secondary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'secondary.dark' },
                      '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={selectedBook?.tags || []}
                onChange={(event, newValue) => {
                  // Convert to lowercase as per backend schema
                  const lowercaseTags = newValue.map(tag => typeof tag === 'string' ? tag.toLowerCase().trim() : tag);
                  setSelectedBook({ ...selectedBook, tags: lowercaseTags });
                }}
                disabled={dialogMode === 'view'}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <MuiChip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={index}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags for better searchability..."
                    helperText="Press Enter to add tags. Tags help users find your book."
                  />
                )}
              />
            </Grid>

            {/* Conditional File Uploads based on Format */}
            {selectedBook?.format?.includes('E-book') && (
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    E-book File *
                  </Typography>

                  {(() => {
                    const bookRecord = selectedBook as any;
                    const existingEbookFile = bookRecord?.files?.ebook;
                    const hasExistingEbook = Boolean(existingEbookFile);
                    const ebookUrl = existingEbookFile?.url || bookRecord?.ebookUrl || bookRecord?.fileUrls?.ebook;
                    const ebookFileName = bookFilePreview || existingEbookFile?.originalName || 'E-book File';
                    const ebookFileSize = bookFile ? bookFile.size : existingEbookFile?.fileSize;
                    const ebookMimeType = bookFile?.type || existingEbookFile?.mimeType;
                    const showEbookCard = Boolean(bookFilePreview || hasExistingEbook);

                    return showEbookCard ? (
                      <Box sx={{ mb: 2 }}>
                        <Box
                          onClick={!isReadOnlyMode ? () => openUploadPicker('ebook') : undefined}
                          onDragEnter={handleUploadZoneDragEnter('ebook')}
                          onDragOver={handleUploadZoneDragOver('ebook')}
                          onDragLeave={handleUploadZoneDragLeave('ebook')}
                          onDrop={handleUploadZoneDrop('ebook')}
                          onKeyDown={handleUploadZoneKeyDown('ebook')}
                          role={!isReadOnlyMode ? 'button' : undefined}
                          tabIndex={!isReadOnlyMode ? 0 : undefined}
                          sx={{
                            ...getUploadZoneStateSx('ebook'),
                            p: 2,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CloudUpload color={dragOverTarget === 'ebook' ? 'primary' : 'action'} />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {ebookFileName}
                              </Typography>
                              {(ebookFileSize || ebookMimeType) && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {ebookFileSize ? <>Size: {(ebookFileSize / 1024 / 1024).toFixed(2)} MB</> : null}
                                  {ebookMimeType ? <> {ebookFileSize ? '| ' : ''}Type: {ebookMimeType}</> : null}
                                </Typography>
                              )}
                              {!isReadOnlyMode && (
                                <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                                  Click or drag a PDF, EPUB, or TXT file here to replace
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {!isReadOnlyMode && bookFile && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveBookFile();
                              }}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          )}
                        </Box>

                        {bookFile && bookFile.type === 'application/pdf' && (
                          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', bgcolor: 'white' }}>
                            <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: '1px solid #ddd' }}>
                              <Typography variant="subtitle2" color="primary">
                                PDF Preview
                              </Typography>
                            </Box>
                            <Box sx={{ height: 400, overflow: 'auto' }}>
                              <iframe
                                src={URL.createObjectURL(bookFile)}
                                width="100%"
                                height="400"
                                style={{ border: 'none' }}
                                title="PDF Preview"
                              />
                            </Box>
                          </Box>
                        )}

                        {bookFile && bookFile.type !== 'application/pdf' && (
                          <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 1, textAlign: 'center', bgcolor: 'grey.50' }}>
                            <Typography variant="body2" color="text.secondary">
                              {bookFile.type.includes('epub') ? 'EPUB' : bookFile.type.includes('text') ? 'Text' : 'Document'} file ready for upload
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Preview not available for this file type
                            </Typography>
                          </Box>
                        )}

                        {!bookFile && hasExistingEbook && (
                          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', bgcolor: 'white' }}>
                            <Box sx={{ p: 2, bgcolor: 'success.light', borderBottom: '1px solid #ddd' }}>
                              <Typography variant="subtitle2" color="white" sx={{ fontWeight: 'bold' }}>
                                Existing E-book File
                              </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                              <Typography variant="body2" gutterBottom>
                                {existingEbookFile?.originalName || 'E-book File'}
                              </Typography>
                              {existingEbookFile?.fileSize && (
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                  Size: {(existingEbookFile.fileSize / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                              )}
                              {ebookUrl && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  href={ebookUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  startIcon={<CloudUpload />}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  Open File
                                </Button>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box
                        onClick={!isReadOnlyMode ? () => openUploadPicker('ebook') : undefined}
                        onDragEnter={handleUploadZoneDragEnter('ebook')}
                        onDragOver={handleUploadZoneDragOver('ebook')}
                        onDragLeave={handleUploadZoneDragLeave('ebook')}
                        onDrop={handleUploadZoneDrop('ebook')}
                        onKeyDown={handleUploadZoneKeyDown('ebook')}
                        role={!isReadOnlyMode ? 'button' : undefined}
                        tabIndex={!isReadOnlyMode ? 0 : undefined}
                        sx={{
                          ...getUploadZoneStateSx('ebook'),
                          borderRadius: 1,
                          p: 3,
                          textAlign: 'center',
                        }}
                      >
                        <CloudUpload sx={{ fontSize: 48, color: dragOverTarget === 'ebook' ? 'primary.main' : 'grey.400', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Click or drag a PDF, EPUB, or TXT file here to upload
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          PDF, EPUB, or TXT format
                        </Typography>
                      </Box>
                    );
                  })()}

                  {dialogMode !== 'view' && (
                    <Box sx={{ mt: 2 }}>
                      <input
                        ref={ebookInputRef}
                        accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
                        style={{ display: 'none' }}
                        id="book-file-upload"
                        type="file"
                        onChange={handleBookFileUpload}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        Supported formats: PDF, EPUB, TXT. Max size: 50MB
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            {((selectedBook as any)?.type === 'Audiobook' || selectedBook?.format?.includes('Audiobook')) && (
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Audiobook File *
                  </Typography>

                  {(() => {
                    const bookRecord = selectedBook as any;
                    const existingAudioFile = bookRecord?.files?.audiobook;
                    const hasExistingAudio = Boolean(existingAudioFile);
                    const audioUrl = existingAudioFile?.url || bookRecord?.audiobookUrl || bookRecord?.fileUrls?.audiobook;
                    const audioFileName = audioFilePreview || existingAudioFile?.originalName || 'Audio File';
                    const audioFileSize = audioFile ? audioFile.size : existingAudioFile?.fileSize;
                    const audioMimeType = audioFile?.type || existingAudioFile?.mimeType || 'audio/mpeg';
                    const audioDuration = existingAudioFile?.duration;
                    const showAudioCard = Boolean(audioFilePreview || hasExistingAudio);

                    return showAudioCard ? (
                      <Box sx={{ mb: 2 }}>
                        <Box
                          onClick={!isReadOnlyMode ? () => openUploadPicker('audio') : undefined}
                          onDragEnter={handleUploadZoneDragEnter('audio')}
                          onDragOver={handleUploadZoneDragOver('audio')}
                          onDragLeave={handleUploadZoneDragLeave('audio')}
                          onDrop={handleUploadZoneDrop('audio')}
                          onKeyDown={handleUploadZoneKeyDown('audio')}
                          role={!isReadOnlyMode ? 'button' : undefined}
                          tabIndex={!isReadOnlyMode ? 0 : undefined}
                          sx={{
                            ...getUploadZoneStateSx('audio'),
                            p: 2,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CloudUpload color={dragOverTarget === 'audio' ? 'primary' : 'action'} />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {audioFileName}
                              </Typography>
                              {(audioFileSize || audioMimeType || audioDuration) && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {audioFileSize ? <>Size: {(audioFileSize / 1024 / 1024).toFixed(2)} MB</> : null}
                                  {audioMimeType ? <> {audioFileSize ? '| ' : ''}Type: {audioMimeType}</> : null}
                                  {audioDuration ? <> {(audioFileSize || audioMimeType) ? '| ' : ''}Duration: {Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}</> : null}
                                </Typography>
                              )}
                              {!isReadOnlyMode && (
                                <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                                  Click or drag an MP3, M4A, WAV, or OGG file here to replace
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {!isReadOnlyMode && audioFile && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveAudioFile();
                              }}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          )}
                        </Box>

                        {audioFile && (
                          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', bgcolor: 'white' }}>
                            <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: '1px solid #ddd' }}>
                              <Typography variant="subtitle2" color="primary">
                                Audio Preview
                              </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                              <audio controls style={{ width: '100%' }} preload="metadata">
                                <source src={URL.createObjectURL(audioFile)} type={audioFile.type} />
                                Your browser does not support the audio element.
                              </audio>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Duration will be calculated after upload
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {!audioFile && hasExistingAudio && (
                          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', bgcolor: 'white' }}>
                            <Box sx={{ p: 2, bgcolor: 'info.light', borderBottom: '1px solid #ddd' }}>
                              <Typography variant="subtitle2" color="white" sx={{ fontWeight: 'bold' }}>
                                Existing Audio File
                              </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                              <Typography variant="body2" gutterBottom>
                                {existingAudioFile?.originalName || 'Audio File'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                {audioFileSize ? <>Size: {(audioFileSize / 1024 / 1024).toFixed(2)} MB</> : null}
                                {audioDuration ? <> {audioFileSize ? '| ' : ''}Duration: {Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}</> : null}
                              </Typography>
                              {audioUrl && (
                                <>
                                  <audio
                                    controls
                                    style={{ width: '100%', marginBottom: '8px' }}
                                    preload="none"
                                    onError={(e) => {
                                      console.error('Audio failed to load:', audioUrl);
                                    }}
                                  >
                                    <source src={audioUrl} type={audioMimeType} />
                                    Your browser does not support the audio element.
                                  </audio>
                                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    Audio player. Click download if playback does not work.
                                  </Typography>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    href={audioUrl}
                                    target="_blank"
                                    startIcon={<CloudUpload />}
                                  >
                                    Download
                                  </Button>
                                </>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box
                        onClick={!isReadOnlyMode ? () => openUploadPicker('audio') : undefined}
                        onDragEnter={handleUploadZoneDragEnter('audio')}
                        onDragOver={handleUploadZoneDragOver('audio')}
                        onDragLeave={handleUploadZoneDragLeave('audio')}
                        onDrop={handleUploadZoneDrop('audio')}
                        onKeyDown={handleUploadZoneKeyDown('audio')}
                        role={!isReadOnlyMode ? 'button' : undefined}
                        tabIndex={!isReadOnlyMode ? 0 : undefined}
                        sx={{
                          ...getUploadZoneStateSx('audio'),
                          borderRadius: 1,
                          p: 3,
                          textAlign: 'center',
                        }}
                      >
                        <CloudUpload sx={{ fontSize: 48, color: dragOverTarget === 'audio' ? 'primary.main' : 'grey.400', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Click or drag an MP3, M4A, WAV, or OGG file here to upload
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          MP3, M4A, WAV, or OGG format
                        </Typography>
                      </Box>
                    );
                  })()}

                  {dialogMode !== 'view' && (
                    <Box sx={{ mt: 2 }}>
                      <input
                        ref={audioInputRef}
                        accept=".mp3,.m4a,.wav,.ogg,audio/*"
                        style={{ display: 'none' }}
                        id="audio-file-upload"
                        type="file"
                        onChange={handleAudioFileUpload}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        Supported formats: MP3, M4A, WAV, OGG. Max size: 500MB
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            {/* Audiobook-specific fields */}
            {((selectedBook as any)?.type === 'Audiobook' || selectedBook?.format?.includes('Audiobook')) && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duration"
                    value={selectedBook?.duration || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, duration: e.target.value })}
                    disabled={dialogMode === 'view'}
                    placeholder="e.g., 5h 30m"
                    helperText="Audio duration (e.g., 5h 30m, 3 hours 15 minutes)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Narrator"
                    value={selectedBook?.narrator || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, narrator: e.target.value })}
                    disabled={dialogMode === 'view'}
                    placeholder="Narrator name"
                    helperText="Name of the person who narrated the audiobook"
                  />
                </Grid>
              </>
            )}

            {/* Existing Files Preview - Always show when files exist */}
            {selectedBook && (selectedBook as any)?.files?.ebook && (
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    ✅ Existing E-book File
                  </Typography>
                  {(() => {
                    const hasEbook = selectedBook && (selectedBook as any)?.files?.ebook;
                    if (hasEbook) {
                    }
                    return hasEbook;
                  })() && (
                      <Box sx={{
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'white'
                      }}>
                        <Box sx={{ p: 2, bgcolor: 'success.light', borderBottom: '1px solid #ddd' }}>
                          <Typography variant="subtitle2" color="white" sx={{ fontWeight: 'bold' }}>
                            ✅ EXISTING E-BOOK FILE FOUND!
                          </Typography>
                        </Box>
                        <Box sx={{ p: 3 }}>
                          {(() => {
                            const book = selectedBook as any;
                            const ebookFile = book?.files?.ebook;
                            const originalUrl = ebookFile?.url || book?.ebookUrl || book?.fileUrls?.ebook;
                            // Modify Cloudinary URL to force inline viewing instead of download
                            const ebookUrl = originalUrl ? originalUrl.replace('/upload/', '/upload/fl_attachment:false/') : null;
                            const fileName = ebookFile?.originalName || 'E-book File';
                            const fileSize = ebookFile?.fileSize;
                            const mimeType = ebookFile?.mimeType;

                            return (
                              <>
                                <Typography variant="body2" gutterBottom>
                                  {fileName}
                                </Typography>
                                {fileSize && (
                                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                    Size: {(fileSize / 1024 / 1024).toFixed(2)} MB
                                  </Typography>
                                )}
                                {/* PDF Preview for existing files */}
                                {(mimeType === 'application/pdf' || ebookUrl?.includes('.pdf')) && ebookUrl && (
                                  <Box sx={{ mb: 2 }}>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        📄 PDF Preview
                                      </Typography>
                                    </Box>

                                    {/* PDF Thumbnail/Preview Card */}
                                    <Box sx={{
                                      border: '2px solid #e0e0e0',
                                      borderRadius: 2,
                                      p: 3,
                                      bgcolor: '#f8f9fa',
                                      textAlign: 'center',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        borderColor: '#1976d2',
                                        bgcolor: '#f0f7ff'
                                      }
                                    }}>
                                      {/* PDF Icon */}
                                      <Box sx={{ mb: 2 }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="#d32f2f">
                                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                          <text x="12" y="16" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">PDF</text>
                                        </svg>
                                      </Box>

                                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                                        {fileName}
                                      </Typography>

                                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                        PDF Document • {(fileSize / 1024 / 1024).toFixed(2)} MB
                                      </Typography>

                                      <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
                                        Click to view PDF in new tab
                                      </Typography>
                                    </Box>

                                    {/* Action Buttons */}
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        href={originalUrl}
                                        target="_blank"
                                        startIcon={<CloudUpload />}
                                        sx={{ minWidth: '140px' }}
                                      >
                                        View PDF
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        href={`https://docs.google.com/viewer?url=${encodeURIComponent(originalUrl)}`}
                                        target="_blank"
                                        sx={{ minWidth: '140px' }}
                                      >
                                        Google Viewer
                                      </Button>
                                      <Button
                                        variant="text"
                                        size="small"
                                        href={originalUrl}
                                        download={fileName}
                                        startIcon={<CloudUpload />}
                                        sx={{ minWidth: '100px' }}
                                      >
                                        Download
                                      </Button>
                                    </Box>
                                  </Box>
                                )}
                              </>
                            );
                          })()}
                        </Box>
                      </Box>
                    )}
                </Box>
              </Grid>
            )}

            {selectedBook && (selectedBook as any)?.files?.audiobook && (
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    ✅ Existing Audio File
                  </Typography>
                  {(() => {
                    const hasAudio = selectedBook && (selectedBook as any)?.files?.audiobook;
                    if (hasAudio) {
                    }
                    return hasAudio;
                  })() && (
                      <Box sx={{
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'white'
                      }}>
                        <Box sx={{ p: 2, bgcolor: 'info.light', borderBottom: '1px solid #ddd' }}>
                          <Typography variant="subtitle2" color="white" sx={{ fontWeight: 'bold' }}>
                            ✅ EXISTING AUDIO FILE FOUND!
                          </Typography>
                        </Box>
                        <Box sx={{ p: 3 }}>
                          {(() => {
                            const book = selectedBook as any;
                            const audioFile = book?.files?.audiobook;
                            const audioUrl = audioFile?.url || book?.audiobookUrl || book?.fileUrls?.audiobook;
                            const fileName = audioFile?.originalName || 'Audio File';
                            const fileSize = audioFile?.fileSize;
                            const duration = audioFile?.duration;
                            const mimeType = audioFile?.mimeType || 'audio/mpeg';

                            return (
                              <>
                                <Typography variant="body2" gutterBottom>
                                  {fileName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                  {fileSize && `Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`}
                                  {duration && (
                                    <> • Duration: {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</>
                                  )}
                                </Typography>
                                {audioUrl && (
                                  <>
                                    {/* Enhanced Audio Player */}
                                    <Box sx={{
                                      border: '1px solid #e0e0e0',
                                      borderRadius: 2,
                                      p: 2,
                                      bgcolor: '#fafafa',
                                      mb: 2
                                    }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        {/* Audio Icon */}
                                        <Box sx={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: '50%',
                                          bgcolor: '#1976d2',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0
                                        }}>
                                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                            <path d="M12,3V9.28C11.47,9.1 10.92,9 10.34,9C7.95,9 6.05,10.9 6.05,13.29C6.05,15.68 7.95,17.58 10.34,17.58C12.73,17.58 14.63,15.68 14.63,13.29V7.58L19,6.84V11.28C18.47,11.1 17.92,11 17.34,11C14.95,11 13.05,12.9 13.05,15.29C13.05,17.68 14.95,19.58 17.34,19.58C19.73,19.58 21.63,17.68 21.63,15.29V3H12Z" />
                                          </svg>
                                        </Box>

                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="body2" fontWeight="medium" noWrap>
                                            {fileName}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {duration && `Duration: ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')} • `}
                                            {(fileSize / 1024 / 1024).toFixed(2)} MB
                                          </Typography>
                                        </Box>
                                      </Box>

                                      {/* Audio Controls */}
                                      <audio
                                        controls
                                        style={{
                                          width: '100%',
                                          height: '40px',
                                          borderRadius: '8px'
                                        }}
                                        preload="none"
                                        onError={(e) => {
                                          console.error('Audio failed to load:', audioUrl);
                                        }}
                                      >
                                        <source src={audioUrl} type={mimeType} />
                                        Your browser does not support the audio element.
                                      </audio>
                                    </Box>

                                    {/* Audio Action Buttons */}
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        href={audioUrl}
                                        target="_blank"
                                        startIcon={<CloudUpload />}
                                        sx={{ minWidth: '120px' }}
                                      >
                                        Open Audio
                                      </Button>
                                      <Button
                                        variant="text"
                                        size="small"
                                        href={audioUrl}
                                        download={fileName}
                                        startIcon={<CloudUpload />}
                                        sx={{ minWidth: '100px' }}
                                      >
                                        Download
                                      </Button>
                                    </Box>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </Box>
                      </Box>
                    )}
                </Box>
              </Grid>
            )}

            {/* Cover Image Upload */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cover Image
                </Typography>

                <Box
                  onClick={!isReadOnlyMode ? () => openUploadPicker('cover') : undefined}
                  onDragEnter={handleUploadZoneDragEnter('cover')}
                  onDragOver={handleUploadZoneDragOver('cover')}
                  onDragLeave={handleUploadZoneDragLeave('cover')}
                  onDrop={handleUploadZoneDrop('cover')}
                  onKeyDown={handleUploadZoneKeyDown('cover')}
                  role={!isReadOnlyMode ? 'button' : undefined}
                  tabIndex={!isReadOnlyMode ? 0 : undefined}
                  sx={{
                    ...getUploadZoneStateSx('cover', imagePreview ? 'transparent' : 'grey.50'),
                    position: 'relative',
                    display: 'inline-flex',
                    width: '150px',
                    aspectRatio: '2 / 3',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    mb: 2,
                    p: imagePreview ? 1 : 2,
                    gap: 1,
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                      }}
                    />
                  ) : (
                    <>
                      <Box sx={{ fontSize: 48, color: dragOverTarget === 'cover' ? 'primary.main' : 'grey.400', mb: 1 }}>
                        <ImageIcon size={48} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        Click or drag an image here to upload
                      </Typography>
                    </>
                  )}

                  {dialogMode !== 'view' && imagePreview && (
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveImage();
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {dialogMode !== 'view' && (
                  <Box>
                    <input
                      ref={coverInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="cover-image-upload"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      {imagePreview ? 'Click or drag an image on the cover to replace it.' : 'Click or drag an image here to upload.'}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      Recommended cover size: 1024 x 1536 px (2:3 portrait).
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedBook?.featured || false}
                    onChange={(e) => setSelectedBook({ ...selectedBook, featured: e.target.checked })}
                    disabled={dialogMode === 'view'}
                  />
                }
                label="Featured Book"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedBook?.bestseller || false}
                    onChange={(e) => setSelectedBook({ ...selectedBook, bestseller: e.target.checked })}
                    disabled={dialogMode === 'view'}
                  />
                }
                label="Bestseller"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSaveBook}
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : null}
            >
              {submitting
                ? 'Saving...'
                : dialogMode === 'add' ? 'Add Book' : 'Save Changes'
              }
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete color="error" />
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            This action cannot be undone.
          </Alert>
          <Typography>
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 8000 : 6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ minWidth: '300px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Category Creation Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New Category
        </DialogTitle>
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
                  cursor: 'pointer'
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: newCategoryData.color,
                  border: '1px solid #ddd'
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={!newCategoryData.name.trim()}
          >
            Create Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && books.length === 0}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading books...
          </Typography>
        </Box>
      </Backdrop>

      {/* Book Type Creation Dialog */}
      <Dialog
        open={bookTypeDialogOpen}
        onClose={() => setBookTypeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Book Type</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Book Type Name"
              value={newBookTypeData.name}
              onChange={(e) => setNewBookTypeData({ ...newBookTypeData, name: e.target.value })}
              sx={{ mb: 2 }}
              required
              autoFocus
              placeholder="e.g., E-Book, Hardcover"
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              value={newBookTypeData.description}
              onChange={(e) => setNewBookTypeData({ ...newBookTypeData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">Color:</Typography>
              <input
                type="color"
                value={newBookTypeData.color}
                onChange={(e) => setNewBookTypeData({ ...newBookTypeData, color: e.target.value })}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: newBookTypeData.color,
                  border: '1px solid #ddd'
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookTypeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBookType}
            variant="contained"
            disabled={!newBookTypeData.name.trim()}
          >
            Create Book Type
          </Button>
        </DialogActions>
      </Dialog>

      {/* Book Format Creation Dialog */}
      <Dialog
        open={bookFormatDialogOpen}
        onClose={() => setBookFormatDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Book Format</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Format Name"
              value={newBookFormatData.name}
              onChange={(e) => setNewBookFormatData({ ...newBookFormatData, name: e.target.value })}
              sx={{ mb: 2 }}
              required
              autoFocus
              placeholder="e.g., Hardcover, Paperback, E-book"
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              value={newBookFormatData.description}
              onChange={(e) => setNewBookFormatData({ ...newBookFormatData, description: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookFormatDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBookFormat}
            variant="contained"
            disabled={!newBookFormatData.name.trim()}
          >
            Create Format
          </Button>
        </DialogActions>
      </Dialog>

      {/* Books Hub Creation Dialog */}
      <Dialog
        open={bookHubDialogOpen}
        onClose={() => setBookHubDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Books Hub</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Hub Name"
              value={newBookHubData.name}
              onChange={(e) => {
                const name = e.target.value;
                setNewBookHubData({
                  ...newBookHubData,
                  name,
                  value: name.toLowerCase().replace(/\s+/g, '-')
                });
              }}
              sx={{ mb: 2 }}
              required
              autoFocus
              placeholder="e.g., Free Summaries"
            />
            <TextField
              fullWidth
              label="Hub Value (System Name)"
              value={newBookHubData.value}
              onChange={(e) => setNewBookHubData({ ...newBookHubData, value: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              sx={{ mb: 2 }}
              required
              helperText="Must be a valid system value (e.g., free-summaries, trending-books, premium-summaries)"
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              value={newBookHubData.description}
              onChange={(e) => setNewBookHubData({ ...newBookHubData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">Color:</Typography>
              <input
                type="color"
                value={newBookHubData.color}
                onChange={(e) => setNewBookHubData({ ...newBookHubData, color: e.target.value })}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: newBookHubData.color,
                  border: '1px solid #ddd'
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookHubDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBookHub}
            variant="contained"
            disabled={!newBookHubData.name.trim() || !newBookHubData.value.trim()}
          >
            Create Books Hub
          </Button>
        </DialogActions>
      </Dialog>

      {/* Book Status Creation Dialog */}
      <Dialog
        open={bookStatusDialogOpen}
        onClose={() => setBookStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Status Name"
              value={newBookStatusData.name}
              onChange={(e) => {
                const name = e.target.value;
                setNewBookStatusData({
                  ...newBookStatusData,
                  name,
                  value: name.toLowerCase().replace(/\s+/g, '-')
                });
              }}
              sx={{ mb: 2 }}
              required
              autoFocus
              placeholder="e.g., In Review"
            />
            <TextField
              fullWidth
              label="Status Value (System Name)"
              value={newBookStatusData.value}
              onChange={(e) => setNewBookStatusData({ ...newBookStatusData, value: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              sx={{ mb: 2 }}
              required
              helperText="Auto-generated from name. Used internally."
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              value={newBookStatusData.description}
              onChange={(e) => setNewBookStatusData({ ...newBookStatusData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">Color:</Typography>
              <input
                type="color"
                value={newBookStatusData.color}
                onChange={(e) => setNewBookStatusData({ ...newBookStatusData, color: e.target.value })}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: newBookStatusData.color,
                  border: '1px solid #ddd'
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBookStatus}
            variant="contained"
            disabled={!newBookStatusData.name.trim() || !newBookStatusData.value.trim()}
          >
            Create Status
          </Button>
        </DialogActions>
      </Dialog>
      {/* GST Creation Dialog */}
      <Dialog
        open={gstDialogOpen}
        onClose={() => setGstDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add New GST Percentage</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="GST Percentage (%)"
              type="number"
              value={newGstData.percentage}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                setNewGstData({ percentage: val });
              }}
              sx={{ mb: 2 }}
              required
              autoFocus
              placeholder="e.g., 18"
              InputProps={{
                endAdornment: <Typography variant="body2" color="text.secondary">%</Typography>,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              This will create a new GST tax bracket that can be applied to books.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGstDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateGst}
            variant="contained"
            disabled={newGstData.percentage < 0}
          >
            Add GST %
          </Button>
        </DialogActions>
      </Dialog>
      {/* Language Creation Dialog */}
      <Dialog
        open={languageDialogOpen}
        onClose={() => setLanguageDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add New Language</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Language Name"
              value={newLanguageData.name}
              onChange={(e) => setNewLanguageData({ name: e.target.value })}
              sx={{ mb: 2 }}
              required
              autoFocus
              placeholder="e.g. English, Hindi, French"
            />
            <Typography variant="caption" color="text.secondary">
              This will create a new language that can be selected for books.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLanguageDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateLanguage}
            variant="contained"
            disabled={!newLanguageData.name.trim()}
          >
            Add Language
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}
