CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requester TEXT NOT NULL DEFAULT 'anonymous',
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','pending_triage','triaged','merged','planned','declined','shipped')),
  problem_statement TEXT,
  persona TEXT,
  product_area TEXT,
  priority_score REAL,
  priority_rationale TEXT,
  theme_id INTEGER REFERENCES themes(id),
  canonical_request_id INTEGER REFERENCES requests(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  triaged_at TEXT
);

CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','proposed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS request_links (
  request_id INTEGER NOT NULL REFERENCES requests(id),
  related_request_id INTEGER NOT NULL REFERENCES requests(id),
  kind TEXT NOT NULL CHECK (kind IN ('duplicate','related')),
  confidence REAL NOT NULL,
  decided_by TEXT NOT NULL CHECK (decided_by IN ('ai','human')),
  PRIMARY KEY (request_id, related_request_id)
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES requests(id),
  voter TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (request_id, voter)
);

CREATE TABLE IF NOT EXISTS review_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('merge','new_theme')),
  request_id INTEGER NOT NULL REFERENCES requests(id),
  payload TEXT NOT NULL, -- JSON: MergeProposal | NewThemeProposal
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS briefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes(id),
  content_md TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS ai_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage TEXT NOT NULL CHECK (stage IN ('triage','brief')),
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('ok','invalid_output','error')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_theme ON requests(theme_id);
CREATE INDEX IF NOT EXISTS idx_requests_canonical ON requests(canonical_request_id);
CREATE INDEX IF NOT EXISTS idx_votes_request ON votes(request_id);
CREATE INDEX IF NOT EXISTS idx_review_status ON review_items(status);

-- Lexical candidate retrieval for the dedupe stage.
CREATE VIRTUAL TABLE IF NOT EXISTS requests_fts USING fts5(
  title, description, problem_statement,
  content='requests', content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS requests_ai AFTER INSERT ON requests BEGIN
  INSERT INTO requests_fts(rowid, title, description, problem_statement)
  VALUES (new.id, new.title, new.description, new.problem_statement);
END;

CREATE TRIGGER IF NOT EXISTS requests_ad AFTER DELETE ON requests BEGIN
  INSERT INTO requests_fts(requests_fts, rowid, title, description, problem_statement)
  VALUES ('delete', old.id, old.title, old.description, old.problem_statement);
END;

CREATE TRIGGER IF NOT EXISTS requests_au AFTER UPDATE ON requests BEGIN
  INSERT INTO requests_fts(requests_fts, rowid, title, description, problem_statement)
  VALUES ('delete', old.id, old.title, old.description, old.problem_statement);
  INSERT INTO requests_fts(rowid, title, description, problem_statement)
  VALUES (new.id, new.title, new.description, new.problem_statement);
END;
