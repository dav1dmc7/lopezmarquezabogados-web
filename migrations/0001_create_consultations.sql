CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  locale TEXT NOT NULL,
  area TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  relevant_date TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'website'
);

CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
