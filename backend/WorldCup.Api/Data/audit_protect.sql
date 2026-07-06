-- Optional but recommended: run this once against the Postgres DB to make the audit_log
-- table append-only at the database level, so even direct DB access (not just the API)
-- can't quietly edit or delete history without it being obvious.
--
-- This is the practical, low-latency alternative to putting the ledger on a real blockchain:
-- Postgres itself refuses the mutation, and AuditChainService's hash chain independently
-- proves nothing was tampered with even if someone disabled this trigger.

CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: % not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON "AuditLog";
CREATE TRIGGER audit_log_no_update
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
