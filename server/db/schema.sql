-- Sweety database schema
-- Safe to run more than once. The app deliberately uses plain SQL instead of
-- an ORM so the data model stays easy to inspect.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot TEXT NOT NULL CHECK (
    slot IN ('morning', 'after_breakfast', 'after_lunch', 'after_dinner')
  ),
  value INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT readings_one_per_slot UNIQUE (user_id, reading_date, slot)
);

CREATE INDEX IF NOT EXISTS readings_user_date_idx
  ON readings (user_id, reading_date DESC);
