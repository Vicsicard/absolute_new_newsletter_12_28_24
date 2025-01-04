-- Function to drop constraints
CREATE OR REPLACE FUNCTION drop_constraints(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- Function to add constraints
CREATE OR REPLACE FUNCTION add_constraints(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql;
