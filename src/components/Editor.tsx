import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, indentWithTab, history } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { FileType } from '../types';
import { Copy, Settings, Sparkles } from 'lucide-react';
import { SnippetsModal } from './SnippetsModal';
import AIAssistant from './AIAssistant';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language: FileType;
  fileName?: string; // Add fileName prop for custom file type detection
  onOpenInspector?: () => void;
  showInspectorButton?: boolean;
  rideyEnabled?: boolean; // Whether the AI assistant is enabled
}

const Editor: React.FC<EditorProps> = ({ value, onChange, language, fileName, onOpenInspector, showInspectorButton, rideyEnabled = false }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView>();
  const [copied, setCopied] = useState(false);
  const [showSnippetsModal, setShowSnippetsModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Debug logging
  console.log('Editor props:', { value: value?.substring(0, 100), language, valueLength: value?.length });

  useEffect(() => {
    if (!editorRef.current) return;
    
    console.log('Creating new editor with value:', value?.substring(0, 100));
    
    const getLanguage = () => {
      switch(language) {
        case FileType.HTML: return html();
        case FileType.CSS: return css();
        case FileType.JS: return javascript();
        case FileType.CUSTOM: 
          // For custom files, determine language based on file extension
          if (fileName) {
            const extension = fileName.split('.').pop()?.toLowerCase();
            switch(extension) {
              case 'json': return javascript(); // JSON uses JS highlighting
              case 'xml': return html(); // XML uses HTML highlighting
              case 'txt': return javascript(); // Plain text
              case 'md': return javascript(); // Markdown
              case 'yml':
              case 'yaml': return javascript(); // YAML
              case 'csv': return javascript(); // CSV
              default: return javascript(); // Default to JavaScript for unknown extensions
            }
          }
          return javascript(); // Default to JavaScript if no fileName
        default: return html();
      }
    };

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    });

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        getLanguage(),
        history(),
        keymap.of([
          ...defaultKeymap,
          indentWithTab
        ]),
        oneDark,
        EditorView.lineWrapping,
        updateListener,
        EditorState.tabSize.of(2),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [language]); // Only re-create editor when language changes

  useEffect(() => {
    if (editorViewRef.current) {
      const currentValue = editorViewRef.current.state.doc.toString();
      
      console.log('Editor value update:', {
        newValue: value?.substring(0, 100),
        currentValue: currentValue?.substring(0, 100),
        valuesMatch: currentValue === value
      });
      
      if (currentValue !== value) {
        const transaction = editorViewRef.current.state.update({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: value || ''
          }
        });
        editorViewRef.current.dispatch(transaction);
      }
    }
  }, [value]);

  const handleCopy = async () => {
    if (!editorViewRef.current) return;
    
    try {
      await navigator.clipboard.writeText(editorViewRef.current.state.doc.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInsertSnippet = (code: string) => {
    if (!editorViewRef.current) return;
    
    const view = editorViewRef.current;
    const selection = view.state.selection;
    
    // Get the cursor position (or selection range)
    const from = selection.main.from;
    const to = selection.main.to;
    
    // Create a transaction to insert the code at the cursor position
    const transaction = view.state.update({
      changes: {
        from: from,
        to: to,
        insert: code
      },
      selection: { anchor: from + code.length, head: from + code.length }
    });
    
    view.dispatch(transaction);
    
    // Close the snippets modal after inserting
    setShowSnippetsModal(false);
  };

  const handleApplyAISuggestion = (suggestion: string) => {
    // If the suggestion looks like a complete file replacement, warn the user
    if (suggestion.includes('<!DOCTYPE') || suggestion.includes('<html') || suggestion.includes('<!doctype')) {
      const confirmReplace = window.confirm(
        'This appears to be a complete file replacement. This will replace your entire code. Are you sure you want to continue?'
      );
      if (!confirmReplace) {
        return;
      }
      onChange(suggestion);
      return;
    }

    // For targeted suggestions, insert at cursor position like Snippets
    if (!editorViewRef.current) return;
    
    const view = editorViewRef.current;
    const selection = view.state.selection;
    
    // Get the cursor position (or selection range)
    const from = selection.main.from;
    const to = selection.main.to;
    
    // Create a transaction to insert the code at the cursor position
    const transaction = view.state.update({
      changes: {
        from: from,
        to: to,
        insert: suggestion
      },
      selection: { anchor: from + suggestion.length }
    });
    
    view.dispatch(transaction);
  };


  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
            title="Copy code"
          >
            <Copy size={12} />
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <button
            className="px-2 py-1 text-xs bg-blue-700 rounded hover:bg-blue-600 text-white"
            onClick={() => setShowSnippetsModal(true)}
          >
            Snippets
          </button>
          {rideyEnabled && (
            <button
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-purple-700 rounded hover:bg-purple-600 text-white"
              onClick={() => setShowAIAssistant(true)}
              title="Ridey · AI Code Assistant"
            >
              <Sparkles size={12} />
              <span>Ask Ridey</span>
            </button>
          )}
          {showInspectorButton && onOpenInspector && (
            <button
              onClick={onOpenInspector}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-500 rounded text-white"
              title="Open A-Frame Inspector"
            >
              <Settings size={12} />
              <span>Inspector</span>
            </button>
          )}
        </div>
        <div className="text-xs text-gray-400">
          Ctrl+Z/Cmd+Z: Undo • Ctrl+Y/Cmd+Y: Redo
        </div>
      </div>
      
      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-hidden" />
      <SnippetsModal 
        open={showSnippetsModal} 
        onClose={() => setShowSnippetsModal(false)} 
        onInsert={handleInsertSnippet}
      />
      {rideyEnabled && (
        <AIAssistant
          open={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          code={value}
          language={language}
          fileName={fileName}
          onApplySuggestion={handleApplyAISuggestion}
        />
      )}
    </div>
  );
};

export default Editor;