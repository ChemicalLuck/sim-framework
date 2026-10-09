import { describe, expect, it } from 'vitest';

import { tokenize } from './tokenizer';

describe('tokenize string literals', () => {
  it('reads plain strings', () => {
    expect(tokenize("'cafe'")).toEqual([{ type: 'string', value: 'cafe' }]);
  });

  it('unescapes an escaped quote without ending the string', () => {
    expect(tokenize("'it\\'s'")).toEqual([{ type: 'string', value: "it's" }]);
    expect(tokenize('"say \\"hi\\""')).toEqual([
      { type: 'string', value: 'say "hi"' },
    ]);
  });

  it('unescapes an escaped backslash', () => {
    expect(tokenize("'a\\\\b'")).toEqual([{ type: 'string', value: 'a\\b' }]);
  });

  it('continues tokenizing after an escaped string', () => {
    expect(tokenize("location == 'it\\'s' && money > 1")).toHaveLength(7);
  });

  it('rejects an unterminated string', () => {
    expect(() => tokenize("'open\\'")).toThrow(/Unterminated/);
  });
});
