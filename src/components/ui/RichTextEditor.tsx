'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, FormHelperText, Paper, IconButton, Divider } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Undo,
  Redo,
  Link as LinkIcon,
  FormatClear,
  Code,
  Title,
  ContentPaste
} from '@mui/icons-material';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  height?: number;
  required?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  placeholder,
  height = 200,
  required = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isToolbarActive, setIsToolbarActive] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  // Handle formatting commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateToolbarState();
    handleInput();
  };

  // Handle heading insertion
  const insertHeading = (level: number) => {
    execCommand('formatBlock', `h${level}`);
  };

  // Handle link insertion
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Handle paste with formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    
    // Clean up the pasted content
    const cleanedText = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ''); // Remove styles
    
    document.execCommand('insertHTML', false, cleanedText);
    handleInput();
  };

  // Clear formatting
  const clearFormatting = () => {
    execCommand('removeFormat');
  };

  // Update toolbar state based on current selection
  const updateToolbarState = () => {
    setIsToolbarActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  };

  // Handle selection change
  const handleSelectionChange = () => {
    updateToolbarState();
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1, 
          fontWeight: 500,
          color: error ? 'error.main' : 'text.primary'
        }}
      >
        {label} {required && <span style={{ color: '#f44336' }}>*</span>}
      </Typography>
      
      <Paper 
        variant="outlined" 
        sx={{ 
          border: error ? '1px solid #f44336' : '1px solid #e0e0e0',
          '&:hover': {
            borderColor: error ? '#f44336' : '#1976d2'
          }
        }}
      >
        {/* Toolbar */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5, 
          p: 1, 
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
          flexWrap: 'wrap'
        }}>
          {/* Text Formatting */}
          <IconButton
            size="small"
            onClick={() => execCommand('bold')}
            sx={{ color: isToolbarActive.bold ? 'primary.main' : 'text.secondary' }}
            title="Bold (Ctrl+B)"
          >
            <FormatBold fontSize="small" />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => execCommand('italic')}
            sx={{ color: isToolbarActive.italic ? 'primary.main' : 'text.secondary' }}
            title="Italic (Ctrl+I)"
          >
            <FormatItalic fontSize="small" />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => execCommand('underline')}
            sx={{ color: isToolbarActive.underline ? 'primary.main' : 'text.secondary' }}
            title="Underline (Ctrl+U)"
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Headings */}
          <IconButton
            size="small"
            onClick={() => insertHeading(2)}
            title="Heading 2"
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>H2</Typography>
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => insertHeading(3)}
            title="Heading 3"
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>H3</Typography>
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Lists & Quotes */}
          <IconButton
            size="small"
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => execCommand('formatBlock', 'blockquote')}
            title="Quote"
          >
            <FormatQuote fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Links & Code */}
          <IconButton
            size="small"
            onClick={insertLink}
            title="Insert Link"
          >
            <LinkIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => execCommand('formatBlock', 'pre')}
            title="Code Block"
          >
            <Code fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Clear Formatting */}
          <IconButton
            size="small"
            onClick={clearFormatting}
            title="Clear Formatting"
          >
            <FormatClear fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Undo/Redo */}
          <IconButton
            size="small"
            onClick={() => execCommand('undo')}
            title="Undo (Ctrl+Z)"
          >
            <Undo fontSize="small" />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => execCommand('redo')}
            title="Redo (Ctrl+Y)"
          >
            <Redo fontSize="small" />
          </IconButton>
        </Box>

        {/* Editor */}
        <Box sx={{ position: 'relative' }}>
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            onMouseUp={updateToolbarState}
            onKeyUp={updateToolbarState}
            style={{
              minHeight: `${height}px`,
              padding: '12px',
              outline: 'none',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'Roboto, sans-serif',
            }}
            suppressContentEditableWarning={true}
          />
          
          {(!value || value === '') && (
            <Box
              sx={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                color: '#9e9e9e',
                fontSize: '14px',
                pointerEvents: 'none',
              }}
            >
              {placeholder || `Enter ${label.toLowerCase()}...`}
            </Box>
          )}
        </Box>
      </Paper>
      
      {helperText && (
        <FormHelperText error={error} sx={{ mt: 1, ml: 0 }}>
          {helperText}
        </FormHelperText>
      )}

      <style jsx global>{`
        div[contenteditable] p {
          margin: 0 0 8px 0;
          line-height: 1.6;
        }
        div[contenteditable] blockquote {
          margin: 16px 0;
          padding: 12px 16px;
          border-left: 4px solid #1976d2;
          background-color: #f5f5f5;
          font-style: italic;
          color: #555;
        }
        div[contenteditable] h1 {
          font-size: 2rem;
          font-weight: 600;
          margin: 20px 0 12px 0;
          color: #1976d2;
          line-height: 1.2;
        }
        div[contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 18px 0 10px 0;
          color: #1976d2;
          line-height: 1.3;
        }
        div[contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 16px 0 8px 0;
          color: #1976d2;
          line-height: 1.4;
        }
        div[contenteditable] ul,
        div[contenteditable] ol {
          margin: 12px 0;
          padding-left: 28px;
        }
        div[contenteditable] li {
          margin: 6px 0;
          line-height: 1.6;
        }
        div[contenteditable] strong {
          font-weight: bold;
          color: #000;
        }
        div[contenteditable] em {
          font-style: italic;
        }
        div[contenteditable] u {
          text-decoration: underline;
        }
        div[contenteditable] a {
          color: #1976d2;
          text-decoration: underline;
          cursor: pointer;
        }
        div[contenteditable] a:hover {
          color: #1565c0;
        }
        div[contenteditable] pre {
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 12px;
          margin: 12px 0;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
        }
        div[contenteditable] code {
          background-color: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        div[contenteditable] hr {
          border: none;
          border-top: 2px solid #e0e0e0;
          margin: 20px 0;
        }
      `}</style>
    </Box>
  );
};

export default RichTextEditor;
