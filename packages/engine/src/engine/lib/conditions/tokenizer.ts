export type Token =
  | { type: 'identifier'; value: string }
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'operator'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' };

export const OPERATORS = ['<=', '>=', '==', '!=', '<', '>', '&&', '||'];

export function tokenize(input: string): Token[] {
  const out: Token[] = [];
  const s = input;
  let i = 0;

  const isDigit = (c: string) => /[0-9]/.test(c);
  const isIdentStart = (c: string) => /[a-zA-Z_]/.test(c);
  const isIdentChar = (c: string) => /[a-zA-Z0-9_.]/.test(c);

  while (i < s.length) {
    const ch = s[i];

    // whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // parentheses
    if (ch === '(') {
      out.push({ type: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      out.push({ type: 'rparen' });
      i++;
      continue;
    }

    // string literal (single or double quotes)
    if (ch === `"` || ch === `'`) {
      const quote = ch;
      i++;
      let buf = '';
      let closed = false;
      while (i < s.length) {
        const c = s[i];
        if (c === '\\') {
          const next = s[i + 1];
          buf += next;
          i += 2;
        }
        if (c === quote) {
          closed = true;
          i++;
          break;
        }
        buf += c;
        i++;
      }
      if (!closed) throw new Error('Unterminated string literal in condition');
      out.push({ type: 'string', value: buf });
      continue;
    }

    // operators: try 2-char then 1-char
    const two = s.slice(i, i + 2);
    if (OPERATORS.includes(two)) {
      out.push({ type: 'operator', value: two });
      i += 2;
      continue;
    }
    if (OPERATORS.includes(ch)) {
      out.push({ type: 'operator', value: ch });
      i++;
      continue;
    }

    // number (integer or float)
    if (isDigit(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const raw = s.slice(i, j);
      const num = Number(raw);
      if (Number.isNaN(num)) throw new Error(`Invalid number literal: ${raw}`);
      out.push({ type: 'number', value: num });
      i = j;
      continue;
    }

    // identifier
    if (isIdentStart(ch)) {
      let j = i;
      while (j < s.length && isIdentChar(s[j])) j++;
      const id = s.slice(i, j);
      out.push({ type: 'identifier', value: id });
      i = j;
      continue;
    }

    throw new Error(
      `Unknown character in condition DSL: '${ch}' at ${i.toString()}`,
    );
  }
  return out;
}
