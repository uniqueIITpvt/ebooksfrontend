'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  alpha,
} from '@mui/material';
import {
  MenuBook,
  Article,
  Visibility,
  Add,
} from '@mui/icons-material';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';
import { useRouter } from 'next/navigation';

import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

// Delay utility to prevent rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface DashboardStats {
  books: {
    total: number;
    published: number;
    draft: number;
    change: number;
    trending: 'up' | 'down' | 'neutral';
  };
  blogs: {
    total: number;
    published: number;
    draft: number;
    totalViews: number;
    change: number;
    trending: 'up' | 'down' | 'neutral';
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [siteLogo, setSiteLogo] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    books: { total: 0, published: 0, draft: 0, change: 0, trending: 'neutral' },
    blogs: { total: 0, published: 0, draft: 0, totalViews: 0, change: 0, trending: 'neutral' },
  });
  const [recentContent, setRecentContent] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/public`);
        const data = await response.json();
        setSiteLogo(String(data?.data?.site_logo || ''));
      } catch {
        setSiteLogo('');
      }
    };

    fetchLogo();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch stats sequentially with delays to prevent rate limiting
      const booksRes = await fetch(`${API_BASE_URL}/books/stats`).catch(() => null);
      const bookListRes = await fetch(`${API_BASE_URL}/books?limit=1000`).catch(() => null);
      await delay(300); // 300ms delay between requests
      
      const blogsRes = await fetch(`${API_BASE_URL}/blogs/stats`).catch(() => null);
      const blogListRes = await fetch(`${API_BASE_URL}/blogs?limit=100&adminView=true`).catch(() => null);

      const newStats: DashboardStats = {
        books: { total: 0, published: 0, draft: 0, change: 0, trending: 'neutral' },
        blogs: { total: 0, published: 0, draft: 0, totalViews: 0, change: 0, trending: 'neutral' },
      };

      // Process books stats
      if (booksRes?.ok) {
        const booksData = await booksRes.json();
        if (booksData.success) {
          const change = Math.random() * 10 - 5;
          newStats.books = {
            total: booksData.data.total || 0,
            published: booksData.data.published || 0,
            draft: booksData.data.draft || 0,
            change: Math.round(change * 10) / 10,
            trending: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
          };
        }
      }

      if (bookListRes?.ok) {
        const bookListData = await bookListRes.json();
        const dashboardBooks = Array.isArray(bookListData?.data) ? bookListData.data : [];

        if (bookListData?.success && dashboardBooks.length > 0) {
          newStats.books = {
            ...newStats.books,
            total: dashboardBooks.length,
            published: dashboardBooks.filter((book: any) => book.status === 'published').length,
            draft: dashboardBooks.filter((book: any) => book.status === 'draft').length,
          };
        }
      }

      // Process blogs stats
      if (blogsRes?.ok) {
        const blogsData = await blogsRes.json();
        if (blogsData.success) {
          const change = Math.random() * 10 - 5;
          const totalBlogs = blogsData.data.totalBlogs || blogsData.data.total || 0;
          const publishedBlogs = blogsData.data.published || totalBlogs;
          newStats.blogs = {
            total: totalBlogs,
            published: publishedBlogs,
            draft: blogsData.data.draft || 0,
            totalViews: blogsData.data.totalViews || blogsData.data.engagement?.totalViews || 0,
            change: Math.round(change * 10) / 10,
            trending: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
          };
        }
      }

      if (blogListRes?.ok) {
        const blogListData = await blogListRes.json();
        const dashboardBlogs = Array.isArray(blogListData?.data) ? blogListData.data : [];

        if (blogListData?.success && dashboardBlogs.length > 0) {
          newStats.blogs = {
            ...newStats.blogs,
            total: dashboardBlogs.length,
            published: dashboardBlogs.filter((blog: any) => blog.status === 'published' || blog.isPublished).length,
            draft: dashboardBlogs.filter((blog: any) => blog.status === 'draft' || blog.isPublished === false).length,
            totalViews: dashboardBlogs.reduce((sum: number, blog: any) => sum + Number(blog.views || 0), 0),
          };
        }
      }

      setStats(newStats);

      // Fetch recent content
      await fetchRecentContent();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentContent = async () => {
    try {
      await delay(300); // Delay before fetching recent content
      const blogsRes = await fetch(`${API_BASE_URL}/blogs?limit=3&sortBy=latest`).catch(() => null);

      const recent: any[] = [];

      if (blogsRes?.ok) {
        const blogsData = await blogsRes.json();
        if (blogsData.success && blogsData.data) {
          blogsData.data.forEach((blog: any) => {
            recent.push({
              type: 'Blog',
              title: blog.title,
              status: blog.status,
              views: blog.views || 0,
              date: new Date(blog.createdAt),
            });
          });
        }
      }

      // Sort by date and take top 5
      recent.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentContent(recent.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent content:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const totalViews = stats.blogs.totalViews;
  const brandBlue = '#0057b8';
  const brandCyan = '#00a6d6';
  const brandOrange = '#f58220';
  const totalContent = stats.books.total + stats.blogs.total;
  const publishedContent = stats.books.published + stats.blogs.published;
  const draftContent = stats.books.draft + stats.blogs.draft;
  const lineLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const lineValues = lineLabels.map((_, index) => {
    if (!totalViews) return 0;
    return Math.max(1, Math.round((totalViews / lineLabels.length) * (index + 1) * 0.55));
  });
  const chartCardSx = {
    height: '100%',
    borderRadius: 3,
    border: `1px solid ${alpha(brandBlue, 0.14)}`,
    boxShadow: '0 14px 36px rgba(15, 23, 42, 0.08)',
    background: 'linear-gradient(135deg, #ffffff, rgba(0,166,214,0.04), rgba(245,130,32,0.05))',
  };

  const statCards = [
    {
      title: 'Total Books',
      value: stats.books.total,
      helper: `${stats.books.published} published content items`,
      icon: MenuBook,
      color: brandBlue,
      bg: 'rgba(0,87,184,0.10)',
    },
    {
      title: 'Total Blogs',
      value: stats.blogs.total,
      helper: `${stats.blogs.published} published blog posts`,
      icon: Article,
      color: brandOrange,
      bg: 'rgba(245,130,32,0.12)',
    },
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      helper: 'Reader engagement across blogs',
      icon: Visibility,
      color: brandCyan,
      bg: 'rgba(0,166,214,0.12)',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
          p: 2.25,
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(brandBlue, 0.28),
          background:
            'linear-gradient(135deg, rgba(0,87,184,0.10), rgba(0,166,214,0.08), rgba(245,130,32,0.10))',
          boxShadow: '0 16px 42px rgba(15, 23, 42, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: '0 0 auto 0',
            height: 5,
            background: `linear-gradient(90deg, ${brandBlue}, ${brandCyan}, ${brandOrange})`,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0, position: 'relative' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" component="h1" fontWeight={900} gutterBottom sx={{ color: '#0f172a', mb: 0.4 }}>
              Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: '#52637a' }} noWrap>
              Welcome back, UniqueIIT Research Center
            </Typography>
          </Box>
        </Box>
        
        {/* Time Range Selector */}
        <FormControl size="small" sx={{ minWidth: 160, position: 'relative' }}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            displayEmpty
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              fontWeight: 700,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(brandBlue, 0.28),
              },
            }}
          >
            <MenuItem value="24h">Last 24 hours</MenuItem>
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Content Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: alpha(card.color, 0.18),
                  boxShadow: '0 14px 36px rgba(15, 23, 42, 0.08)',
                  background: `linear-gradient(135deg, #ffffff 0%, ${alpha(card.color, 0.05)} 100%)`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 5,
                    background: `linear-gradient(180deg, ${card.color}, ${brandCyan})`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', my: 0.6 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {card.helper}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: card.bg,
                        color: card.color,
                        width: 54,
                        height: 54,
                        boxShadow: `0 10px 28px ${alpha(card.color, 0.16)}`,
                      }}
                    >
                      <Icon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Dashboard Charts */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={4}>
          <Card sx={chartCardSx}>
            <CardContent>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', mb: 0.5 }}>
                Pie Graph
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                Content mix across books and blogs
              </Typography>
              <PieChart
                height={270}
                colors={[brandBlue, brandOrange, brandCyan]}
                series={[
                  {
                    innerRadius: 58,
                    outerRadius: 88,
                    paddingAngle: 3,
                    cx: 132,
                    cy: 105,
                    data: [
                      { id: 0, value: stats.books.total, label: 'Books' },
                      { id: 1, value: stats.blogs.total, label: 'Blogs' },
                    ],
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: 'row',
                    position: { vertical: 'bottom', horizontal: 'middle' },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={chartCardSx}>
            <CardContent>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', mb: 0.5 }}>
                Bar Graph
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                Published and draft content status
              </Typography>
              <BarChart
                height={240}
                colors={[brandBlue, brandOrange]}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: ['Books', 'Blogs', 'Total'],
                  },
                ]}
                series={[
                  {
                    label: 'Published',
                    data: [stats.books.published, stats.blogs.published, publishedContent],
                  },
                  {
                    label: 'Draft',
                    data: [stats.books.draft, stats.blogs.draft, draftContent],
                  },
                ]}
                borderRadius={8}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={chartCardSx}>
            <CardContent>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', mb: 0.5 }}>
                Line Graph
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                Reader engagement trend from current blog views
              </Typography>
              <LineChart
                height={240}
                colors={[brandCyan]}
                xAxis={[
                  {
                    scaleType: 'point',
                    data: lineLabels,
                  },
                ]}
                series={[
                  {
                    label: 'Views',
                    data: lineValues,
                    area: true,
                    curve: 'monotoneX',
                  },
                ]}
                sx={{
                  '& .MuiAreaElement-root': {
                    fill: 'url(#dashboardLineGradient)',
                  },
                }}
              >
                <defs>
                  <linearGradient id="dashboardLineGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={brandCyan} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={brandCyan} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
              </LineChart>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Content Breakdown */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(brandBlue, 0.14)}`,
              boxShadow: '0 14px 36px rgba(15, 23, 42, 0.08)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,1), rgba(0,166,214,0.04), rgba(245,130,32,0.05))',
            }}
          >
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom fontWeight={900} sx={{ color: '#0f172a' }}>
                Content Status Breakdown
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Books</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {stats.books.published} Published / {stats.books.draft} Draft
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.books.published / (stats.books.total || 1)) * 100} 
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      bgcolor: alpha(brandBlue, 0.10),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${brandBlue}, ${brandCyan})`,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Blogs</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {stats.blogs.published} Published / {stats.blogs.draft} Draft
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.blogs.published / (stats.blogs.total || 1)) * 100} 
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      bgcolor: alpha(brandOrange, 0.12),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${brandOrange}, ${brandCyan})`,
                      },
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(brandOrange, 0.18)}`,
              boxShadow: '0 14px 36px rgba(15, 23, 42, 0.08)',
              background: `linear-gradient(135deg, ${alpha(brandBlue, 0.08)}, ${alpha(brandCyan, 0.08)}, ${alpha(brandOrange, 0.10)})`,
            }}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a' }}>
                Catalog Snapshot
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white', border: `1px solid ${alpha(brandBlue, 0.12)}` }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>
                    Published
                  </Typography>
                  <Typography variant="h5" fontWeight={900}>
                    {stats.books.published + stats.blogs.published}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white', border: `1px solid ${alpha(brandOrange, 0.16)}` }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>
                    Drafts
                  </Typography>
                  <Typography variant="h5" fontWeight={900}>
                    {stats.books.draft + stats.blogs.draft}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: '#52637a' }}>
                A quick brand-side view of {totalContent} total content items across books and blogs.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Content */}
      <Card sx={{ mb: 3, borderRadius: 3, border: `1px solid ${alpha(brandBlue, 0.14)}`, boxShadow: '0 14px 36px rgba(15, 23, 42, 0.08)' }}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom fontWeight={900} sx={{ color: '#0f172a' }}>
            Recent Content
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 800,
                      color: '#0f172a',
                      background:
                        'linear-gradient(135deg, rgba(0,87,184,0.12), rgba(0,166,214,0.10), rgba(245,130,32,0.10))',
                      borderBottom: `1px solid ${alpha(brandBlue, 0.22)}`,
                    },
                  }}
                >
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Views</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentContent.length > 0 ? (
                  recentContent.map((content, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip 
                          label={content.type} 
                          size="small" 
                          color={content.type === 'Blog' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{content.title}</TableCell>
                      <TableCell>
                        <Chip 
                          label={content.status} 
                          size="small" 
                          variant="outlined"
                          color={content.status === 'published' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{content.views.toLocaleString()}</TableCell>
                      <TableCell>{content.date.toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No recent content available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card sx={{ borderRadius: 3, border: `1px solid ${alpha(brandOrange, 0.18)}`, boxShadow: '0 14px 36px rgba(15, 23, 42, 0.08)' }}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom fontWeight={900} sx={{ color: '#0f172a' }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="Add New Blog" 
              icon={<Add />}
              sx={{ bgcolor: brandBlue, color: 'white', fontWeight: 800, '& .MuiChip-icon': { color: 'white' } }}
              clickable 
              onClick={() => router.push('/admin/blogs/add')}
            />
            <Chip 
              label="Add Book" 
              sx={{ bgcolor: alpha(brandCyan, 0.12), color: brandBlue, fontWeight: 800 }}
              clickable 
              onClick={() => router.push('/admin/books')}
            />
            <Chip 
              label="View Blogs" 
              sx={{ bgcolor: alpha(brandOrange, 0.14), color: '#9a4b00', fontWeight: 800 }}
              clickable 
              onClick={() => router.push('/admin/blogs')}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
