// simple phone normalization helper
export function normalizePhone(raw) {
  if (!raw) return '';
  let p = String(raw).trim();
  // remove all non-digit chars
  p = p.replace(/[^0-9+]/g, '');
  // if starts with +, remove + and keep digits
  if (p.startsWith('+')) p = p.slice(1);
  // remove leading zeros and convert to country code 62 if starts with 0 (Indonesia)
  if (p.startsWith('0')) {
    p = '62' + p.slice(1);
  }
  return p;
 }
