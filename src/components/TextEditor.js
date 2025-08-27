import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef
} from 'react';

/**
 * Enhanced TextEditor component with undo/redo, find/replace, and spell check support
 * Designed to replace all textareas in the application for consistent editing experience
 */
const TextEditor = forwardRef(
  (
    {
      value = '',
      onChange,
      placeholder = '',
      className = '',
      style = {},
      rows = 4,
      disabled = false,
      spellCheck = true,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef(null);
    const [history, setHistory] = useState([{ content: value, cursor: 0 }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [matchCase, setMatchCase] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const [matches, setMatches] = useState([]);
    const composing = useRef(false);

    // Reset history to current state (call this after save)
    const resetHistory = useCallback(() => {
      const currentContent = textareaRef.current?.value || value;
      const currentCursor = textareaRef.current?.selectionStart || 0;
      const newHistoryEntry = {
        content: currentContent,
        cursor: currentCursor
      };
      setHistory([newHistoryEntry]);
      setHistoryIndex(0);
    }, [value]);

    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      select: () => textareaRef.current?.select(),
      setSelectionRange: (start, end) =>
        textareaRef.current?.setSelectionRange(start, end),
      get selectionStart() {
        return textareaRef.current?.selectionStart || 0;
      },
      get selectionEnd() {
        return textareaRef.current?.selectionEnd || 0;
      },
      get value() {
        return textareaRef.current?.value || '';
      },
      undo: () => handleUndo(),
      redo: () => handleRedo(),
      showFindReplace: () => setShowFindReplace(true),
      hideFindReplace: () => setShowFindReplace(false),
      resetHistory: () => resetHistory()
    }));

    // Initialize history only when first loading or when value changes externally without user input
    useEffect(() => {
      // Only initialize if history is empty (first load)
      if (history.length === 0) {
        const newHistoryEntry = {
          content: value,
          cursor: textareaRef.current?.selectionStart || 0
        };
        setHistory([newHistoryEntry]);
        setHistoryIndex(0);
      }
    }, [value, history]);

    // Handle text changes
    const handleChange = useCallback(
      e => {
        const newValue = e.target.value;
        const cursor = e.target.selectionStart;

        // Don't save to history during composition (IME input)
        if (!composing.current) {
          // Save the NEW state to history (this will be what we can undo TO)
          if (newValue !== history[historyIndex]?.content) {
            const newEntry = { content: newValue, cursor };

            // Remove any future history if we're not at the end
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newEntry);

            // Limit history size to prevent memory issues
            if (newHistory.length > 100) {
              newHistory.shift();
            } else {
              setHistoryIndex(prev => prev + 1);
            }

            setHistory(newHistory);
          }
        }

        if (onChange) {
          onChange(e);
        }
      },
      [onChange, history, historyIndex]
    );

    // Undo functionality
    const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const historyEntry = history[newIndex];

        setHistoryIndex(newIndex);

        if (onChange) {
          const syntheticEvent = {
            target: { value: historyEntry.content },
            type: 'change'
          };
          onChange(syntheticEvent);
        }

        // Restore cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(
              historyEntry.cursor,
              historyEntry.cursor
            );
          }
        }, 0);
      }
    }, [historyIndex, history, onChange]);

    // Redo functionality
    const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const historyEntry = history[newIndex];

        setHistoryIndex(newIndex);

        if (onChange) {
          const syntheticEvent = {
            target: { value: historyEntry.content },
            type: 'change'
          };
          onChange(syntheticEvent);
        }

        // Restore cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(
              historyEntry.cursor,
              historyEntry.cursor
            );
          }
        }, 0);
      }
    }, [historyIndex, history, onChange]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
      e => {
        const isCtrlCmd = e.ctrlKey || e.metaKey;

        if (isCtrlCmd) {
          switch (e.key.toLowerCase()) {
            case 'z':
              if (e.shiftKey) {
                e.preventDefault();
                handleRedo();
              } else {
                e.preventDefault();
                handleUndo();
              }
              break;
            case 'y':
              e.preventDefault();
              handleRedo();
              break;
            case 'f':
              e.preventDefault();
              setShowFindReplace(true);
              break;
            case 'h':
              e.preventDefault();
              setShowFindReplace(true);
              break;
            default:
              // No action for other keys
              break;
          }
        }

        // Escape to close find/replace
        if (e.key === 'Escape' && showFindReplace) {
          e.preventDefault();
          setShowFindReplace(false);
          return;
        }

        if (onKeyDown) {
          onKeyDown(e);
        }
      },
      [handleUndo, handleRedo, showFindReplace, onKeyDown]
    );

    // Find matches in text
    const findMatches = useCallback(
      (text, searchText) => {
        if (!searchText) return [];

        const flags = matchCase ? 'g' : 'gi';
        let pattern;

        if (wholeWord) {
          const escapedSearch = searchText.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );
          pattern = new RegExp(`\\b${escapedSearch}\\b`, flags);
        } else {
          const escapedSearch = searchText.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );
          pattern = new RegExp(escapedSearch, flags);
        }

        const matches = [];
        let match;

        while ((match = pattern.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0]
          });

          // Prevent infinite loop with zero-length matches
          if (match.index === pattern.lastIndex) {
            pattern.lastIndex++;
          }
        }

        return matches;
      },
      [matchCase, wholeWord]
    );

    // Update matches when find text or options change
    useEffect(() => {
      if (findText && textareaRef.current) {
        const newMatches = findMatches(textareaRef.current.value, findText);
        setMatches(newMatches);
        setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
      } else {
        setMatches([]);
        setCurrentMatchIndex(-1);
      }
    }, [findText, matchCase, wholeWord, value, findMatches]);

    // Navigate to next match
    const goToNextMatch = useCallback(() => {
      if (matches.length > 0) {
        const nextIndex = (currentMatchIndex + 1) % matches.length;
        setCurrentMatchIndex(nextIndex);
        const match = matches[nextIndex];
        textareaRef.current?.setSelectionRange(match.start, match.end);
        textareaRef.current?.focus();
      }
    }, [matches, currentMatchIndex]);

    // Navigate to previous match
    const goToPrevMatch = useCallback(() => {
      if (matches.length > 0) {
        const prevIndex =
          currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
        setCurrentMatchIndex(prevIndex);
        const match = matches[prevIndex];
        textareaRef.current?.setSelectionRange(match.start, match.end);
        textareaRef.current?.focus();
      }
    }, [matches, currentMatchIndex]);

    // Replace current match
    const replaceCurrent = useCallback(() => {
      if (currentMatchIndex >= 0 && matches.length > 0 && textareaRef.current) {
        const match = matches[currentMatchIndex];
        const currentValue = textareaRef.current.value;
        const newValue =
          currentValue.slice(0, match.start) +
          replaceText +
          currentValue.slice(match.end);

        const syntheticEvent = {
          target: { value: newValue },
          type: 'change'
        };

        if (onChange) {
          onChange(syntheticEvent);
        }

        // Update cursor position
        const newCursorPos = match.start + replaceText.length;
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }, [currentMatchIndex, matches, replaceText, onChange]);

    // Replace all matches
    const replaceAll = useCallback(() => {
      if (matches.length > 0 && textareaRef.current) {
        let newValue = textareaRef.current.value;

        // Replace from end to start to maintain correct indices
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i];
          newValue =
            newValue.slice(0, match.start) +
            replaceText +
            newValue.slice(match.end);
        }

        const syntheticEvent = {
          target: { value: newValue },
          type: 'change'
        };

        if (onChange) {
          onChange(syntheticEvent);
        }
      }
    }, [matches, replaceText, onChange]);

    return (
      <div
        className="text-editor-container"
        style={{ display: 'flex', flexDirection: 'column', ...style }}
      >
        {showFindReplace && (
          <div
            className="find-replace-panel"
            style={{
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: '12px',
              flexShrink: 0
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '4px'
              }}
            >
              <input
                type="text"
                placeholder="Find"
                value={findText}
                onChange={e => setFindText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowFindReplace(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  fontSize: '12px'
                }}
                autoFocus
              />
              <button
                onClick={goToPrevMatch}
                disabled={matches.length === 0}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  background: 'white',
                  cursor: matches.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
              >
                ↑
              </button>
              <button
                onClick={goToNextMatch}
                disabled={matches.length === 0}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  background: 'white',
                  cursor: matches.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
              >
                ↓
              </button>
              <span
                style={{ minWidth: '60px', fontSize: '11px', color: '#666' }}
              >
                {matches.length > 0
                  ? `${currentMatchIndex + 1} of ${matches.length}`
                  : '0 of 0'}
              </span>
              <button
                onClick={() => setShowFindReplace(false)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Replace"
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowFindReplace(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  fontSize: '12px'
                }}
              />
              <button
                onClick={replaceCurrent}
                disabled={currentMatchIndex < 0}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  background: 'white',
                  cursor: currentMatchIndex >= 0 ? 'pointer' : 'not-allowed',
                  fontSize: '11px'
                }}
              >
                Replace
              </button>
              <button
                onClick={replaceAll}
                disabled={matches.length === 0}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  background: 'white',
                  cursor: matches.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '11px'
                }}
              >
                All
              </button>
            </div>

            <div style={{ marginTop: '4px', display: 'flex', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px'
                }}
              >
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={e => setMatchCase(e.target.checked)}
                  style={{ margin: 0 }}
                />
                Match case
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px'
                }}
              >
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={e => setWholeWord(e.target.checked)}
                  style={{ margin: 0 }}
                />
                Whole word
              </label>
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          placeholder={placeholder}
          className={`text-editor ${className}`}
          rows={rows}
          disabled={disabled}
          spellCheck={spellCheck}
          style={{
            width: '100%',
            resize: 'vertical',
            fontFamily: 'var(--editor-font-family, inherit)',
            fontSize: 'inherit',
            lineHeight: '1.5',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            outline: 'none',
            transition: 'border-color 0.2s',
            flex: 1
          }}
          {...props}
        />
      </div>
    );
  }
);

TextEditor.displayName = 'TextEditor';

export default TextEditor;
