-- ================================================
-- ZIVA BI — AUTH MODULE TABLES
-- refresh_tokens, otp_codes, sessions
-- Compatible with PostgreSQL 14+ (Render DB)
-- ================================================

-- ==========================
-- 1. REFRESH TOKENS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_tenant_id UUID NULL,
    token_hash VARCHAR(512) NULL,

    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_tenant
    ON refresh_tokens (user_tenant_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
    ON refresh_tokens (expires_at);

-- Optional FK (safe mode):
-- ALTER TABLE refresh_tokens
--   ADD CONSTRAINT fk_refresh_user_tenant
--   FOREIGN KEY (user_tenant_id)
--   REFERENCES user_tenants (id)
--   ON DELETE SET NULL;

-- ==========================
-- 2. OTP CODES TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NULL,
    subject VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    purpose VARCHAR(50) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_subject
    ON otp_codes (subject);

CREATE INDEX IF NOT EXISTS idx_otp_purpose
    ON otp_codes (purpose);

CREATE INDEX IF NOT EXISTS idx_otp_expires
    ON otp_codes (expires_at);

-- ==========================
-- 3. SESSIONS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_tenant_id UUID NULL,
    refresh_token_id UUID NULL,

    ip VARCHAR(100) NULL,
    user_agent VARCHAR(255) NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_tenant
    ON sessions (user_tenant_id);

CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token
    ON sessions (refresh_token_id);

-- Optional FKs:
-- ALTER TABLE sessions
--   ADD CONSTRAINT fk_session_user_tenant
--   FOREIGN KEY (user_tenant_id)
--   REFERENCES user_tenants (id)
--   ON DELETE SET NULL;

-- ALTER TABLE sessions
--   ADD CONSTRAINT fk_session_refresh_token
--   FOREIGN KEY (refresh_token_id)
--   REFERENCES refresh_tokens (id)
--   ON DELETE SET NULL;

-- ==========================
-- END OF MIGRATION
-- ==========================