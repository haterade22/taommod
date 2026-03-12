/**
 * Shared data table functionality: column sorting, section collapse/expand.
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

/** Collect all rows from tables matching a selector. */
export function collectRows(tableSelector: string): HTMLTableRowElement[] {
  const rows: HTMLTableRowElement[] = [];
  document.querySelectorAll(tableSelector).forEach((t) => {
    rows.push(...Array.from(t.querySelectorAll('tbody tr')));
  });
  return rows;
}
