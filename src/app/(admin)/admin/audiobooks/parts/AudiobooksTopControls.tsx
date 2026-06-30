import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputBase,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { Add, Refresh, Search } from '@mui/icons-material';

type AudiobooksTopControlsProps = {
  [key: string]: any;
  statuses: any[];
};

export default function AudiobooksTopControls(props: AudiobooksTopControlsProps) {
  const {
  loadData,
  loading,
  openAdd,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  statuses
  } = props;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: 2,
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'primary.light',
          background: 'linear-gradient(135deg, rgba(0,87,184,0.08), rgba(0,166,214,0.08), rgba(245,130,32,0.08))',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {/* <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Image
              src={siteLogo || '/file.svg'}
              alt="TechUniqueIIT Research Center"
              width={48}
              height={48}
              style={{ objectFit: 'contain' }}
            />
          </Box> */}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight="bold" noWrap>
              Audiobooks Management
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              TechUniqueIIT Research Center audiobook catalog
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} disabled={loading}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
            Add Audiobook
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center' }}>
                <Search sx={{ p: '10px' }} />
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search audiobooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as any)}>
                  <MenuItem value="">All</MenuItem>
                  {statuses.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>


    </>
  );
}
