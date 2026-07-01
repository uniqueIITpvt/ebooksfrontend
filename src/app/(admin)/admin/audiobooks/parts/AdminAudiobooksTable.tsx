import {
  Alert,
  Backdrop,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Delete, Edit, Replay } from '@mui/icons-material';

import type { Audiobook } from '@/services/api/audiobooksApi';

type AdminAudiobooksTableProps = {
  loading: boolean;
  filtered: Audiobook[];
  paginated: Audiobook[];
  tablePage: number;
  rowsPerPage: number;
  totalTablePages: number;
  submitting: boolean;
  setTablePage: (page: number) => void;
  openEdit: (book: Audiobook) => void;
  handleDelete: (id: string) => void;
  retryAudioProcessing: (id: string) => void;
};

function getScriptWordCount(book: any) {
  const english = book.scripts?.english?.content || book.scripts?.english || '';
  const hindi = book.scripts?.hindi?.content || book.scripts?.hindi || '';
  return [english, hindi]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function getTimingChipColor(status: string) {
  if (status === 'ready' || status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'queued') return 'info';
  if (status === 'processing' || status === 'uploading') return 'warning';
  return 'default';
}

function getTimingLabel(status: string) {
  if (status === 'ready' || status === 'completed') return 'Completed';
  if (status === 'queued') return 'Queued';
  if (status === 'uploading') return 'Queued';
  if (status === 'processing') return 'Processing';
  if (status === 'failed') return 'Failed';
  return status;
}

function formatUploadedAt(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminAudiobooksTable({
  loading,
  filtered,
  paginated,
  tablePage,
  rowsPerPage,
  totalTablePages,
  submitting,
  setTablePage,
  openEdit,
  handleDelete,
  retryAudioProcessing,
}: AdminAudiobooksTableProps) {
  if (loading) {
    return (
      <Backdrop open sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (filtered.length === 0) {
    return <Alert severity="info">No audiobooks found.</Alert>;
  }

  return (
    <Paper>
      <TableContainer sx={{ maxWidth: '100%', overflow: 'auto' }}>
        <Table sx={{ minWidth: 1280 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 92 }}>Actions</TableCell>
              <TableCell sx={{ width: 76 }}>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Language & Script</TableCell>
              <TableCell>Manual Audio</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Timing</TableCell>
              <TableCell>Rating</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((b) => {
              const book = b as any;
              const id = book._id || b.id;
              const wordCount = getScriptWordCount(book);
              const genStatus = book.audioProcessing?.status || book.generation?.status || 'pending';
              const hasManualAudio = Boolean(b.files?.audiobook?.url);
              const hasTiming = Boolean(book.wordSync?.timings?.length || book.transcript?.languages?.length);
              const timingComplete = hasTiming || genStatus === 'ready' || genStatus === 'completed';
              const displayStatus = b.status || 'draft';

              return (
                <TableRow key={id} hover sx={{ '& td': { whiteSpace: 'nowrap', verticalAlign: 'middle' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton onClick={() => openEdit(b)} disabled={submitting} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(id)} disabled={submitting} color="error" size="small">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: 44, height: 58, borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {book.image ? (
                        <Box component="img" src={book.image} alt={b.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">No img</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="medium" noWrap title={b.title} sx={{ maxWidth: 260 }}>{b.title}</Typography>
                  </TableCell>
                  <TableCell>{b.category ? <Chip size="small" label={b.category} variant="outlined" sx={{ maxWidth: 220 }} /> : '-'}</TableCell>
                  <TableCell>{b.author}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip size="small" label={book.language || 'English'} color={book.language === 'Both' ? 'secondary' : 'default'} />
                      {wordCount > 0 ? (
                        <Typography variant="caption" sx={{ color: '#666' }}>{wordCount.toLocaleString()} words</Typography>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {hasManualAudio ? <Chip size="small" label="Upload complete" color="success" variant="outlined" /> : <Chip size="small" label="Missing" variant="outlined" />}
                      {b.files?.audiobook?.originalName ? (
                        <Tooltip title={b.files.audiobook.originalName}>
                          <Typography variant="caption" sx={{ color: '#666', maxWidth: 180 }} noWrap>{b.files.audiobook.originalName}</Typography>
                        </Tooltip>
                      ) : null}
                      {b.files?.audiobook?.uploadedAt ? (
                        <Typography variant="caption" sx={{ color: '#667085' }}>
                          Uploaded {formatUploadedAt(String(b.files.audiobook.uploadedAt))}
                        </Typography>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={displayStatus} color={displayStatus === 'published' ? 'success' : displayStatus === 'review' ? 'warning' : displayStatus === 'archived' ? 'error' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {timingComplete ? <Chip size="small" label="Completed" color="success" /> : genStatus !== 'pending' ? <Chip size="small" label={getTimingLabel(genStatus)} color={getTimingChipColor(genStatus)} /> : '-'}
                      {genStatus === 'queued' || genStatus === 'processing' || genStatus === 'uploading' ? <LinearProgress variant="determinate" value={book.generation?.progress || 0} sx={{ width: 80 }} /> : null}
                      {book.generation?.error || book.audioProcessing?.errorMessage ? <Typography variant="caption" color="error" sx={{ maxWidth: 180 }} noWrap>{book.generation?.error || book.audioProcessing?.errorMessage}</Typography> : null}
                      {genStatus === 'failed' ? (
                        <Tooltip title="Retry timing">
                          <IconButton onClick={() => retryAudioProcessing(id)} disabled={submitting} size="small" color="warning">
                            <Replay fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {book.rating ? Number(book.rating).toFixed(1) : '0'}/5 · {book.reviews || 0}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filtered.length === 0 ? 0 : (tablePage - 1) * rowsPerPage + 1}-{Math.min(tablePage * rowsPerPage, filtered.length)} of {filtered.length} audiobooks
        </Typography>
        <Pagination count={totalTablePages} page={tablePage} onChange={(_, page) => setTablePage(page)} color="primary" shape="rounded" size="small" showFirstButton showLastButton />
      </Box>
    </Paper>
  );
}
