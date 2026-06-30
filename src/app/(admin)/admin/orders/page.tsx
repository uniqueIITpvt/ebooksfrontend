'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Refresh,
  Visibility,
  Delete,
  ShoppingCart,
  FlashOn,
  Close as CloseIcon
} from '@mui/icons-material';
import { API_CONFIG } from '@/config/api';

const API_URL = API_CONFIG.API_BASE_URL;

interface Order {
  _id: string;
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  totalAmount: number;
  type: 'cart' | 'buy_now';
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/orders/all`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setSnackbar({ open: true, message: 'Failed to fetch orders', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      const response = await fetch(`${API_URL}/orders/${orderToDelete}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setSnackbar({ open: true, message: 'Order deleted successfully', severity: 'success' });
        fetchOrders(); // Refresh list
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to delete order', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      setSnackbar({ open: true, message: 'Error deleting order', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, sm: 0 } }}>
        <Typography variant="h4" fontWeight="bold">
          Book Purchases & Store Actions
        </Typography>
        <IconButton onClick={fetchOrders} color="primary" sx={{ bgcolor: 'white', shadow: 1 }}>
          <Refresh />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Book Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="textSecondary">No orders found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{order.title}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={order.type === 'cart' ? <ShoppingCart sx={{ fontSize: '14px !important' }} /> : <FlashOn sx={{ fontSize: '14px !important' }} />}
                        label={order.type === 'cart' ? 'Saved to Cart' : 'Direct Purchase'} 
                        size="small"
                        color={order.type === 'cart' ? 'primary' : 'secondary'}
                        variant="outlined"
                        sx={{ fontWeight: 'bold', fontSize: '10px' }}
                      />
                    </TableCell>
                    <TableCell>
                      {order.customerName}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {order.customerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{order.quantity || 0}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                      ₹{(order.totalAmount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" color="info" onClick={() => handleViewOrder(order)}>
                          <Visibility sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(order._id)}>
                          <Delete sx={{ fontSize: 18 }} />
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

      {/* View Detail Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Order Details
          <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Customer Name</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedOrder.customerName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Customer Email</Typography>
                <Typography variant="body1">{selectedOrder.customerEmail}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Item</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedOrder.title}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Price</Typography>
                <Typography variant="body1">₹{(selectedOrder.price || 0).toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Quantity</Typography>
                <Typography variant="body1">{selectedOrder.quantity || 0}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                <Typography variant="body1" color="primary" fontWeight="bold">₹{(selectedOrder.totalAmount || 0).toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Purchase Type</Typography>
                <Typography variant="body1">{selectedOrder.type === 'cart' ? 'Added from Cart' : 'Buy Now / Direct'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Order Date</Typography>
                <Typography variant="body1">{new Date(selectedOrder.createdAt).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this order? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Feedback */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
