'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
} from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  trending?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'red' | 'pink' | 'emerald';
}

const colorMapping = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  red: '#EF4444',
  pink: '#EC4899',
  emerald: '#059669',
};

export default function StatsCard({ 
  title, 
  value, 
  change, 
  trending = 'neutral', 
  icon: IconComponent, 
  color 
}: StatsCardProps) {
  const theme = useTheme();
  const iconColor = colorMapping[color];

  const getTrendingIcon = () => {
    switch (trending) {
      case 'up':
        return <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />;
      case 'down':
        return <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />;
      default:
        return <Remove sx={{ fontSize: 16, color: theme.palette.text.secondary }} />;
    }
  };

  const getTrendingColor = () => {
    switch (trending) {
      case 'up':
        return theme.palette.success.main;
      case 'down':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              {value}
            </Typography>
            
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {getTrendingIcon()}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 0.5, 
                    fontWeight: 500,
                    color: getTrendingColor()
                  }}
                >
                  {change > 0 ? '+' : ''}{change}%
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ ml: 0.5 }}
                >
                  vs last period
                </Typography>
              </Box>
            )}
          </Box>
          
          <Avatar
            sx={{
              bgcolor: iconColor + '20',
              color: iconColor,
              width: 56,
              height: 56,
            }}
          >
            <IconComponent />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}
