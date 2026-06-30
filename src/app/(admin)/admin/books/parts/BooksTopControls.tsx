import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputBase,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Typography,
} from '@mui/material';
import { Add, BookmarkBorder, Download, FilterList, Refresh, Search, TrendingUp, Visibility } from '@mui/icons-material';

type BooksTopControlsProps = {
  [key: string]: any;
  categories: any[];
  statuses: any[];
};

export default function BooksTopControls(props: BooksTopControlsProps) {
  const {
  apiAvailable,
  loadInitialData,
  loading,
  handleDialogOpen,
  stats,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  categories,
  filterStatus,
  setFilterStatus,
  statuses
  } = props;

  return (
    <>
      {/* API Status Banner */}
      {!apiAvailable && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Backend API is not available. You can still manage books locally, but changes won't be saved to the server.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2, gap: { xs: 1.5, md: 0 } }}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Books Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your book catalog, track sales, and update content
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' }, width: { xs: '100%', md: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadInitialData}
            disabled={loading}
            size="small"
            sx={{ flex: { xs: 1, md: 'none' } }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleDialogOpen('add')}
            size="large"
            sx={{ flex: { xs: 1, md: 'none' } }}
          >
            Add New Book
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  {loading ? (
                    <Skeleton variant="text" width={48} height={30} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold">
                      {stats.total}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Total Books
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                  <BookmarkBorder fontSize="small" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  {loading ? (
                    <Skeleton variant="text" width={48} height={30} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold">
                      {stats.published}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Published
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                  <Visibility fontSize="small" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  {loading ? (
                    <Skeleton variant="text" width={48} height={30} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold">
                      {stats.bestsellers}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Bestsellers
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                  <TrendingUp fontSize="small" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  {loading ? (
                    <Skeleton variant="text" width={48} height={30} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold">
                      {stats.totalSales.toLocaleString()}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Total Sales
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                  <Download fontSize="small" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={4}>
              <Paper
                component="form"
                sx={{ p: '1px 4px', display: 'flex', alignItems: 'center' }}
              >
                <Search sx={{ p: '10px' }} />
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Book Type</InputLabel>
                <Select
                  value={filterType}
                  label="Book Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Books">Books</MenuItem>
                  <MenuItem value="Audiobook">Audiobooks</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Book Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Book Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: category.color
                          }}
                        />
                        {category.name}
                        {category.bookCount > 0 && (
                          <Chip size="small" label={category.bookCount} sx={{ ml: 'auto' }} />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={12}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                fullWidth
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('');
                  setFilterCategory('');
                  setFilterStatus('');
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
