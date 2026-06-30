'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Badge,
  Paper,
  Stack,
} from '@mui/material';
import {
  AccountCircle,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  CameraAlt,
  Person,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        location: (user as any).location || '',
        bio: (user as any).bio || '',
      });
    }
  }, [user]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setMessage({ type: 'error', text: `Image size cannot exceed ${MAX_IMAGE_SIZE_MB}MB` });
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Include avatar in form data if it was changed
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        ...(avatarPreview && { avatar: avatarPreview }),
      };

      const data = await authApi.updateProfile(updateData);

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setAvatarPreview(null);
        await refreshUser();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        My Profile
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* Profile Header Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'center' }, gap: 3, color: 'white', textAlign: { xs: 'center', sm: 'left' } }}>
          {/* Avatar with upload button */}
          <Box sx={{ position: 'relative' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton
                  onClick={handleAvatarClick}
                  sx={{
                    bgcolor: 'white',
                    width: 36,
                    height: 36,
                    '&:hover': { bgcolor: '#f0f0f0' },
                    boxShadow: 2,
                  }}
                >
                  <CameraAlt sx={{ fontSize: 18, color: '#667eea' }} />
                </IconButton>
              }
            >
              <Avatar
                src={avatarPreview || user.avatar}
                alt={user.name}
                sx={{ width: 100, height: 100, border: '4px solid white' }}
              >
                <AccountCircle sx={{ fontSize: 60 }} />
              </Avatar>
            </Badge>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {user.name}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {user.email}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              Role: {user.role === 'admin' || user.role === 'superadmin' ? 'Administrator' : 'User'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Person color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold" color="primary">
              Personal Information
            </Typography>
          </Box>

          <Stack spacing={1}>
            {/* Personal Details Section */}
            <Paper elevation={0} sx={{ p: 4, pt: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="600" color="text.secondary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Basic Details
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    InputProps={{
                      startAdornment: <AccountCircle sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    disabled
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.100' } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Contact Details Section */}
            <Paper elevation={0} sx={{ p: 4, pt: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="600" color="text.secondary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    placeholder="Enter your phone number"
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={handleChange('location')}
                    placeholder="Enter your city/country"
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Bio Section */}
            <Paper elevation={0} sx={{ p: 4, pt: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="600" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                About
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Bio"
                value={formData.bio}
                onChange={handleChange('bio')}
                placeholder="Tell us about yourself, your experience, and interests..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Paper>
          </Stack>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              disabled={saving}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
              sx={{ backgroundColor: '#F59E0B', '&:hover': { backgroundColor: '#D97706' }, borderRadius: 2, px: 4 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
