/**
 * Reads CHANGELOG.md for the /changelog page: splits it into versions and turns the simple Markdown it uses
 * (headings, nested bullet lists, paragraphs, **bold**, _italic_, `code`, [links](url)) into HTML.
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  /** Website changes, as HTML. */
  html: string;
  /** "Mod data" section, if any. */
  modData?: { title: string; html: string };
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inline Markdown: code spans are set aside first (their contents stay literal), then links, bold and italic. */
export function renderInline(text: string): string {
  const codes: string[] = [];
  const withTokens = text.replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  return escapeHtml(withTokens)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_(.+?)_(?=$|[\s).,;:])/g, '$1<em>$2</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, i: string) => codes[Number(i)]);
}

/**
 * Block Markdown: headings (### and lower), nested "- " lists (2-space indents), paragraphs. With `topLevel`, the
 * block's highest heading becomes that level and the rest follow, so headings never skip a level under the page's own
 * (a "####" right under an entry's h2 becomes an h3).
 */
export function renderBlocks(markdown: string, topLevel?: number): string {
  const headingLevels = [...markdown.matchAll(/^(#{3,6})\s/gm)].map((m) => m[1].length);
  const shift = topLevel && headingLevels.length ? topLevel - Math.min(...headingLevels) : 0;
  const out: string[] = [];
  const openLists: number[] = []; // indent of each open <ul>
  let paragraph: string[] = [];
  let itemOpen = false;

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const closeListsTo = (indent: number) => {
    while (openLists.length && openLists[openLists.length - 1] > indent) {
      out.push('</li></ul>');
      openLists.pop();
    }
  };
  const closeAllLists = () => {
    closeListsTo(-1);
    itemOpen = false;
  };

  for (const raw of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^(#{3,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeAllLists();
      const level = Math.max(2, Math.min(heading[1].length + shift, 6));
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      const indent = bullet[1].length;
      const top = openLists[openLists.length - 1];
      if (top === undefined || indent > top) {
        out.push('<ul><li>');
        openLists.push(indent);
      } else {
        closeListsTo(indent);
        out.push('</li><li>');
      }
      out.push(renderInline(bullet[2]));
      itemOpen = true;
      continue;
    }

    // An indented line right after a list item continues that item.
    if (itemOpen && /^\s+/.test(line)) {
      out.push(' ' + renderInline(line.trim()));
      continue;
    }

    closeAllLists();
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeAllLists();
  return out.join('');
}

/** Splits the changelog into entries at its "## [version] — date — title" headings. */
export function parseChangelog(markdown: string): ChangelogEntry[] {
  const text = markdown.replace(/\r\n/g, '\n');
  const headingRe = /^## \[([^\]]+)\]\s+—\s+(.+?)\s+—\s+(.+)$/gm;
  const matches = [...text.matchAll(headingRe)];
  return matches.map((match, i) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end);
    const modMatch = body.match(/^### Mod data — (.+)$/m);
    const site = modMatch ? body.slice(0, modMatch.index) : body;
    const mod = modMatch ? body.slice((modMatch.index ?? 0) + modMatch[0].length) : '';
    return {
      version: match[1],
      date: match[2],
      title: match[3],
      // The entry's title is an h2 on the page, so its headings start at h3.
      html: renderBlocks(site, 3),
      modData: modMatch ? { title: modMatch[1], html: renderBlocks(mod, 3) } : undefined,
    };
  });
}

/** The text above the first version heading (the explanation of the numbering), as HTML. */
export function changelogIntro(markdown: string): string {
  const text = markdown.replace(/\r\n/g, '\n');
  const first = text.search(/^## \[/m);
  return renderBlocks(
    text
      .slice(0, first === -1 ? text.length : first)
      .replace(/^# .*$/m, '')
      .trim(),
  );
}
