
ALTER TABLE drgreen_clients
  ADD COLUMN IF NOT EXISTS old_drgreen_client_id TEXT,
  ADD COLUMN IF NOT EXISTS rehome_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS rehome_error TEXT,
  ADD COLUMN IF NOT EXISTS rehomed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS api_key_scope TEXT;
