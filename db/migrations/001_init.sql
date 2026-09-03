-- Users and news.
--
-- Accounts are invite-only: there is no public sign-up, so a row only exists
-- because an existing admin created it. `invited_by` records who, which is what
-- makes that auditable rather than merely stated.

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'editor',
  -- scrypt, stored as: scrypt$N$r$p$<salt-hex>$<hash-hex>. Salted and slow by
  -- design; the previous scheme was a bare unsalted SHA-256, which is neither.
  password_hash TEXT        NOT NULL,
  -- Only approvers may decide a Tier 2 change request.
  can_approve   BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  invited_by    BIGINT      REFERENCES users(id) ON DELETE SET NULL,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive lookup: nobody should be locked out by a capital letter.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

CREATE TABLE IF NOT EXISTS news (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug         TEXT        NOT NULL UNIQUE,
  title        TEXT        NOT NULL,
  summary      TEXT        NOT NULL DEFAULT '',
  body         TEXT        NOT NULL DEFAULT '',
  -- 'draft' or 'published'. The public site only ever reads 'published'.
  status       TEXT        NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  author_id    BIGINT      REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT news_status_valid CHECK (status IN ('draft', 'published')),
  -- A published row must carry its date; the site orders and labels by it.
  CONSTRAINT news_published_has_date CHECK (status <> 'published' OR published_at IS NOT NULL)
);

-- The public query is "published, newest first" — index exactly that.
CREATE INDEX IF NOT EXISTS news_published_idx
  ON news (published_at DESC) WHERE status = 'published';
