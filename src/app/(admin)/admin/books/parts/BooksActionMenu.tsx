import React from 'react';
import { Divider, Menu, MenuItem } from '@mui/material';
import { Archive, Delete, Edit, Star, Visibility } from '@mui/icons-material';

type BooksActionMenuProps = {
  [key: string]: any;
  books: any[];
};

export default function BooksActionMenu(props: BooksActionMenuProps) {
  const {
  anchorEl,
  handleMenuClose,
  handleDialogOpen,
  books,
  menuBookId,
  toggleFeatured,
  handleArchiveBook,
  handleDeleteBook
  } = props;

  return (
    <>
      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('view', books.find(b => (b as any)._id === menuBookId || b.id === menuBookId))}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('edit', books.find(b => (b as any)._id === menuBookId || b.id === menuBookId))}>
          <Edit sx={{ mr: 1 }} />
          Edit Book
        </MenuItem>
        <MenuItem onClick={() => toggleFeatured(menuBookId!)}>
          <Star sx={{ mr: 1 }} />
          Toggle Featured
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleArchiveBook(menuBookId!)} sx={{ color: 'warning.main' }}>
          <Archive sx={{ mr: 1 }} />
          {books.find(b => (b as any)._id === menuBookId || b.id === menuBookId)?.status === 'archived' ? 'Unarchive Book' : 'Archive Book'}
        </MenuItem>
        <MenuItem onClick={() => handleDeleteBook(menuBookId!)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Book
        </MenuItem>
      </Menu>


    </>
  );
}
