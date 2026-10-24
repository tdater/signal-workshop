import { LIMITS, FEEDBACK_TYPE_IDS, type FeedbackType } from './rules';

export interface FeedbackInput {
  type: FeedbackType;
  project: string;
  visibility: 'public' | 'private';
  title: string | null;
  message: string;
  displayName: string | null;
  email: string | null;
  details: {
    appVersion?: string;
    device?: string;
    expected?: string;
    actual?: string;
    steps?: string;
  } | null;
}

export type Validation =
  { ok: true; value: FeedbackInput } | { ok: false; errors: Record<string, string> };

// Normalise visitor text: Unicode NFC, unify newlines, drop control and invisible formatting
// characters (keeping \n and \t), trim. The result is stored and later shown as plain text only.
export function cleanText(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g, '')
    .trim();
}

const EMAIL =
  /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function countLinks(text: string) {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

export function validateFeedback(
  form: Record<string, unknown>,
  projectIds: readonly string[],
): Validation {
  const errors: Record<string, string> = {};
  const type = cleanText(form.type);
  const project = cleanText(form.project);
  const visibility = cleanText(form.visibility) || 'public';
  const title = cleanText(form.title);
  const message = cleanText(form.message);
  const anonymous = cleanText(form.anonymous) === '1';
  const displayName = anonymous ? '' : cleanText(form.displayName).replace(/\s+/g, ' ');
  const email = cleanText(form.email);

  if (!FEEDBACK_TYPE_IDS.includes(type)) errors.type = 'Choose what kind of feedback this is.';
  if (project !== 'site' && !projectIds.includes(project))
    errors.project = 'Choose which project this is about.';
  if (visibility !== 'public' && visibility !== 'private')
    errors.visibility = 'Choose public or private.';
  if (title.length > LIMITS.title)
    errors.title = `Keep the title under ${LIMITS.title} characters.`;
  if (message.length < LIMITS.messageMin)
    errors.message = `Write at least ${LIMITS.messageMin} characters in the message.`;
  else if (message.length > LIMITS.message)
    errors.message = `Keep the message under ${LIMITS.message} characters.`;
  else if (countLinks(message) > LIMITS.maxLinks)
    errors.message = `Please include no more than ${LIMITS.maxLinks} links.`;
  if (displayName.length > LIMITS.name)
    errors.displayName = `Keep the display name under ${LIMITS.name} characters.`;
  if (email && (email.length > LIMITS.email || !EMAIL.test(email)))
    errors.email = 'Enter a valid email address, or leave it empty.';

  let details: FeedbackInput['details'] = null;
  if (type === 'bug') {
    const d = {
      appVersion: cleanText(form.appVersion),
      device: cleanText(form.device),
      expected: cleanText(form.expected),
      actual: cleanText(form.actual),
      steps: cleanText(form.steps),
    };
    for (const [k, v] of Object.entries(d)) {
      const max = k === 'appVersion' || k === 'device' ? LIMITS.short : LIMITS.detail;
      if (v.length > max) errors[k] = `Keep this field under ${max} characters.`;
    }
    const filled = Object.fromEntries(Object.entries(d).filter(([, v]) => v));
    details = Object.keys(filled).length ? filled : null;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      type: type as FeedbackType,
      project,
      visibility: visibility as 'public' | 'private',
      title: title || null,
      message,
      displayName: displayName || null,
      email: email || null,
      details,
    },
  };
}
