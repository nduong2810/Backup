import { useState } from 'react';

/**
 * A safe, lightweight custom parser for Markdown headers, code blocks, inline code, links, bold, italic, and lists.
 * Designed to avoid installing heavy external dependencies while providing rich tech-blog formatting.
 */
export default function SafeMarkdown({ content, className = '' }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!content) return null;

  const handleCopy = (codeText, id) => {
    navigator.clipboard.writeText(codeText.trim());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Split content by markdown code blocks (odd indices will be the code blocks)
  const parts = content.split(/(```[a-zA-Z0-9_-]*\r?\n[\s\S]*?\r?\n```)/g);

  const parseInlineMarkdown = (text) => {
    if (!text) return '';

    // Regex to match inline code (`...`), links ([...](...)), bold-italic (***...*** or ___...___), bold (**...** or __...__), and italic (*...* or _..._)
    const regex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*\*(?:.*?)\*\*\*|___(?:.*?)___|\*\*(?:.*?)\*\*|__(?:.*?)__|\*(?:.*?)\*|_(?:.*?)_)/g;
    const tokens = text.split(regex);

    return tokens.map((token, i) => {
      if (!token) return null;

      // 1. Inline code
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code
            key={i}
            className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-rose-600 font-mono text-[13px] font-bold border border-slate-200/60 leading-none align-middle mx-0.5"
          >
            {token.slice(1, -1)}
          </code>
        );
      }

      // 2. Links
      if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
        const match = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (match) {
          const label = match[1];
          const url = match[2];
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-bold"
            >
              {parseInlineMarkdown(label)}
            </a>
          );
        }
      }

      // 3. Bold & Italic
      if (
        (token.startsWith('***') && token.endsWith('***')) ||
        (token.startsWith('___') && token.endsWith('___'))
      ) {
        return (
          <strong key={i} className="font-extrabold text-slate-900">
            <em className="italic text-slate-800">
              {parseInlineMarkdown(token.slice(3, -3))}
            </em>
          </strong>
        );
      }

      // 4. Bold
      if (
        (token.startsWith('**') && token.endsWith('**')) ||
        (token.startsWith('__') && token.endsWith('__'))
      ) {
        return (
          <strong key={i} className="font-extrabold text-slate-900">
            {parseInlineMarkdown(token.slice(2, -2))}
          </strong>
        );
      }

      // 5. Italic
      if (
        (token.startsWith('*') && token.endsWith('*')) ||
        (token.startsWith('_') && token.endsWith('_'))
      ) {
        return (
          <em key={i} className="italic text-slate-800">
            {parseInlineMarkdown(token.slice(1, -1))}
          </em>
        );
      }

      // Plain text
      return token;
    });
  };

  const renderLines = (lines) => {
    const rendered = [];
    let currentList = null; // { type: 'ul' | 'ol', items: [] }

    const flushList = (key) => {
      if (!currentList) return;
      if (currentList.type === 'ul') {
        rendered.push(
          <ul key={`ul-${key}`} className="list-disc pl-6 space-y-1.5 my-2 text-slate-800 text-left">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        rendered.push(
          <ol key={`ol-${key}`} className="list-decimal pl-6 space-y-1.5 my-2 text-slate-800 text-left">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Check bullet items (- item, * item, + item)
      const bulletMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
      // Check numbered items (1. item)
      const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);

      if (bulletMatch) {
        if (currentList && currentList.type !== 'ul') {
          flushList(lineIdx);
        }
        if (!currentList) {
          currentList = { type: 'ul', items: [] };
        }
        currentList.items.push(bulletMatch[3]);
      } else if (numberMatch) {
        if (currentList && currentList.type !== 'ol') {
          flushList(lineIdx);
        }
        if (!currentList) {
          currentList = { type: 'ol', items: [] };
        }
        currentList.items.push(numberMatch[3]);
      } else {
        // Normal text, header, or blank line
        flushList(lineIdx);

        // Header check
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const headerText = headerMatch[2];
          const parsedHeader = parseInlineMarkdown(headerText);

          switch (level) {
            case 1:
              rendered.push(
                <h1 key={lineIdx} className="text-2xl font-black text-slate-900 mt-6 mb-2 tracking-tight">
                  {parsedHeader}
                </h1>
              );
              break;
            case 2:
              rendered.push(
                <h2 key={lineIdx} className="text-xl font-extrabold text-slate-900 mt-5 mb-2 tracking-tight">
                  {parsedHeader}
                </h2>
              );
              break;
            case 3:
              rendered.push(
                <h3 key={lineIdx} className="text-lg font-bold text-slate-800 mt-4 mb-1.5 tracking-tight">
                  {parsedHeader}
                </h3>
              );
              break;
            default:
              rendered.push(
                <h4 key={lineIdx} className="text-base font-bold text-slate-800 mt-3 mb-1.5">
                  {parsedHeader}
                </h4>
              );
              break;
          }
        } else if (trimmed === '') {
          rendered.push(<div key={lineIdx} className="h-0.5" />);
        } else {
          rendered.push(
            <p key={lineIdx} className="leading-relaxed break-words whitespace-pre-wrap text-slate-800">
              {parseInlineMarkdown(line)}
            </p>
          );
        }
      }
    });

    flushList(lines.length);
    return rendered;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {parts.map((part, index) => {
        const isCodeBlock = part.startsWith('```') && part.endsWith('```');

        if (isCodeBlock) {
          const match = part.match(/^```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)\r?\n```$/);
          const lang = match ? match[1] : '';
          const codeText = match ? match[2] : part.slice(3, -3);
          const codeBlockId = `code-block-${index}`;

          return (
            <div
              key={index}
              className="mt-2.5 mb-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-md overflow-hidden font-mono text-sm"
            >
              {/* Header bar */}
              <div className="flex items-center justify-between bg-slate-950/40 px-4 py-2 border-b border-slate-800/80 text-xs font-semibold text-slate-400 select-none">
                <span className="uppercase tracking-wider">{lang || 'CODE'}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeText, codeBlockId)}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedId === codeBlockId ? 'check' : 'content_copy'}
                  </span>
                  {copiedId === codeBlockId ? 'Đã sao chép!' : 'Sao chép'}
                </button>
              </div>
              {/* Code text */}
              <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed select-text text-left">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        } else {
          return renderLines(part.split(/\r?\n/));
        }
      })}
    </div>
  );
}
