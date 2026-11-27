import React, { useState } from 'react';
import { Quote, Eye, EyeOff, ImageOff, ExternalLink, Code } from 'lucide-react';

/**
 * Validates a color value to ensure it's safe and doesn't contain injected code.
 */
function sanitizeColor(val) {
  if (!val || typeof val !== 'string') return null;
  val = val.trim().replace(/^["']|["']$/g, '');
  // Hex color (#rgb, #rrggbb, #rrggbbaa)
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(val)) {
    return val;
  }
  // Standard CSS named colors (alphanumeric only)
  if (/^[a-zA-Z]{3,20}$/.test(val)) {
    return val.toLowerCase();
  }
  // rgb/rgba/hsl/hsla safe formats
  if (/^(rgb|hsl)a?\([0-9,\s.%]+\)$/.test(val)) {
    return val;
  }
  return null;
}

/**
 * Validates and formats font size.
 * In MAL, size can be percentage (e.g., 120 = 120%, 80 = 80%) or px.
 */
function sanitizeSize(val) {
  if (!val || typeof val !== 'string') return null;
  val = val.trim().replace(/^["']|["']$/g, '');

  // Percentage (e.g. "120%" or "80%")
  if (/^\d{1,3}%$/.test(val)) {
    const num = parseInt(val, 10);
    const clamped = Math.max(50, Math.min(num, 300));
    return `${clamped}%`;
  }

  // Pixels (e.g. "16px")
  if (/^\d{1,2}px$/i.test(val)) {
    const num = parseInt(val, 10);
    const clamped = Math.max(9, Math.min(num, 48));
    return `${clamped}px`;
  }

  // Raw number (e.g. "120" -> 120%, "16" -> 16px)
  if (/^\d{1,3}$/.test(val)) {
    const num = parseInt(val, 10);
    if (num <= 40) {
      // Treat as px
      const clamped = Math.max(9, Math.min(num, 40));
      return `${clamped}px`;
    } else {
      // Treat as percentage
      const clamped = Math.max(50, Math.min(num, 300));
      return `${clamped}%`;
    }
  }

  return null;
}

/**
 * Validates URLs for security (XSS prevention).
 * Only http, https, mailto, or relative URLs allowed.
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  url = url.trim().replace(/^["']|["']$/g, '');

  // Disallow javascript:, vbscript:, data: (except safe images), file:, etc.
  const lower = url.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text') ||
    lower.startsWith('file:')
  ) {
    return '#blocked';
  }

  // Allow standard protocols
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(url)) {
    return url;
  }

  // If starts with www., prepend https://
  if (/^www\./i.test(url)) {
    return `https://${url}`;
  }

  return url;
}

/**
 * Component for interactive MAL-style spoiler.
 */
function SpoilerBlock({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const displayTitle = title ? title.trim().replace(/^["']|["']$/g, '') : null;

  return (
    <div className="my-2 inline-block max-w-full text-left font-sans">
      <div className="border border-amber-300 rounded-xl overflow-hidden bg-amber-50/80 shadow-2xs">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-amber-950 hover:bg-amber-100/80 transition-colors cursor-pointer select-none"
        >
          {isOpen ? (
            <EyeOff className="w-3.5 h-3.5 text-amber-800 shrink-0" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-amber-800 shrink-0" />
          )}
          <span>
            {isOpen ? 'Hide spoiler' : 'Show spoiler'}
            {displayTitle ? `: ${displayTitle}` : ''}
          </span>
        </button>

        {isOpen && (
          <div className="p-3 border-t border-amber-200 bg-white/80 text-amber-950 transition-all">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Normalize and clean up image and GIF URLs (Giphy, Tenor, Imgur, direct links)
 */
function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let cleaned = url.trim().replace(/^["']|["']$/g, '');

  // Convert Giphy webpage link (e.g. https://giphy.com/gifs/cat-cute-3oriO0OEd9QIDdllqo) to direct gif
  const giphyMatch = cleaned.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)$/i);
  if (giphyMatch && !cleaned.includes('media.giphy.com')) {
    return `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
  }

  return cleaned;
}

/**
 * Component for safe image & GIF rendering with error fallback and zoom.
 */
function ImageBlock({ src, alt = 'diary media', tag = 'img' }) {
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const processedUrl = normalizeMediaUrl(src);
  const safeSrc = sanitizeUrl(processedUrl);

  const isGif =
    tag === 'gif' ||
    /\.gif(\?|#|$)/i.test(safeSrc) ||
    safeSrc.includes('giphy.com') ||
    safeSrc.includes('tenor.com');

  if (hasError || safeSrc === '#blocked' || !safeSrc) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 my-2 rounded-xl border border-amber-300/80 bg-amber-50/80 text-xs text-amber-900 shadow-2xs font-sans">
        <ImageOff className="w-3.5 h-3.5 text-amber-700" />
        <span>[{isGif ? 'GIF not available' : 'Image not available'}]</span>
      </span>
    );
  }

  return (
    <span className="inline-block my-2.5 max-w-full align-middle">
      <span className="relative inline-block group rounded-2xl overflow-hidden border border-amber-300/90 shadow-md bg-amber-50/40">
        <img
          src={safeSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`max-w-full h-auto block rounded-2xl cursor-pointer transition-transform duration-200 group-hover:scale-[1.01] ${
            isExpanded ? 'max-h-none' : 'max-h-[480px]'
          }`}
        />
        {isGif && (
          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider bg-black/80 text-amber-300 backdrop-blur-xs select-none shadow-xs pointer-events-none">
            GIF
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Parse a BBCode string into an AST tree of nodes.
 */
function parseBBCodeToAST(text) {
  if (!text || typeof text !== 'string') return [];

  // Regex to match tags like [tag], [/tag], [tag=param], [*]
  const TAG_REGEX = /\[(\/?)([a-zA-Z*]+)(?:=([^\]]+))?\]/g;

  let tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = TAG_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    const isClose = match[1] === '/';
    const tag = match[2].toLowerCase();
    const param = match[3] ? match[3].trim() : null;

    if (tag === '*') {
      tokens.push({ type: 'item' });
    } else if (isClose) {
      tokens.push({ type: 'close', tag });
    } else {
      tokens.push({ type: 'open', tag, param });
    }

    lastIndex = TAG_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  // Pre-process [code], [img], and [gif] tags so their inner content is raw text
  const processedTokens = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === 'open' && (tok.tag === 'code' || tok.tag === 'img' || tok.tag === 'gif')) {
      const closingTag = tok.tag;
      let rawContent = '';
      let j = i + 1;
      let foundClose = false;

      while (j < tokens.length) {
        if (tokens[j].type === 'close' && tokens[j].tag === closingTag) {
          foundClose = true;
          break;
        }
        // Accumulate raw text
        if (tokens[j].type === 'text') {
          rawContent += tokens[j].content;
        } else if (tokens[j].type === 'open') {
          rawContent += `[${tokens[j].tag}${tokens[j].param ? `=${tokens[j].param}` : ''}]`;
        } else if (tokens[j].type === 'close') {
          rawContent += `[/${tokens[j].tag}]`;
        } else if (tokens[j].type === 'item') {
          rawContent += '[*]';
        }
        j++;
      }

      if (foundClose) {
        processedTokens.push({
          type: 'raw_block',
          tag: closingTag,
          param: tok.param,
          content: rawContent,
        });
        i = j; // Advance index to closing tag
      } else {
        processedTokens.push(tok);
      }
    } else {
      processedTokens.push(tok);
    }
  }

  // Recursive parsing to build tree
  let pos = 0;

  function parseNodes(stopTag = null) {
    const nodes = [];

    while (pos < processedTokens.length) {
      const tok = processedTokens[pos];

      if (tok.type === 'close') {
        if (stopTag && tok.tag === stopTag) {
          pos++; // Consume closing tag
          return nodes;
        } else {
          // Unexpected closing tag, treat as text
          nodes.push({ type: 'text', content: `[/${tok.tag}]` });
          pos++;
        }
      } else if (tok.type === 'text') {
        nodes.push({ type: 'text', content: tok.content });
        pos++;
      } else if (tok.type === 'raw_block') {
        nodes.push({
          type: tok.tag, // 'code' or 'img'
          param: tok.param,
          content: tok.content,
        });
        pos++;
      } else if (tok.type === 'item') {
        nodes.push({ type: 'item' });
        pos++;
      } else if (tok.type === 'open') {
        const currentTag = tok.tag;
        const currentParam = tok.param;
        pos++; // Consume open tag

        // Check if there is a matching closing tag ahead
        let hasCloseAhead = false;
        let depth = 0;
        for (let k = pos; k < processedTokens.length; k++) {
          if (processedTokens[k].type === 'open' && processedTokens[k].tag === currentTag) {
            depth++;
          } else if (processedTokens[k].type === 'close' && processedTokens[k].tag === currentTag) {
            if (depth === 0) {
              hasCloseAhead = true;
              break;
            }
            depth--;
          }
        }

        if (hasCloseAhead) {
          const children = parseNodes(currentTag);
          nodes.push({
            type: currentTag,
            param: currentParam,
            children,
          });
        } else {
          // No closing tag, treat as literal text
          nodes.push({
            type: 'text',
            content: `[${currentTag}${currentParam ? `=${currentParam}` : ''}]`,
          });
        }
      } else {
        pos++;
      }
    }

    return nodes;
  }

  return parseNodes();
}

/**
 * Render AST nodes into safe React elements.
 */
function renderAST(nodes, keyPrefix = 'node') {
  if (!nodes || !nodes.length) return null;

  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    switch (node.type) {
      case 'text': {
        // Handle newlines within text nodes
        const lines = node.content.split('\n');
        if (lines.length === 1) {
          return <React.Fragment key={key}>{lines[0]}</React.Fragment>;
        }
        return (
          <React.Fragment key={key}>
            {lines.map((line, lIdx) => (
              <React.Fragment key={`${key}-line-${lIdx}`}>
                {line}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      }

      case 'b':
        return (
          <strong key={key} className="font-bold">
            {renderAST(node.children, key)}
          </strong>
        );

      case 'i':
        return (
          <em key={key} className="italic">
            {renderAST(node.children, key)}
          </em>
        );

      case 'u':
        return (
          <span key={key} className="underline underline-offset-2">
            {renderAST(node.children, key)}
          </span>
        );

      case 's':
        return (
          <del key={key} className="line-through opacity-75">
            {renderAST(node.children, key)}
          </del>
        );

      case 'color': {
        const color = sanitizeColor(node.param);
        return (
          <span key={key} style={color ? { color } : undefined}>
            {renderAST(node.children, key)}
          </span>
        );
      }

      case 'size': {
        const size = sanitizeSize(node.param);
        return (
          <span key={key} style={size ? { fontSize: size } : undefined}>
            {renderAST(node.children, key)}
          </span>
        );
      }

      case 'center':
        return (
          <div key={key} className="text-center my-1.5 block">
            {renderAST(node.children, key)}
          </div>
        );

      case 'right':
        return (
          <div key={key} className="text-right my-1.5 block">
            {renderAST(node.children, key)}
          </div>
        );

      case 'quote': {
        const author = node.param ? node.param.replace(/^["']|["']$/g, '') : null;
        return (
          <div
            key={key}
            className="my-3 rounded-xl border border-amber-300/90 bg-amber-100/40 overflow-hidden shadow-2xs font-sans text-sm text-left"
          >
            <div className="px-3 py-1.5 bg-amber-200/50 border-b border-amber-300/60 text-xs font-semibold text-amber-950 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{author ? `${author} wrote:` : 'Quote:'}</span>
            </div>
            <div className="p-3 italic text-amber-950 font-sans text-sm leading-relaxed">
              {renderAST(node.children, key)}
            </div>
          </div>
        );
      }

      case 'spoiler':
        return (
          <SpoilerBlock key={key} title={node.param}>
            {renderAST(node.children, key)}
          </SpoilerBlock>
        );

      case 'img':
      case 'gif':
        return <ImageBlock key={key} src={node.content} tag={node.type} />;

      case 'url': {
        // [url=link]text[/url] or [url]link[/url]
        let href = node.param;
        let children;
        if (!href) {
          // Inner content is the link
          const innerText = node.children
            ? node.children.map((c) => (c.type === 'text' ? c.content : '')).join('')
            : '';
          href = innerText;
          children = innerText;
        } else {
          children = renderAST(node.children, key);
        }
        const safeHref = sanitizeUrl(href);

        return (
          <a
            key={key}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 dark:text-sky-400 underline decoration-sky-300 dark:decoration-sky-600 hover:text-sky-800 dark:hover:text-sky-300 transition-colors inline-flex items-center gap-0.5 font-medium"
          >
            <span>{children}</span>
            <ExternalLink className="w-3 h-3 inline-block opacity-60 ml-0.5" />
          </a>
        );
      }

      case 'list': {
        // Process children into list items partitioned by 'item' ([*])
        const listItems = [];
        let currentItemChildren = [];
        let hasSeenItem = false;

        const processChild = (child) => {
          if (child.type === 'item') {
            if (hasSeenItem) {
              listItems.push(currentItemChildren);
              currentItemChildren = [];
            }
            hasSeenItem = true;
          } else {
            currentItemChildren.push(child);
          }
        };

        if (node.children) {
          node.children.forEach(processChild);
          if (hasSeenItem || currentItemChildren.length > 0) {
            listItems.push(currentItemChildren);
          }
        }

        const isNumbered =
          node.param === '1' ||
          node.param === 'a' ||
          node.param === 'decimal' ||
          node.param === 'number';

        const ListTag = isNumbered ? 'ol' : 'ul';
        const listStyle = isNumbered ? 'list-decimal pl-6 my-2 space-y-1' : 'list-disc pl-6 my-2 space-y-1';

        return (
          <ListTag key={key} className={listStyle}>
            {listItems.map((item, itemIdx) => (
              <li key={`${key}-item-${itemIdx}`}>
                {renderAST(item, `${key}-item-${itemIdx}`)}
              </li>
            ))}
          </ListTag>
        );
      }

      case 'code':
        return (
          <div key={key} className="my-2 text-left font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1 bg-gray-800 text-gray-400 rounded-t-lg border-b border-gray-700 text-[11px]">
              <span className="flex items-center gap-1">
                <Code className="w-3 h-3 text-emerald-400" />
                Code
              </span>
            </div>
            <pre className="p-3 bg-gray-950 text-emerald-300 rounded-b-lg overflow-x-auto border border-gray-800 leading-relaxed font-mono">
              <code>{node.content}</code>
            </pre>
          </div>
        );

      default:
        if (node.children) {
          return <span key={key}>{renderAST(node.children, key)}</span>;
        }
        return null;
    }
  });
}

/**
 * BBCodeRenderer component
 * Safely renders MyAnimeList-style BBCode to React elements without raw HTML injection.
 */
export function BBCodeRenderer({ text = '', className = '' }) {
  if (!text) {
    return <span className="text-gray-400 dark:text-gray-500 italic select-none">No content</span>;
  }

  const ast = parseBBCodeToAST(text);

  return (
    <div className={`bbcode-rendered leading-relaxed break-words ${className}`}>
      {renderAST(ast)}
    </div>
  );
}

export default BBCodeRenderer;
