-- Feedback storage. Visitor content is plain text; nothing here is ever rendered as HTML.
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'suggestion', 'idea', 'question', 'bug')),
  project TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'spam', 'removed')),
  title TEXT,
  message TEXT,
  display_name TEXT,
  email TEXT,
  details TEXT,
  reply TEXT,
  reply_at TEXT,
  message_hash TEXT,
  purged_at TEXT,
  -- A private report can never become public, even by a buggy or forged request.
  CHECK (NOT (visibility = 'private' AND status = 'approved'))
);
CREATE INDEX feedback_public ON feedback (status, visibility, project, created_at);
CREATE INDEX feedback_dupes ON feedback (message_hash, created_at);

-- Owner-only audit trail: what happened to which item and when. No visitor content.
CREATE TABLE moderation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id TEXT NOT NULL,
  action TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX moderation_log_item ON moderation_log (feedback_id);

-- Short-lived rate-limit events keyed by a salted hash of the client IP. Rows older than a day
-- are deleted on every write.
CREATE TABLE rate_events (
  key TEXT NOT NULL,
  kind TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX rate_events_lookup ON rate_events (kind, key, at);
