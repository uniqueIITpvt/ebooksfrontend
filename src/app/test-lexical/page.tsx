'use client';

import React, { useState } from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function TestLexicalPage() {
  const [content, setContent] = useState('<p>Welcome to the new <strong>Lexical Rich Text Editor</strong>!</p><p>This editor is <em>React 19 compatible</em> and provides a modern editing experience.</p>');
  const [excerpt, setExcerpt] = useState('<p>This is a sample <strong>excerpt</strong> for testing.</p>');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        🚀 Native Rich Text Editor Test
      </Typography>
      
      <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
        React 19 Compatible Rich Text Editor (ContentEditable-based)
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <RichTextEditor
          label="Blog Excerpt"
          value={excerpt}
          onChange={setExcerpt}
          placeholder="Enter a brief excerpt..."
          height={120}
          required
        />
        
        <RichTextEditor
          label="Blog Content"
          value={content}
          onChange={setContent}
          placeholder="Write your blog content here..."
          height={300}
          required
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => {
              setContent('');
              setExcerpt('');
            }}
          >
            Clear All
          </Button>
          
          <Button 
            variant="contained" 
            onClick={() => {
              const sampleContent = `
                <h2>Sample Blog Post</h2>
                <p>This is a <strong>sample blog post</strong> about <em>digital reading habits</em>.</p>
                
                <h3>Key Points:</h3>
                <ul>
                  <li>Regular exercise is essential</li>
                  <li>Maintain a balanced diet</li>
                  <li>Monitor blood pressure regularly</li>
                </ul>
                
                <blockquote>
                  Prevention is better than cure.
                </blockquote>
                
                <p>For more information, subscribe to our newsletter.</p>
              `;
              setContent(sampleContent);
              setExcerpt('<p>Learn about <strong>cardiovascular health</strong> and prevention strategies.</p>');
            }}
          >
            Load Sample
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preview Output
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Excerpt HTML:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {excerpt}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Content HTML:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem', maxHeight: '200px', overflow: 'auto' }}>
            {content}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Rendered Preview:
          </Typography>
          <Box 
            sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              '& h2, & h3': { color: 'primary.main', marginTop: 2, marginBottom: 1 },
              '& p': { marginBottom: 1, lineHeight: 1.6 },
              '& ul': { paddingLeft: 3 },
              '& blockquote': { 
                borderLeft: '4px solid #1976d2', 
                paddingLeft: 2, 
                margin: '16px 0',
                fontStyle: 'italic',
                backgroundColor: '#f5f5f5'
              }
            }}
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </Box>
      </Paper>
    </Container>
  );
}
