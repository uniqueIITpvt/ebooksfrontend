'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InputBase,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Paper,
  alpha,
} from '@mui/material';
import {
  Dashboard,
  MenuBook,
  Article,
  People,
  Settings,
  Menu as MenuIcon,
  Search,
  Notifications,
  LightMode,
  DarkMode,
  Logout,
  AccountCircle,
  AutoStories,
  TrendingUp,
  Stars,
  Headphones,
  Campaign,
  ShoppingBag,
  CreditCard,
  CardMembership,
  LocationOn,
  Quiz,
  ContactMail,
  ViewList,
} from '@mui/icons-material';
import { useThemeMode } from './MuiThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Dashboard },
  { name: 'Books', href: '/admin/books', icon: MenuBook },
  { name: 'Audiobooks', href: '/admin/audiobooks', icon: Headphones },
  { name: 'Blogs', href: '/admin/blogs', icon: Article },
  { name: 'Banners', href: '/admin/banners', icon: Campaign },
  { name: 'Book Formats', href: '/admin/formats', icon: ViewList },
  { name: 'FAQ', href: '/admin/faq', icon: Quiz },
  { name: 'Contact', href: '/admin/contact', icon: ContactMail },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CardMembership },
  { name: 'Addresses', href: '/admin/addresses', icon: LocationOn },
  { name: 'Users', href: '/admin/users', icon: People },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const superAdminOnlyPaths = ['/admin/users', '/admin/settings'];

const drawerWidth = 280;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { darkMode, toggleDarkMode } = useThemeMode();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const isSuperAdminOnlyRoute = superAdminOnlyPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const visibleNavigation = isSuperAdmin
    ? navigation
    : navigation.filter((item) => !superAdminOnlyPaths.includes(item.href));

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = tokenStore.getAccessToken();
        const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';

        if (!token || !isAdminUser) {
          setNotifications([]);
          setNotificationCount(0);
          return;
        }

        const res = await fetch(`${API_CONFIG.API_BASE_URL}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.status === 401) {
          setNotifications([]);
          setNotificationCount(0);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.data) {
            // Filter unread notifications
            const unreadNotifications = data.data.filter((n: any) => !n.read);
            setNotifications(unreadNotifications);
            setNotificationCount(unreadNotifications.length);
          }
        }
      } catch {
        // Notifications endpoint unavailable — non-critical, fail silently
      }
    };

    fetchNotifications();
    // Refresh notifications every 60 seconds (reduced polling)
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.role]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(`${API_CONFIG.API_BASE_URL}/settings/public`);
        const data = await res.json();
        if (data?.success && data?.data?.site_logo) {
          setSiteLogo(String(data.data.site_logo));
          return;
        }

        const valueRes = await fetch(
          `${API_CONFIG.API_BASE_URL}/settings/value/site_logo`
        );
        const valueData = await valueRes.json();
        if (valueData?.success && valueData?.value) {
          setSiteLogo(String(valueData.value));
        } else {
          setSiteLogo('');
        }
      } catch (err) {
        setSiteLogo('');
      }
    };

    fetchLogo();
  }, []);

  useEffect(() => {
    if (!user || isSuperAdmin) return;

    if (isSuperAdminOnlyRoute) {
      router.replace('/admin/dashboard');
    }
  }, [isSuperAdmin, isSuperAdminOnlyRoute, router, user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  const handleProfile = () => {
    handleProfileMenuClose();
    router.push('/admin/profile');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#374151' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: 'transparent',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <Image
              src={siteLogo || '/file.svg'}
              alt='TechUniqueIIT Research Center'
              fill
              sizes='60px'
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#F9FAFB' }}>
            TechUniqueIIT
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: '#4B5563' }} />
      <List sx={{ flexGrow: 1 }}>
        {visibleNavigation.map((item) => {
          const isActive = (() => {
            return pathname === item.href;
          })();
          const IconComponent = item.icon;
          return (
            <ListItem key={item.name} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  color: '#F9FAFB',
                  '&:hover': {
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    '&:hover': {
                      backgroundColor: '#FDE68A',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 40,
                  }}
                >
                  <IconComponent />
                </ListItemIcon>
                <ListItemText primary={item.name} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ borderColor: '#4B5563' }} />
      <Box sx={{ p: 2, backgroundColor: '#374151' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={user?.avatar || undefined}
            alt={user?.name || 'Admin User'}
            sx={{ width: 32, height: 32, mr: 1, backgroundColor: '#4B5563' }}
          >
            <AccountCircle sx={{ color: '#F9FAFB' }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ color: '#F9FAFB' }}>
              {user?.name || 'Admin User'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
              {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // Skip protection for login page
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute requireAdmin>
      {!isSuperAdmin && isSuperAdminOnlyRoute ? (
        <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">Redirecting...</Typography>
        </Box>
      ) : (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', lg: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, lg: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 1,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Search Bar */}
          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: { xs: 200, sm: 400 },
              backgroundColor: alpha(theme.palette.common.white, 0.15),
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.white, 0.25),
              },
            }}
          >
            <IconButton sx={{ p: '10px' }} aria-label="search">
              <Search />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </Paper>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>

            <IconButton color="inherit" onClick={() => router.push('/admin/notifications')}>
              <Badge badgeContent={notificationCount} color="error" max={99}>
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                src={user?.avatar || undefined}
                alt={user?.name || 'Admin User'}
                sx={{ width: 32, height: 32 }}
              >
                <AccountCircle />
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleProfile}>
                <AccountCircle sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/admin/settings'); }}>
                <Settings sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#374151',
              borderRight: '1px solid #4B5563',
              zIndex: theme.zIndex.modal,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#374151',
              borderRight: '1px solid #4B5563',
              zIndex: theme.zIndex.drawer,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3 },
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          mt: '64px', // AppBar height
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default,
        }}
      >
        {children}
      </Box>
      </Box>
      )}
    </ProtectedRoute>
  );
}
