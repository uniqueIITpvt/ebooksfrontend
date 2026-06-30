import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Pagination,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Add, BookmarkBorder, MoreVert } from '@mui/icons-material';
import { ImageIcon } from 'lucide-react';

import type { Book } from '@/services/api/booksApi';
import {
  formatBookDate,
  formatBookListValue,
  formatInrPrice,
  formatPriceMap,
} from '../formatters';

type AdminBooksTableProps = {
  loading: boolean;
  filteredBooks: Book[];
  paginatedBooks: Book[];
  searchQuery: string;
  filterCategory: string;
  filterStatus: string;
  tablePage: number;
  rowsPerPage: number;
  totalTablePages: number;
  setTablePage: (page: number) => void;
  handleDialogOpen: (mode: 'add' | 'edit' | 'view', book?: Book) => void;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, bookId: string) => void;
  getStatusColor: (status: string) => string;
};

export default function AdminBooksTable({
  loading,
  filteredBooks,
  paginatedBooks,
  searchQuery,
  filterCategory,
  filterStatus,
  tablePage,
  rowsPerPage,
  totalTablePages,
  setTablePage,
  handleDialogOpen,
  handleMenuOpen,
  getStatusColor,
}: AdminBooksTableProps) {
  return (
    <>      {/* Books Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                    <Skeleton variant="rounded" width={80} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                  </Box>
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={28} width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredBooks.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <BookmarkBorder sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No books found
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {searchQuery || filterCategory || filterStatus
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first book'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleDialogOpen('add')}
              sx={{ mt: 2 }}
            >
              Add New Book
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Paper>
          <TableContainer
            sx={{
              maxHeight: 'calc(100vh - 300px)',
              maxWidth: '100%',
              overflow: 'auto',
              overscrollBehaviorX: 'contain',
            }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{
                minWidth: 2500,
                '& th': {
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                  fontWeight: 700,
                  color: '#0f172a',
                  borderBottom: '1px solid rgba(0,87,184,0.22)',
                  background: 'linear-gradient(135deg, rgba(0,87,184,0.12), rgba(0,166,214,0.10), rgba(245,130,32,0.10))',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 90 }} align="right">Actions</TableCell>
                  <TableCell sx={{ minWidth: 76 }}>Image</TableCell>
                  <TableCell sx={{ minWidth: 240 }}>Title</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Subtitle</TableCell>
                  <TableCell sx={{ minWidth: 170 }}>Author</TableCell>
                  <TableCell sx={{ minWidth: 170 }}>Category</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Type</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Component</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Price</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Original</TableCell>
                  {/* <TableCell sx={{ minWidth: 260 }}>Format Prices</TableCell>
                <TableCell sx={{ minWidth: 260 }}>Original Format Prices</TableCell> */}
                  <TableCell sx={{ minWidth: 110 }}>Rating</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Reviews</TableCell>
                  <TableCell sx={{ minWidth: 90 }}>Pages</TableCell>
                  {/* <TableCell sx={{ minWidth: 130 }}>Duration</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Narrator</TableCell> */}
                  <TableCell sx={{ minWidth: 130 }}>Publish Date</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>ISBN</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Formats</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Language</TableCell>
                  <TableCell sx={{ minWidth: 90 }}>GST</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Access</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Featured</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Bestseller</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Tags</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Views</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Downloads</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Sales</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Slug</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Created</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBooks.map((book) => {
                  const bookId = (book as any)._id || book.id;
                  const narrator = book.narrator || book.narratorName || '-';

                  return (
                    <TableRow
                      key={bookId}
                      hover
                      sx={{
                        opacity: book.status === 'archived' ? 0.72 : 1,
                        '& td': { whiteSpace: 'nowrap', verticalAlign: 'middle' },
                      }}
                    >
                      <TableCell align="right">
                        <IconButton onClick={(event) => handleMenuOpen(event, bookId)} size="small">
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            width: 44,
                            height: 58,
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'grey.100',
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >

                          {book.image ? (
                            <Box
                              component="img"
                              src={book.image}
                              alt={book.title}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <ImageIcon size={18} color="#94a3b8" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} noWrap title={book.title} sx={{ maxWidth: 230 }}>
                          {book.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {bookId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap title={book.subtitle || '-'} sx={{ maxWidth: 210 }}>
                          {book.subtitle || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{book.author || '-'}</TableCell>
                      <TableCell>
                        <Chip label={book.category || '-'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{book.type || '-'}</TableCell>
                      <TableCell>{book.componentType || 'none'}</TableCell>
                      <TableCell>{formatInrPrice(book.price)}</TableCell>
                      <TableCell>{book.originalPrice ? formatInrPrice(book.originalPrice) : '-'}</TableCell>
                      {/* <TableCell>
                      <Typography variant="body2" noWrap title={formatPriceMap(book.formatPrices)} sx={{ maxWidth: 250 }}>
                        {formatPriceMap(book.formatPrices)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap title={formatPriceMap(book.formatOriginalPrices)} sx={{ maxWidth: 250 }}>
                        {formatPriceMap(book.formatOriginalPrices)}
                      </Typography>
                    </TableCell> */}
                      <TableCell>{book.rating ?? 0}</TableCell>
                      <TableCell>{book.reviews ?? 0}</TableCell>
                      <TableCell>{book.pages ?? '-'}</TableCell>
                      {/* <TableCell>{book.duration || '-'}</TableCell>
                    <TableCell>{narrator}</TableCell> */}
                      <TableCell>{formatBookDate(book.publishDate)}</TableCell>
                      <TableCell>{book.isbn || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap title={formatBookListValue(book.format)} sx={{ maxWidth: 170 }}>
                          {formatBookListValue(book.format)}
                        </Typography>
                      </TableCell>
                      <TableCell>{book.language || '-'}</TableCell>
                      <TableCell>{book.gst !== undefined ? `${book.gst}%` : '-'}</TableCell>
                      <TableCell>{book.accessLevel || '-'}</TableCell>
                      <TableCell>
                        <Chip label={book.featured ? 'Yes' : 'No'} size="small" color={book.featured ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Chip label={book.bestseller ? 'Yes' : 'No'} size="small" color={book.bestseller ? 'warning' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap title={formatBookListValue(book.tags)} sx={{ maxWidth: 210 }}>
                          {formatBookListValue(book.tags)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={book.status} size="small" color={getStatusColor(book.status) as any} />
                      </TableCell>
                      <TableCell>{book.views ?? 0}</TableCell>
                      <TableCell>{book.downloads ?? 0}</TableCell>
                      <TableCell>{book.sales ?? 0}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap title={book.slug || '-'} sx={{ maxWidth: 210 }}>
                          {book.slug || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatBookDate(book.createdAt)}</TableCell>
                      <TableCell>{formatBookDate(book.updatedAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              px: 2,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing {filteredBooks.length === 0 ? 0 : (tablePage - 1) * rowsPerPage + 1}
              -{Math.min(tablePage * rowsPerPage, filteredBooks.length)} of {filteredBooks.length} books
            </Typography>
            <Pagination
              count={totalTablePages}
              page={tablePage}
              onChange={(_, page) => setTablePage(page)}
              color="primary"
              shape="rounded"
              size="small"
              showFirstButton
              showLastButton
            />
          </Box>
        </Paper>
      )}

    </>
  );
}
