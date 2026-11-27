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
    <div className="my-2 inline-block max-w-full text-left">
      <div className="border border-amber-300/80 dark:border-amber-700/60 rounded-lg overflow-hidden bg-amber-50/50 dark:bg-amber-950/20 shadow-2xs">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors cursor-pointer select-none"
        >
          {isOpen ? (
            <EyeOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
          )}
          <span>
            {isOpen ? 'Hide spoiler' : 'Show spoiler'}
            {displayTitle ? `: ${displayTitle}` : ''}
          </span>
        </button>

        {isOpen && (
          <div className="p-3 border-t border-amber-200 dark:border-amber-800/60 bg-white/70 dark:bg-gray-900/70 transition-all">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Component for safe image rendering with error fallback.
 */
function ImageBlock({ src, alt = 'diary entry image' }) {
  const [hasError, setHasError] = useState(false);
  const safeSrc = sanitizeUrl(src);

  if (hasError || safeSrc === '#blocked') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
        <ImageOff className="w-3.5 h-3.5 text-gray-400" />
        <span>[Image not available]</span>
      </span>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className="max-w-full h-auto rounded-lg shadow-xs my-2 border border-gray-200 dark:border-gray-800 inline-block align-middle"
      style={{ maxHeight: '480px' }}
    />
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

  // Pre-process [code] and [img] tags so their inner content is raw text
  const processedTokens = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === 'open' && (tok.tag === 'code' || tok.tag === 'img')) {
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
            className="my-3 rounded-lg border border-gray-300 dark:border-gray-700/80 bg-amber-50/40 dark:bg-gray-800/50 overflow-hidden shadow-2xs font-sans text-sm text-left"
          >
            <div className="px-3 py-1.5 bg-amber-100/50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/60 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{author ? `${author} wrote:` : 'Quote:'}</span>
            </div>
            <div className="p-3 italic text-gray-800 dark:text-gray-200 font-sans text-sm leading-relaxed">
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
        return <ImageBlock key={key} src={node.content} />;

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
