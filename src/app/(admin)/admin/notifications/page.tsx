'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Fade,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ShoppingCart as OrderIcon,
  Person as UserIcon,
  Payment as PaymentIcon,
  Book as BookIcon,
  Headphones as AudiobookIcon,
  CheckCircle as ReadIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkAllReadIcon,
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';

const API_URL = API_CONFIG.API_BASE_URL;

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'order' | 'user' | 'subscription' | 'payment' | 'system' | 'book' | 'audiobook';
  read: boolean;
  readAt: string | null;
  link: string | null;
  createdAt: string;
  metadata?: any;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order':
      return <OrderIcon color="primary" />;
    case 'user':
      return <UserIcon color="success" />;
    case 'payment':
      return <PaymentIcon color="warning" />;
    case 'book':
      return <BookIcon color="info" />;
    case 'audiobook':
      return <AudiobookIcon color="info" />;
    case 'subscription':
      return <PaymentIcon color="secondary" />;
    default:
      return <NotificationsIcon color="action" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'order':
      return 'primary';
    case 'user':
      return 'success';
    case 'payment':
      return 'warning';
    case 'book':
    case 'audiobook':
      return 'info';
    case 'subscription':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const token = tokenStore.getAccessToken();
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = tokenStore.getAccessToken();
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = tokenStore.getAccessToken();
      const res = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} min ago`;
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hours ago`;
    }
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} days ago`;
    }
    
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Notifications
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {unreadCount > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<MarkAllReadIcon />}
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </Button>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You&apos;ll see notifications here when new orders, users, or activities occur.
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification, index) => (
                <Fade key={notification._id} in timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                  <div>
                    <ListItem
                      sx={{
                        bgcolor: notification.read ? 'transparent' : 'action.hover',
                        borderRadius: 2,
                        mb: 1,
                        cursor: notification.link ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: notification.link ? 'action.selected' : undefined,
                        },
                      }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <ListItemIcon>
                        {getNotificationIcon(notification.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={notification.read ? 'normal' : 'bold'}
                            >
                              {notification.title}
                            </Typography>
                            <Chip
                              label={notification.type}
                              size="small"
                              color={getNotificationColor(notification.type) as any}
                              sx={{ textTransform: 'capitalize' }}
                            />
                            {!notification.read && (
                              <Chip
                                label="New"
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {formatDate(notification.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!notification.read && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            title="Mark as read"
                          >
                            <ReadIcon fontSize="small" color="success" />
                          </IconButton>
                        )}
                      </Box>
                    </ListItem>
                    {index < notifications.length - 1 && <Divider variant="inset" />}
                  </div>
                </Fade>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </AdminLayout>
  );
}
