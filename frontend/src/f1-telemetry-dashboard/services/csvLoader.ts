// Simple CSV loader that returns array of row objects keyed by header
export async function loadCsvRows(relPath: string): Promise<Record<string, string>[]> {
  // Resolve path relative to the module using import.meta.url for Vite-compatible bundling
  // Accept relative paths like "../data/combined_race.csv"; avoid leading slash which would resolve to root
  const url = new URL(relPath, import.meta.url).href;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load CSV at ${relPath}: ${res.status}`);
  const text = await res.text();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  // Normalize headers to a predictable format so downstream mapping is robust to casing and spaces
  const rawHeaders = parseCSVRow(lines[0]);
  const headers = rawHeaders.map(h => normalizeHeader(h));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] ?? '';
    }
    rows.push(obj);
  }
  return rows;
}

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

export default loadCsvRows;

function normalizeHeader(h: string): string {
  return h.trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}
