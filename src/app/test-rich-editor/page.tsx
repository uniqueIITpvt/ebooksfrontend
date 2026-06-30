'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Button
} from '@mui/material';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { stripHtmlTags, getWordCount, calculateReadTime, validateHtmlContent, generateExcerpt } from '@/utils/htmlUtils';

export default function TestRichEditorPage() {
  const [content, setContent] = useState(`
    <h2>Welcome to the Rich Text Editor</h2>
    <p>This is a <strong>comprehensive rich text editor</strong> built with <em>React Quill</em> for Dr. Syed M Quadri's blog management system.</p>
    
    <h3>Features Include:</h3>
    <ul>
      <li>Rich text formatting (bold, italic, underline)</li>
      <li>Headers and font sizes</li>
      <li>Lists and indentation</li>
      <li>Links and media embedding</li>
      <li>Code blocks and quotes</li>
    </ul>
    
    <blockquote>
      "The best way to take care of the future is to take care of the present moment." - Thich Nhat Hanh
    </blockquote>
    
    <p>Try editing this content to test all the features!</p>
  `);
  
  const [excerpt, setExcerpt] = useState(`
    <p>This is a <strong>sample excerpt</strong> that demonstrates the rich text editor capabilities for blog excerpts.</p>
  `);

  // Real-time statistics
  const contentStats = {
    wordCount: getWordCount(content),
    readTime: calculateReadTime(content),
    plainText: stripHtmlTags(content),
    validation: validateHtmlContent(content, 50, 50000),
    autoExcerpt: generateExcerpt(content, 150)
  };

  const excerptStats = {
    wordCount: getWordCount(excerpt),
    plainText: stripHtmlTags(excerpt),
    validation: validateHtmlContent(excerpt, 10, 500)
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom align="center">
        🎨 Rich Text Editor Test Suite
      </Typography>
      
      <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
        Testing the blog content management system with rich text editing capabilities
      </Typography>

      <Grid container spacing={3}>
        {/* Editor Section */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              📝 Content Editors
            </Typography>
            
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
        </Grid>

        {/* Statistics Section */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Content Statistics
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Content Metrics</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip label={`${contentStats.wordCount} words`} size="small" color="primary" />
                  <Chip label={contentStats.readTime} size="small" color="secondary" />
                  <Chip 
                    label={contentStats.validation.isValid ? 'Valid ✓' : 'Invalid ✗'} 
                    size="small" 
                    color={contentStats.validation.isValid ? 'success' : 'error'} 
                  />
                </Box>
                {!contentStats.validation.isValid && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {contentStats.validation.message}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Excerpt Metrics</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip label={`${excerptStats.wordCount} words`} size="small" color="primary" />
                  <Chip 
                    label={excerptStats.validation.isValid ? 'Valid ✓' : 'Invalid ✗'} 
                    size="small" 
                    color={excerptStats.validation.isValid ? 'success' : 'error'} 
                  />
                </Box>
                {!excerptStats.validation.isValid && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {excerptStats.validation.message}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Button 
              variant="outlined" 
              fullWidth 
              onClick={() => {
                setContent('');
                setExcerpt('');
              }}
              sx={{ mb: 2 }}
            >
              Clear All Content
            </Button>

            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => {
                const sampleContent = `
                  <h2>Sample Blog Post</h2>
                  <p>This is a <strong>sample blog post</strong> about <em>reading habits</em>.</p>
                  
                  <h3>Key Points:</h3>
                  <ul>
                    <li>Regular exercise is essential</li>
                    <li>Maintain a balanced diet</li>
                    <li>Monitor blood pressure regularly</li>
                  </ul>
                  
                  <blockquote>
                    "Prevention is better than cure."
                  </blockquote>
                `;
                setContent(sampleContent);
                setExcerpt('<p>Learn about <strong>cardiovascular health</strong> and prevention strategies.</p>');
              }}
            >
              Load Sample Content
            </Button>
          </Paper>
        </Grid>

        {/* Preview Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              👁️ Content Preview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Excerpt Preview
                    </Typography>
                    <Box 
                      dangerouslySetInnerHTML={{ __html: excerpt }} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        minHeight: '60px',
                        '& p': { margin: 0 },
                        '& strong': { fontWeight: 'bold' },
                        '& em': { fontStyle: 'italic' }
                      }}
                    />
                    
                    <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                      Plain text: {excerptStats.plainText.substring(0, 100)}...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Auto-Generated Excerpt
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        minHeight: '60px'
                      }}
                    >
                      <Typography variant="body2">
                        {contentStats.autoExcerpt}
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                      Generated from content (150 chars max)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Full Content Preview
                    </Typography>
                    <Box 
                      dangerouslySetInnerHTML={{ __html: content }} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        minHeight: '200px',
                        '& h2, & h3': { color: 'primary.main', marginTop: 2, marginBottom: 1 },
                        '& p': { marginBottom: 1, lineHeight: 1.6 },
                        '& ul, & ol': { paddingLeft: 3 },
                        '& blockquote': { 
                          borderLeft: '4px solid #1976d2', 
                          paddingLeft: 2, 
                          margin: '16px 0',
                          fontStyle: 'italic',
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
