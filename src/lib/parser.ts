export interface ParsedItem {
  id: string; // Temporary unique id
  rawLine: string;
  quantity: number;
  name: string;
  price: number;
  status: 'new' | 'existing';
  dbProductId?: string;
  sku?: string;
  category?: string;
  error?: string;
}

export function parseRawList(rawText: string): ParsedItem[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items: ParsedItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Attempt to split by tab (Excel/Sheets) first
    let parts = line.split('\t').map(p => p.trim()).filter(p => p);
    
    // If not tab-separated, try a regex to find numbers at start and end
    if (parts.length < 2) {
      // Look for: (Number) (Text) (Number)
      const regex = /^(\d+)\s+(.+?)(?:\s+([\d.,]+))?$/;
      const match = line.match(regex);
      if (match) {
        parts = [match[1], match[2], match[3] || '0'];
      } else {
        // Fallback: Just mark whole thing as name, qty 1, price 0
        parts = ['1', line, '0'];
      }
    }

    let qtyStr = parts[0];
    let nameStr = parts[1] || '';
    let priceStr = parts[2] || '0';

    // If Excel pasted like "Name \t Qty \t Price", qty and name might be swapped
    if (isNaN(Number(qtyStr)) && !isNaN(Number(nameStr))) {
      const temp = qtyStr;
      qtyStr = nameStr;
      nameStr = temp;
    }

    const qty = parseInt(qtyStr.replace(/,/g, ''), 10) || 1;
    // Remove S/ or $ from price and convert to float
    const cleanPrice = priceStr.replace(/[S/$€a-zA-Z\s]/g, '').replace(',', '.');
    const price = parseFloat(cleanPrice) || 0;

    items.push({
      id: `parsed-${i}-${Date.now()}`,
      rawLine: line,
      quantity: qty,
      name: nameStr,
      price: price,
      status: 'new', // will be updated when checked against DB
    });
  }

  return items;
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1) // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function findBestMatch(target: string, candidates: { id: string, name: string }[]): { id: string, name: string } | null {
  if (!candidates.length) return null;
  const lowerTarget = target.toLowerCase();
  
  // 1. Try exact match
  const exact = candidates.find(c => c.name.toLowerCase() === lowerTarget);
  if (exact) return exact;

  // 2. Try substring match
  const substring = candidates.find(c => c.name.toLowerCase().includes(lowerTarget) || lowerTarget.includes(c.name.toLowerCase()));
  if (substring) return substring;

  // 3. Try fuzzy match
  let bestMatch = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const dist = levenshteinDistance(lowerTarget, candidate.name.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }

  // Threshold to avoid returning completely unrelated things (max 4 typos/changes)
  if (minDistance <= 4) {
    return bestMatch;
  }

  return null;
}
