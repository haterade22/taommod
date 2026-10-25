/**
 * /lords-bios.json: every lord's biography in the /lords table's row order, loaded by that page after it has
 * appeared (the biographies used to be in every row, about half of the page's download). `ids` lets the page check
 * that each row still matches.
 */
import { sortTableLords, visibleLords } from '../lib/lords-table';

export function GET() {
  const lords = sortTableLords(visibleLords());
  const body = JSON.stringify({ ids: lords.map((l) => l.id), bios: lords.map((l) => l.biography || '') });
  return new Response(body, { headers: { 'Content-Type': 'application/json' } });
}
