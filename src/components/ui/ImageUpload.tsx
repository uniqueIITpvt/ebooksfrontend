'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Image as ImageIcon,
} from '@mui/icons-material';

interface ImageUploadProps {
  label: string;
  value?: string; // Current image URL
  onChange: (file: File | null, preview: string | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  maxSize?: number; // Max file size in MB
  acceptedFormats?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  maxSize = 5, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      alert(`Please select a valid image file. Accepted formats: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Image size cannot exceed ${maxSize}MB`);
      return;
    }

    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      onChange(file, previewUrl);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1, 
          fontWeight: 500,
          color: error ? 'error.main' : 'text.primary'
        }}
      >
        {label} {required && <span style={{ color: '#f44336' }}>*</span>}
      </Typography>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {preview ? (
        // Image Preview
        <Paper
          sx={{
            position: 'relative',
            border: error ? '2px solid #f44336' : '2px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'hidden',
            '&:hover': {
              borderColor: error ? '#f44336' : '#1976d2'
            }
          }}
        >
          <Box
            component="img"
            src={preview}
            alt="Preview"
            sx={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              display: 'block',
            }}
          />
          
          {/* Overlay with actions */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              opacity: 0,
              transition: 'opacity 0.3s',
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudUpload />}
              onClick={handleClick}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: 'primary.main' }}
            >
              Change
            </Button>
            <IconButton
              onClick={handleRemove}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: 'error.main' }}
            >
              <Delete />
            </IconButton>
          </Box>

          {uploading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Paper>
      ) : (
        // Upload Area
        <Paper
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          sx={{
            border: error 
              ? '2px dashed #f44336' 
              : dragOver 
                ? '2px dashed #1976d2' 
                : '2px dashed #e0e0e0',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragOver ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: error ? '#f44336' : '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          }}
        >
          {uploading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Processing image...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Drop image here or click to upload
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max size: {maxSize}MB
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                Choose File
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {helperText && (
        <FormHelperText error={error} sx={{ mt: 1, ml: 0 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default ImageUpload;
