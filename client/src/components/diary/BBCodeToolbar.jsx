import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Quote,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  AlignCenter,
  AlignRight,
  List,
  Code,
  Type,
  Palette,
  ChevronDown,
} from 'lucide-react';

const COLORS = [
  { name: 'Red', hex: '#ef4444', class: 'bg-red-500' },
  { name: 'Amber', hex: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Emerald', hex: '#10b981', class: 'bg-emerald-500' },
  { name: 'Sky', hex: '#0284c7', class: 'bg-sky-600' },
  { name: 'Blue', hex: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Purple', hex: '#8b5cf6', class: 'bg-purple-500' },
  { name: 'Rose', hex: '#ec4899', class: 'bg-rose-500' },
  { name: 'Sepia / Brown', hex: '#78350f', class: 'bg-amber-900' },
  { name: 'Charcoal', hex: '#374151', class: 'bg-gray-700' },
];

const SIZES = [
  { label: 'Small (80%)', value: '80%' },
  { label: 'Normal (100%)', value: '100%' },
  { label: 'Large (125%)', value: '125%' },
  { label: 'Huge (150%)', value: '150%' },
];

export function BBCodeToolbar({ textareaRef, value, onChange }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [showImgDialog, setShowImgDialog] = useState(false);
  const [showSpoilerDialog, setShowSpoilerDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  // Dialog inputs
  const [urlInput, setUrlInput] = useState('');
  const [urlTextInput, setUrlTextInput] = useState('');
  const [imgInput, setImgInput] = useState('');
  const [spoilerTitleInput, setSpoilerTitleInput] = useState('');
  const [quoteAuthorInput, setQuoteAuthorInput] = useState('');

  const colorRef = useRef(null);
  const sizeRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (colorRef.current && !colorRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
      if (sizeRef.current && !sizeRef.current.contains(e.target)) {
        setShowSizePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Core helper to wrap currently selected text or insert tag with placeholder
   */
  const wrapText = (openTag, closeTag, placeholder = 'text') => {
    const el = textareaRef?.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const currentVal = value ?? '';

    const selected = currentVal.substring(start, end);
    const textToInsert = selected || placeholder;
    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);

    const nextVal = `${before}${openTag}${textToInsert}${closeTag}${after}`;
    onChange(nextVal);

    requestAnimationFrame(() => {
      el.focus();
      if (selected) {
        // Highlight the newly wrapped text
        const newStart = start + openTag.length;
        const newEnd = newStart + textToInsert.length;
        el.setSelectionRange(newStart, newEnd);
      } else {
        // Highlight placeholder so user can easily overwrite it
        const newStart = start + openTag.length;
        const newEnd = newStart + placeholder.length;
        el.setSelectionRange(newStart, newEnd);
      }
    });
  };

  // URL Insertion
  const handleOpenUrlDialog = () => {
    const el = textareaRef?.current;
    if (el) {
      const selected = (value || '').substring(el.selectionStart, el.selectionEnd);
      setUrlTextInput(selected);
    }
    setUrlInput('');
    setShowUrlDialog(true);
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setShowUrlDialog(false);
      return;
    }
    const safeUrl = urlInput.trim();
    const linkText = urlTextInput.trim() || 'Link';
    wrapText(`[url=${safeUrl}]`, `[/url]`, linkText);
    setShowUrlDialog(false);
  };

  // Image Insertion
  const handleOpenImgDialog = () => {
    const el = textareaRef?.current;
    if (el) {
      const selected = (value || '').substring(el.selectionStart, el.selectionEnd);
      if (selected.startsWith('http://') || selected.startsWith('https://')) {
        setImgInput(selected);
      } else {
        setImgInput('');
      }
    }
    setShowImgDialog(true);
  };

  const handleApplyImg = (e) => {
    e.preventDefault();
    if (!imgInput.trim()) {
      setShowImgDialog(false);
      return;
    }
    const safeImg = imgInput.trim();
    wrapText(`[img]`, `[/img]`, safeImg);
    setShowImgDialog(false);
  };

  // Spoiler Insertion
  const handleOpenSpoilerDialog = () => {
    setSpoilerTitleInput('');
    setShowSpoilerDialog(true);
  };

  const handleApplySpoiler = (e) => {
    e.preventDefault();
    const title = spoilerTitleInput.trim();
    const openTag = title ? `[spoiler=${title}]` : '[spoiler]';
    wrapText(openTag, '[/spoiler]', 'hidden spoiler content');
    setShowSpoilerDialog(false);
  };

  // Quote Insertion
  const handleOpenQuoteDialog = () => {
    setQuoteAuthorInput('');
    setShowQuoteDialog(true);
  };

  const handleApplyQuote = (e) => {
    e.preventDefault();
    const author = quoteAuthorInput.trim();
    const openTag = author ? `[quote=${author}]` : '[quote]';
    wrapText(openTag, '[/quote]', 'Quoted text here');
    setShowQuoteDialog(false);
  };

  // List Insertion
  const handleInsertList = () => {
    const el = textareaRef?.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = (value || '').substring(start, end);

    if (selected) {
      // Split selected lines and prepend [*]
      const lines = selected.split('\n').filter((l) => l.trim().length > 0);
      const formatted = lines.map((l) => `[*]${l}`).join('\n');
      const openTag = '[list]\n';
      const closeTag = '\n[/list]';
      wrapText(openTag, closeTag, formatted);
    } else {
      wrapText('[list]\n[*]', '\n[*]Item 2\n[/list]', 'Item 1');
    }
  };

  return (
    <div className="bg-amber-50/70 dark:bg-gray-800/80 border border-amber-200/80 dark:border-gray-700/80 rounded-t-xl px-2.5 py-1.5 flex items-center flex-wrap gap-1 transition-colors relative z-10 select-none shadow-2xs">
      {/* Bold */}
      <button
        type="button"
        onClick={() => wrapText('[b]', '[/b]', 'bold text')}
        title="Bold [b] (Ctrl+B)"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => wrapText('[i]', '[/i]', 'italic text')}
        title="Italic [i] (Ctrl+I)"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => wrapText('[u]', '[/u]', 'underlined text')}
        title="Underline [u]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      {/* Strike */}
      <button
        type="button"
        onClick={() => wrapText('[s]', '[/s]', 'strikethrough text')}
        title="Strikethrough [s]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <span className="w-px h-4 bg-amber-200 dark:bg-gray-700 mx-0.5" />

      {/* Font Size Selector */}
      <div className="relative" ref={sizeRef}>
        <button
          type="button"
          onClick={() => setShowSizePicker(!showSizePicker)}
          title="Font Size [size]"
          className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Size</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {showSizePicker && (
          <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-30">
            {SIZES.map((sz) => (
              <button
                key={sz.value}
                type="button"
                onClick={() => {
                  wrapText(`[size=${sz.value}]`, `[/size]`, sz.label);
                  setShowSizePicker(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {sz.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color Picker */}
      <div className="relative" ref={colorRef}>
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color [color]"
          className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Color</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-30 w-44">
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Choose Color
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => {
                    wrapText(`[color=${c.hex}]`, `[/color]`, `${c.name} text`);
                    setShowColorPicker(false);
                  }}
                  title={c.name}
                  className="flex items-center gap-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-[10px] text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${c.class} shrink-0 border border-black/10`} />
                  <span className="truncate">{c.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <span className="w-px h-4 bg-amber-200 dark:bg-gray-700 mx-0.5" />

      {/* Align Center */}
      <button
        type="button"
        onClick={() => wrapText('[center]', '[/center]', 'centered text')}
        title="Center Align [center]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>

      {/* Align Right */}
      <button
        type="button"
        onClick={() => wrapText('[right]', '[/right]', 'right aligned text')}
        title="Right Align [right]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>

      {/* Bullet List */}
      <button
        type="button"
        onClick={handleInsertList}
        title="List [*]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <span className="w-px h-4 bg-amber-200 dark:bg-gray-700 mx-0.5" />

      {/* Quote */}
      <button
        type="button"
        onClick={handleOpenQuoteDialog}
        title="Quote [quote]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      {/* Spoiler */}
      <button
        type="button"
        onClick={handleOpenSpoilerDialog}
        title="Interactive Spoiler [spoiler]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>

      {/* Link */}
      <button
        type="button"
        onClick={handleOpenUrlDialog}
        title="Link [url]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>

      {/* Image */}
      <button
        type="button"
        onClick={handleOpenImgDialog}
        title="Image [img]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <ImageIcon className="w-3.5 h-3.5" />
      </button>

      {/* Code */}
      <button
        type="button"
        onClick={() => wrapText('[code]', '[/code]', 'code snippet')}
        title="Code Block [code]"
        className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      {/* Modal / Dialog: Insert URL */}
      {showUrlDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handleApplyUrl}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl max-w-sm w-full space-y-3"
          >
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Insert Link</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  URL Address
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Link Text (optional)
                </label>
                <input
                  type="text"
                  placeholder="Text to display"
                  value={urlTextInput}
                  onChange={(e) => setUrlTextInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUrlDialog(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600 cursor-pointer"
              >
                Insert Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Dialog: Insert Image */}
      {showImgDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handleApplyImg}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl max-w-sm w-full space-y-3"
          >
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Insert Image</h4>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Image Web URL
              </label>
              <input
                type="text"
                placeholder="https://example.com/photo.jpg"
                value={imgInput}
                onChange={(e) => setImgInput(e.target.value)}
                autoFocus
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowImgDialog(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600 cursor-pointer"
              >
                Insert Image
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Dialog: Insert Spoiler */}
      {showSpoilerDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handleApplySpoiler}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl max-w-sm w-full space-y-3"
          >
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Insert Spoiler Box</h4>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Spoiler Label / Title (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 5 Secrets"
                value={spoilerTitleInput}
                onChange={(e) => setSpoilerTitleInput(e.target.value)}
                autoFocus
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSpoilerDialog(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600 cursor-pointer"
              >
                Insert Spoiler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Dialog: Insert Quote */}
      {showQuoteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handleApplyQuote}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl max-w-sm w-full space-y-3"
          >
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Insert Quote Box</h4>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Author / Source (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Marcus Aurelius"
                value={quoteAuthorInput}
                onChange={(e) => setQuoteAuthorInput(e.target.value)}
                autoFocus
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowQuoteDialog(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600 cursor-pointer"
              >
                Insert Quote
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BBCodeToolbar;
