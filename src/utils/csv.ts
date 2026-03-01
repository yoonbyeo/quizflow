// ── CSV 가져오기 / 내보내기 유틸리티 ──

export interface CsvCard {
  term: string;
  definition: string;
  hint?: string;
}

/**
 * CSV 텍스트를 카드 배열로 파싱한다.
 * 지원 형식:
 *   용어,정의
 *   용어,정의,힌트
 *   탭 구분자(\t)도 지원
 *   첫 행이 헤더(term/용어/단어 등)면 자동 스킵
 */
export function parseCSV(text: string): CsvCard[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];

  // 구분자 자동 감지: 탭이 더 많으면 탭, 아니면 쉼표
  const firstLine = lines[0];
  const separator = (firstLine.match(/\t/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length ? '\t' : ',';

  // 헤더 스킵 감지 (첫 행에 'term', '용어', '단어', 'word' 등이 있으면)
  const HEADER_KEYWORDS = ['term', '용어', '단어', 'word', 'front', 'question'];
  const firstCols = parseLine(lines[0], separator);
  const hasHeader = firstCols.length > 0 && HEADER_KEYWORDS.some(k =>
    firstCols[0].toLowerCase().includes(k)
  );

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const cards: CsvCard[] = [];

  for (const line of dataLines) {
    const cols = parseLine(line, separator);
    if (cols.length < 2) continue;
    const term = cols[0].trim();
    const definition = cols[1].trim();
    const hint = cols[2]?.trim() || undefined;
    if (term && definition) {
      cards.push({ term, definition, hint });
    }
  }

  return cards;
}

function parseLine(line: string, sep: string): string[] {
  if (sep === '\t') return line.split('\t').map(c => c.trim());

  // CSV 파싱: 쉼표 구분, 쌍따옴표 처리
  const cols: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cols.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

/**
 * 카드 배열을 CSV 텍스트로 변환한다.
 */
export function cardsToCSV(cards: CsvCard[], _setTitle?: string): string {
  const header = '용어,정의,힌트';
  const rows = cards.map(c => [
    escapeCSV(c.term),
    escapeCSV(c.definition),
    escapeCSV(c.hint ?? ''),
  ].join(','));
  return [header, ...rows].join('\n');
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * CSV 파일을 브라우저에서 다운로드한다.
 */
export function downloadCSV(content: string, filename: string) {
  const bom = '\uFEFF'; // Excel 한글 깨짐 방지 BOM
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
