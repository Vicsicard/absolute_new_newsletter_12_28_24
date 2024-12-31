-- Create function to safely acquire next queue item
create or replace function acquire_next_queue_item()
returns jsonb
language plpgsql
as $$
declare
  item_record record;
begin
  -- Lock the row and get the next pending item
  with next_item as (
    select *
    from newsletter_generation_queue
    where status = 'pending'
    order by created_at asc
    limit 1
    for update skip locked
  )
  update newsletter_generation_queue q
  set 
    status = 'in_progress',
    updated_at = now()
  from next_item
  where q.id = next_item.id
  returning q.* into item_record;

  -- Return null if no item found
  if item_record is null then
    return null;
  end if;

  -- Return the item as JSON
  return row_to_json(item_record)::jsonb;
end;
$$;
