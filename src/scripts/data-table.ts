/**
 * Shared data table functionality: column sorting, paging, section collapse/expand.
 * Used by troops, lords, armoury, and weaponry pages.
 *
 * Usage: import from any page script, then call initDataTables().
 */

/** Set up column sorting on all tables matching the selector. */
export function initSorting(tableSelector: string) {
  document.querySelectorAll(tableSelector).forEach((table) => {
    const headers = table.querySelectorAll('th[data-col]');
    const tbody = table.querySelector('tbody')!;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    let sortCol = '';
    let sortAsc = true;

    headers.forEach((th) => {
      th.addEventListener('click', () => {
        const col = (th as HTMLElement).dataset.col!;
        if (sortCol === col) {
          sortAsc = !sortAsc;
        } else {
          sortCol = col;
          sortAsc = true;
        }

        headers.forEach((h) => {
          const indicator = h.querySelector('.sort-indicator');
          if (indicator) indicator.remove();
        });
        const indicator = document.createElement('span');
        indicator.className = 'sort-indicator';
        indicator.textContent = sortAsc ? '\u25B2' : '\u25BC';
        th.appendChild(indicator);

        const colIndex = Array.from(headers).indexOf(th);
        const isNumeric = th.classList.contains('col-num');

        rows.sort((a, b) => {
          const aVal = (a as HTMLTableRowElement).cells[colIndex]?.textContent?.trim() || '';
          const bVal = (b as HTMLTableRowElement).cells[colIndex]?.textContent?.trim() || '';

          if (isNumeric) {
            const aNum = parseFloat(aVal) || 0;
            const bNum = parseFloat(bVal) || 0;
            return sortAsc ? aNum - bNum : bNum - aNum;
          }

          return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

        for (const row of rows) {
          tbody.appendChild(row);
        }
        table.dispatchEvent(new CustomEvent('datatable:sorted'));
      });
    });
  });
}

/** Set up section collapse/expand on all .section-toggle elements. */
export function initCollapse() {
  document.querySelectorAll('.section-toggle').forEach((title) => {
    title.addEventListener('click', () => {
      const section = title.closest('.collapsible-section') as HTMLElement;
      const wrapper = section.querySelector('.data-table-wrapper') as HTMLElement;
      const arrow = title.querySelector('.collapse-arrow')!;
      const collapsed = section.dataset.collapsed === 'true';
      section.dataset.collapsed = collapsed ? 'false' : 'true';
      wrapper.style.display = collapsed ? '' : 'none';
      arrow.textContent = collapsed ? '\u25BC' : '\u25B6';
    });
  });
}

/** Apply URL query params to filter controls. */
export function applyUrlParams(paramMap: Record<string, HTMLSelectElement | HTMLInputElement>) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, el] of Object.entries(paramMap)) {
    const val = params.get(key);
    if (val) el.value = val;
  }
}

export interface TablePager {
  /** Re-count the rows the filters left visible and redraw the controls (back to page 1 by default). */
  refresh(resetPage?: boolean): void;
}

/**
 * Show a table's rows in pages. Rows a filter hid (style.display = 'none') are left out; the rest are split into
 * pages and off-page rows get data-off-page (display: none in global.css), so the browser only lays out one page.
 * Call refresh() after filtering (or dispatch 'datatable:filtered' on the table); sorting refreshes it automatically.
 *
 * Without a fixed pageSize, each page holds as many rows as fit on screen below the fixed top bar (header row and
 * page buttons included), so the table never scrolls; the wrapper gets .is-paged, which removes its scroll box.
 */
export function initPager(tableSelector: string, fixedPageSize?: number): TablePager {
  const table = document.querySelector<HTMLTableElement>(tableSelector);
  const tbody = table?.tBodies[0];
  const wrapper = table?.closest<HTMLElement>('.data-table-wrapper');
  if (!table || !tbody || !wrapper) return { refresh() {} };

  const nav = document.createElement('nav');
  nav.className = 'table-pager';
  nav.setAttribute('aria-label', 'Table pages');
  wrapper.after(nav);
  wrapper.classList.add('is-paged');

  let page = 1;
  let pageSize = fixedPageSize ?? 20;
  let rowHeight = 0;
  // Only the table's own rows are paged. Rows added later (e.g. a lord's biography row) follow the row before them.
  const ownRows = new WeakSet(Array.from(tbody.rows));

  // With fewer rows shown the browser would narrow the columns (and wrap text, making rows taller), so every page
  // would have different column widths. Lock each column to its width with all rows shown, and use the usual row
  // height (95th percentile) for the rows-per-page sum. Skipped while the table is hidden (width 0); then measured
  // from the first page instead.
  function lockColumnsAndMeasure() {
    const headers = Array.from(table!.tHead?.rows[0]?.cells ?? []);
    const widths = headers.map((th) => th.getBoundingClientRect().width);
    if (!widths.length || widths.some((w) => w === 0)) return;
    // Table cells ignore min-width; a width on a header cell acts as the column's minimum in auto table layout.
    headers.forEach((th, i) => (th.style.width = `${Math.ceil(widths[i])}px`));
    rowHeight = rowPitch(Array.from(tbody!.rows));
  }

  /** Space one row takes, including any gap between rows (some tables use border-spacing). */
  function rowPitch(rows: HTMLTableRowElement[]) {
    const shown = rows.filter((row) => row.getBoundingClientRect().height > 0);
    if (shown.length < 2) return shown[0]?.getBoundingClientRect().height ?? 0;
    const first = shown[0].getBoundingClientRect();
    const last = shown[shown.length - 1].getBoundingClientRect();
    return (last.bottom - first.top) / shown.length;
  }
  lockColumnsAndMeasure();

  const topBarHeight = () => document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;

  /** Rows that fit between the top bar and the bottom of the window, after the header row and the page buttons. */
  function rowsThatFit() {
    if (fixedPageSize) return fixedPageSize;
    const headerHeight = table!.tHead?.getBoundingClientRect().height || 44;
    const navStyle = getComputedStyle(nav);
    const navHeight = (nav.getBoundingClientRect().height || 72) + parseFloat(navStyle.marginTop || '0');
    // 52px: gap under the top bar plus the wrapper's padding and borders, with a little to spare.
    const available = window.innerHeight - topBarHeight() - headerHeight - navHeight - 52;
    return Math.min(50, Math.max(5, Math.floor(available / (rowHeight || 44))));
  }

  /** Row pitch measured from the rows now on screen (used when the table was hidden at start). */
  function measureRowHeight() {
    return rowPitch(Array.from(tbody!.rows).filter((row) => ownRows.has(row) && !row.hasAttribute('data-off-page')));
  }

  function scrollTableIntoView() {
    const top = wrapper!.getBoundingClientRect().top + window.scrollY - topBarHeight() - 12;
    window.scrollTo({ top: Math.max(0, top) });
  }

  const pageButton = (label: string, target: number, opts: { current?: boolean; disabled?: boolean } = {}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = 'table-pager-button';
    if (opts.current) {
      button.classList.add('is-current');
      button.setAttribute('aria-current', 'page');
    }
    button.disabled = !!opts.disabled || !!opts.current;
    button.addEventListener('click', () => {
      page = target;
      render();
      scrollTableIntoView();
    });
    return button;
  };

  function render() {
    pageSize = rowsThatFit();
    draw();
    // If the table was hidden at start (no measurement yet), measure the page now on screen and redraw once.
    const measured = rowHeight ? 0 : measureRowHeight();
    if (!fixedPageSize && measured > 0) {
      rowHeight = measured;
      const firstShown = (page - 1) * pageSize;
      pageSize = rowsThatFit();
      page = Math.floor(firstShown / pageSize) + 1;
      draw();
    }
  }

  function draw() {
    const rows = Array.from(tbody!.rows);
    const matching = rows.filter((row) => ownRows.has(row) && row.style.display !== 'none');
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(Math.max(page, 1), pages);
    const first = (page - 1) * pageSize;
    const onPage = new Set(matching.slice(first, first + pageSize));

    let previousOff = false;
    for (const row of rows) {
      const off: boolean = ownRows.has(row) ? !onPage.has(row) : previousOff;
      row.toggleAttribute('data-off-page', off);
      if (ownRows.has(row)) previousOff = off;
    }

    nav.replaceChildren();
    nav.hidden = pages <= 1;
    if (pages <= 1) return;

    nav.append(pageButton('‹ Prev', page - 1, { disabled: page === 1 }));
    const numbers = document.createElement('span');
    numbers.className = 'table-pager-pages';
    let previous = 0;
    for (let n = 1; n <= pages; n++) {
      if (n !== 1 && n !== pages && Math.abs(n - page) > 2) continue;
      if (n - previous > 1) {
        const gap = document.createElement('span');
        gap.className = 'table-pager-gap';
        gap.textContent = '…';
        numbers.append(gap);
      }
      numbers.append(pageButton(String(n), n, { current: n === page }));
      previous = n;
    }
    nav.append(numbers, pageButton('Next ›', page + 1, { disabled: page === pages }));

    const info = document.createElement('span');
    info.className = 'table-pager-info';
    info.textContent = `Showing ${first + 1}–${Math.min(first + pageSize, matching.length)} of ${matching.length}`;
    nav.append(info);
  }

  // Sorting, and filter scripts that can't import this module (they dispatch 'datatable:filtered'), go back to page 1.
  for (const type of ['datatable:sorted', 'datatable:filtered']) {
    table.addEventListener(type, () => {
      page = 1;
      render();
    });
  }

  // A different window height fits a different number of rows; keep the first row on screen in view.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!table.isConnected) return;
      const firstShown = (page - 1) * pageSize;
      pageSize = rowsThatFit();
      page = Math.floor(firstShown / pageSize) + 1;
      draw();
    }, 150);
  });

  return {
    refresh(resetPage = true) {
      if (resetPage) page = 1;
      render();
    },
  };
}

/** Collect all rows from tables matching a selector. */
export function collectRows(tableSelector: string): HTMLTableRowElement[] {
  const rows: HTMLTableRowElement[] = [];
  document.querySelectorAll(tableSelector).forEach((t) => {
    rows.push(...Array.from(t.querySelectorAll<HTMLTableRowElement>('tbody tr')));
  });
  return rows;
}
