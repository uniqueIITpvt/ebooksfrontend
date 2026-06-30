'use client';

import React, { useState } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function TestEditorPage() {
  const [content, setContent] = useState('<p>Start typing your content here...</p>');
  const [excerpt, setExcerpt] = useState('');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Rich Text Editor Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <RichTextEditor
          label="Blog Excerpt"
          value={excerpt}
          onChange={setExcerpt}
          placeholder="Enter a brief excerpt..."
          height={150}
          required
        />
        
        <RichTextEditor
          label="Blog Content"
          value={content}
          onChange={setContent}
          placeholder="Write your blog content here..."
          height={400}
          required
        />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preview - Excerpt:
        </Typography>
        <Box 
          dangerouslySetInnerHTML={{ __html: excerpt }} 
          sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
        />
        
        <Typography variant="h6" gutterBottom>
          Preview - Content:
        </Typography>
        <Box 
          dangerouslySetInnerHTML={{ __html: content }} 
          sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
        />
      </Paper>
    </Container>
  );
}
