-- Create trigger function to create queue items when a newsletter is created
CREATE OR REPLACE FUNCTION create_initial_queue_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create queue items for each section type with matching section numbers
  INSERT INTO newsletter_generation_queue (
    newsletter_id, 
    section_type,
    section_number,
    status,
    attempts,
    created_at,
    updated_at
  )
  VALUES
    (NEW.id, 'welcome', 1, 'pending', 0, NOW(), NOW()),
    (NEW.id, 'industry_trends', 2, 'pending', 0, NOW(), NOW()),
    (NEW.id, 'practical_tips', 3, 'pending', 0, NOW(), NOW());

  -- Create corresponding newsletter sections
  INSERT INTO newsletter_sections (
    newsletter_id,
    section_number,
    section_type,
    status,
    created_at,
    updated_at
  )
  VALUES
    (NEW.id, 1, 'welcome', 'pending', NOW(), NOW()),
    (NEW.id, 2, 'industry_trends', 'pending', NOW(), NOW()),
    (NEW.id, 3, 'practical_tips', 'pending', NOW(), NOW());

  -- Update newsletter status
  UPDATE newsletters 
  SET 
    status = 'draft',
    draft_status = 'draft',
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger on newsletters table
DROP TRIGGER IF EXISTS tr_create_newsletter_queue_items ON newsletters;
CREATE TRIGGER tr_create_newsletter_queue_items
  AFTER INSERT ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_queue_items();
