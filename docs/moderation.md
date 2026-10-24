# Moderating feedback

## How it works

- Every submission is stored in D1 as **pending**. Nothing appears on the site until you approve
  it.
- Visitors choose **public** (may appear after approval) or **private** (only you ever see it).
  Private reports can never be approved: the database has a CHECK constraint and the API refuses.
- Reply emails, bug details (device, Android version, app version) and moderation history are
  never returned by the public API.
- Retention: rejected and spam items have their content erased after 30 days; reply emails are
  erased from every item after 90 days. The purge runs automatically on submissions and admin
  requests, and you can run it from `/admin`.

## Signing in

Go to `/admin` and enter the moderation password. The session lasts 8 hours in an HttpOnly,
Secure, SameSite=Strict cookie. More than five sign-in attempts in 15 minutes from one network are
refused until the window passes.

Forgot the password, or want to change it:

```sh
npm run admin:hash
npx wrangler pages secret put ADMIN_PASSWORD_HASH --project-name signal-workshop
```

No Node.js handy? The same hash can be made in any browser: open the site, press F12 → Console,
paste the snippet below, and enter the new password in the popup. It prints
`ADMIN_PASSWORD_HASH` (plus fresh `SESSION_SECRET` and `IP_HASH_SALT` values). Add them in the
Cloudflare dashboard under signal-workshop → Settings → Variables and Secrets as type Secret, then
push any commit (or retry the latest deployment) so they take effect. The password never leaves the
browser.

```js
(async () => {
  const pw = prompt('Admin password (12+ chars)');
  if (!pw || pw.length < 12) return console.log('Too short');
  const e = new TextEncoder(),
    b = (a) =>
      btoa(String.fromCharCode(...a))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
  const s = crypto.getRandomValues(new Uint8Array(16));
  const k = await crypto.subtle.importKey('raw', e.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const h = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: s, iterations: 100000 },
      k,
      256,
    ),
  );
  console.log('ADMIN_PASSWORD_HASH\n' + `pbkdf2-sha256$100000$${b(s)}$${b(h)}`);
  console.log('SESSION_SECRET\n' + b(crypto.getRandomValues(new Uint8Array(48))));
  console.log('IP_HASH_SALT\n' + b(crypto.getRandomValues(new Uint8Array(32))));
})();
```

To sign out every session at once, change `SESSION_SECRET` the same way
(`openssl rand -base64 48 | npx wrangler pages secret put SESSION_SECRET --project-name signal-workshop`).

## Actions

| Status   | Actions available                                          |
| -------- | ---------------------------------------------------------- |
| pending  | Approve (public only), Reject, Mark spam, Remove and erase |
| approved | Hide, Remove and erase                                     |
| hidden   | Approve, Remove and erase                                  |
| rejected | Back to pending, Remove and erase                          |
| spam     | Back to pending, Remove and erase                          |
| removed  | none (content is already erased)                           |

- **Reply** on a public item shows under the approved comment. On a private report it is only a
  note for you.
- **Remove and erase** wipes the title, message, name, email, details and reply. A tombstone row
  and the audit trail (action + time) stay. This can't be undone.
- Use the visibility filter to work through private bug reports separately.

## What to approve

The public rules are on `/community-guidelines`. In short: approve on-topic comments,
suggestions, questions and bug reports that don't include personal data, abuse, spam or links to
pirated material. When a public comment contains someone's personal data, reject it (or remove
it) rather than editing it; the site never edits visitor text.

## Spam limits (automatic)

- 5 submissions per 10 minutes and 20 per day per network (IP hashed with `IP_HASH_SALT`).
- The same message to the same project within 24 hours is refused as a duplicate.
- A hidden honeypot field, an Origin check, and a 5-link limit per message.

Limits live in `functions/_lib/rules.ts`, shared by the form and the server.

## Data requests

If someone asks for their submission to be deleted, find it by text or date in `/admin` and use
**Remove and erase**. For a full export of what's stored, see the backup command in
[deployment.md](deployment.md); exports contain emails, so keep them private.
