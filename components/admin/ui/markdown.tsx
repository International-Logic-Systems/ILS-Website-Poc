'use client';

import * as React from 'react';
import { cn } from '@/lib/admin/cn';

/**
 * A small markdown renderer.
 *
 * Deliberately not a dependency. The fixtures and the editor use one narrow
 * dialect — headings, bold, italic, inline code, links, bullet and numbered
 * lists, block quotes, pipe tables and horizontal rules — and a hand-rolled
 * renderer for that dialect is about eighty lines, styles cleanly against the
 * ILS palette, and keeps the dependency list to what was agreed.
 *
 * It renders text, never HTML: input is escaped by React at every level, so a
 * `<script>` in a case study body is inert.
 */

type Props = { source: string; className?: string; compact?: boolean };

/** Bold, italic, inline code and links, in that precedence. */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;

    if (token.startsWith('**')) {
      out.push(
        <strong key={key} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      out.push(
        <code
          key={key}
          className="rounded bg-wash px-1 py-0.5 font-mono text-[0.9em] text-ink"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[')) {
      const split = token.indexOf('](');
      out.push(
        <a
          key={key}
          href={token.slice(split + 2, -1)}
          className="text-action underline underline-offset-2 hover:text-action-hover"
        >
          {token.slice(1, split)}
        </a>,
      );
    } else {
      out.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function Markdown({ source, className, compact = false }: Props) {
  const blocks = React.useMemo(() => {
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    const gap = compact ? 'mt-2' : 'mt-3.5';

    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim()) {
        i += 1;
        continue;
      }

      /* table */
      if (line.trim().startsWith('|') && lines[i + 1]?.includes('---')) {
        const head = splitRow(line);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          rows.push(splitRow(lines[i]));
          i += 1;
        }
        nodes.push(
          <div key={key++} className={cn(gap, 'overflow-x-auto scroll-slim')}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {head.map((cell, c) => (
                    <th
                      key={c}
                      className="border-b border-rule px-3 py-2 text-left font-medium text-slate"
                    >
                      {inline(cell, `th${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r} className="align-top">
                    {row.map((cell, c) => (
                      <td key={c} className="border-b border-rule-soft px-3 py-2 text-ink">
                        {inline(cell, `td${r}-${c}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }

      /* heading */
      const heading = /^(#{1,4})\s+(.*)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        const size =
          level === 1
            ? 'text-lg font-semibold'
            : level === 2
              ? 'text-[15px] font-semibold'
              : 'text-sm font-semibold';
        const Tag = (['h2', 'h3', 'h4', 'h5'] as const)[level - 1];
        nodes.push(
          <Tag key={key++} className={cn(gap, size, 'text-ink')}>
            {inline(heading[2], `h${key}`)}
          </Tag>,
        );
        i += 1;
        continue;
      }

      /* horizontal rule */
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        nodes.push(<hr key={key++} className={cn(gap, 'border-rule-soft')} />);
        i += 1;
        continue;
      }

      /* block quote */
      if (line.startsWith('> ')) {
        const quote: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
          quote.push(lines[i].slice(2));
          i += 1;
        }
        nodes.push(
          <blockquote
            key={key++}
            className={cn(gap, 'border-l-2 border-action-ring pl-3 text-slate italic')}
          >
            {inline(quote.join(' '), `q${key}`)}
          </blockquote>,
        );
        continue;
      }

      /* lists */
      const bullet = /^[-*]\s+/;
      const numbered = /^\d+[.)]\s+/;
      if (bullet.test(line) || numbered.test(line)) {
        const ordered = numbered.test(line);
        const test = ordered ? numbered : bullet;
        const items: string[] = [];
        while (i < lines.length && test.test(lines[i])) {
          items.push(lines[i].replace(test, ''));
          i += 1;
        }
        const ListTag = ordered ? 'ol' : 'ul';
        nodes.push(
          <ListTag
            key={key++}
            className={cn(
              gap,
              'space-y-1.5 pl-5 text-slate',
              ordered ? 'list-decimal' : 'list-disc',
            )}
          >
            {items.map((item, n) => (
              <li key={n} className="leading-relaxed marker:text-muted">
                {inline(item, `li${key}-${n}`)}
              </li>
            ))}
          </ListTag>,
        );
        continue;
      }

      /* paragraph — consecutive non-blank lines join into one */
      const para: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,4})\s/.test(lines[i]) &&
        !bullet.test(lines[i]) &&
        !numbered.test(lines[i]) &&
        !lines[i].startsWith('> ') &&
        !lines[i].trim().startsWith('|')
      ) {
        para.push(lines[i]);
        i += 1;
      }
      nodes.push(
        <p key={key++} className={cn(gap, 'leading-relaxed text-slate')}>
          {inline(para.join(' '), `p${key}`)}
        </p>,
      );
    }

    return nodes;
  }, [source, compact]);

  return (
    <div className={cn('text-sm [&>*:first-child]:mt-0', className)}>
      {blocks.length ? blocks : <p className="text-[13px] italic text-muted">Nothing to preview.</p>}
    </div>
  );
}
