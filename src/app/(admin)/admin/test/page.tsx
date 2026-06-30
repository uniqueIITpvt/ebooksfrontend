'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  Dashboard,
  CheckCircle,
} from '@mui/icons-material';
import Link from 'next/link';

export default function TestPage() {
  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CheckCircle color="success" />
            <Typography variant="h5" component="h1">
              MUI Installation Test
            </Typography>
          </Box>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            If you can see this page with proper styling, MUI is working correctly!
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<Dashboard />}
              component={Link}
              href="/admin/dashboard"
            >
              Go to Dashboard
            </Button>
            <Button variant="outlined">
              Test Button
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
