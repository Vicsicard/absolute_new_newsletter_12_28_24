-- Create transaction management functions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Start a new transaction
  BEGIN;
END;
$$;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Commit the current transaction
  COMMIT;
END;
$$;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Rollback the current transaction
  ROLLBACK;
END;
$$;

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION begin_transaction() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION commit_transaction() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rollback_transaction() TO authenticated, service_role;
