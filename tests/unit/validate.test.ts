import { describe, it, expect } from 'vitest';
import { validateFeedback, cleanText, countLinks } from '../../functions/_lib/validate';
import { LIMITS } from '../../functions/_lib/rules';

const ids = ['kitt-launcher', 'retrotv', 'blackbox'];
const base = {
  type: 'comment',
  project: 'retrotv',
  visibility: 'public',
  message: 'Works great on my Shield TV.',
};

describe('validateFeedback', () => {
  it('accepts a minimal valid submission', () => {
    const r = validateFeedback(base, ids);
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(r.value).toMatchObject({
        type: 'comment',
        project: 'retrotv',
        visibility: 'public',
        title: null,
        email: null,
      });
  });

  it('accepts the website itself as the subject', () => {
    expect(validateFeedback({ ...base, project: 'site' }, ids).ok).toBe(true);
  });

  it.each([
    ['type', { type: 'praise' }],
    ['project', { project: 'not-a-project' }],
    ['visibility', { visibility: 'everyone' }],
    ['message', { message: 'short' }],
    ['message', { message: 'x'.repeat(LIMITS.message + 1) }],
    ['title', { title: 't'.repeat(LIMITS.title + 1) }],
    ['displayName', { displayName: 'n'.repeat(LIMITS.name + 1) }],
    ['email', { email: 'not-an-email' }],
    ['email', { email: 'a@b' }],
  ])('rejects bad %s', (field, patch) => {
    const r = validateFeedback({ ...base, ...patch }, ids);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[field]).toBeTruthy();
  });

  it('rejects link-stuffed messages', () => {
    const msg = Array.from(
      { length: LIMITS.maxLinks + 1 },
      (_, i) => `https://spam${i}.example`,
    ).join(' ');
    const r = validateFeedback({ ...base, message: msg }, ids);
    expect(r.ok).toBe(false);
  });

  it('ignores the display name when posting anonymously', () => {
    const r = validateFeedback({ ...base, displayName: 'Travis Fan', anonymous: '1' }, ids);
    expect(r.ok && r.value.displayName).toBe(null);
  });

  it('keeps bug details only for bug reports', () => {
    const bug = validateFeedback(
      { ...base, type: 'bug', appVersion: '1.2', actual: 'Crashes on launch' },
      ids,
    );
    expect(bug.ok && bug.value.details).toEqual({ appVersion: '1.2', actual: 'Crashes on launch' });
    const comment = validateFeedback({ ...base, appVersion: '1.2' }, ids);
    expect(comment.ok && comment.value.details).toBe(null);
  });

  it('treats non-string input as empty instead of crashing', () => {
    const r = validateFeedback(
      { type: ['comment'], project: { a: 1 }, message: 12345678901 } as Record<string, unknown>,
      ids,
    );
    expect(r.ok).toBe(false);
  });

  it('stores HTML as inert text (escaping happens at output)', () => {
    const r = validateFeedback(
      { ...base, message: '<img src=x onerror=alert(1)> hello there' },
      ids,
    );
    expect(r.ok && r.value.message).toBe('<img src=x onerror=alert(1)> hello there');
  });
});

describe('cleanText', () => {
  it('strips control and bidi characters but keeps newlines', () => {
    expect(cleanText('a\u0000b‮c\r\nd​e')).toBe('abc\nde');
  });
  it('normalises to NFC and trims', () => {
    expect(cleanText('  café  ')).toBe('café');
  });
});

describe('countLinks', () => {
  it('counts http(s) and www links', () => {
    expect(countLinks('see https://a.com and www.b.com and http://c')).toBe(3);
  });
});
