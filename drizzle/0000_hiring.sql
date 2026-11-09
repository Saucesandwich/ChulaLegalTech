CREATE TABLE hiring_jobs (
  id TEXT PRIMARY KEY,
  occupation TEXT NOT NULL,
  district TEXT NOT NULL,
  shift TEXT NOT NULL,
  evidence TEXT NOT NULL,
  retain_days INTEGER NOT NULL CHECK (retain_days IN (0, 7, 30)),
  selection_end INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE hiring_verifications (
  category TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'revise')),
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE hiring_cases (
  job_id TEXT PRIMARY KEY REFERENCES hiring_jobs(id),
  status TEXT NOT NULL CHECK (status IN ('review', 'clear', 'hold', 'applied')),
  updated_at INTEGER NOT NULL
);
