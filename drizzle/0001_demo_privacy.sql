ALTER TABLE hiring_jobs ADD COLUMN demo_space TEXT NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
CREATE INDEX hiring_jobs_by_space ON hiring_jobs (demo_space, created_at);
--> statement-breakpoint
CREATE TABLE demo_verifications (
  demo_space TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'revise')),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (demo_space, category)
);
--> statement-breakpoint
CREATE TABLE demo_rights_requests (
  id TEXT PRIMARY KEY,
  demo_space TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'erased')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX demo_pending_request ON demo_rights_requests (demo_space, kind) WHERE status = 'pending';
