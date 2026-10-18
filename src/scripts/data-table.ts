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
 */
export function initPager(tableSelector: string, pageSize = 50): TablePager {
  const table = document.querySelector<HTMLTableElement>(tableSelector);
  const tbody = table?.tBodies[0];
  const wrapper = table?.closest('.data-table-wrapper');
  if (!table || !tbody || !wrapper) return { refresh() {} };

  const nav = document.createElement('nav');
  nav.className = 'table-pager';
  nav.setAttribute('aria-label', 'Table pages');
  wrapper.after(nav);

  let page = 1;
  // Only the table's own rows are paged. Rows added later (e.g. a lord's biography row) follow the row before them.
  const ownRows = new WeakSet(Array.from(tbody.rows));

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
      wrapper.scrollTop = 0;
    });
    return button;
  };

  function render() {
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
