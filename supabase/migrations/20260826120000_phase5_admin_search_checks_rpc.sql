-- Admin dashboard's paginated/searchable check lists (To-Do / In Progress /
-- History). PostgREST's .or() can't combine a condition on the base table
-- with conditions on two different embedded tables in one query, and the
-- search box needs to match tenant name (checks), address (properties), and
-- landlord name (profiles) all at once — so this is a single SQL query
-- instead of client-composed PostgREST filters, same pattern as ship_check /
-- submit_application. count(*) over() returns the total alongside the page
-- so the caller doesn't need a second round trip for pagination.
create function public.admin_search_checks(
  p_query text default null,
  p_statuses text[] default null,
  p_limit int default 20,
  p_offset int default 0,
  p_sort_desc boolean default false
)
returns table (
  id uuid,
  tenant_full_name text,
  status text,
  created_at timestamptz,
  property_label text,
  landlord_name text,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.tenant_full_name,
    c.status,
    c.created_at,
    p.label as property_label,
    pr.full_name as landlord_name,
    count(*) over() as total_count
  from public.checks c
  join public.properties p on p.id = c.property_id
  join public.profiles pr on pr.id = c.landlord_id
  where public.is_admin()
    and (p_statuses is null or c.status = any(p_statuses))
    and (
      p_query is null or btrim(p_query) = '' or
      c.tenant_full_name ilike '%' || p_query || '%' or
      p.label ilike '%' || p_query || '%' or
      p.address_line1 ilike '%' || p_query || '%' or
      pr.full_name ilike '%' || p_query || '%'
    )
  order by
    (case when p_sort_desc then c.created_at end) desc nulls last,
    (case when not p_sort_desc then c.created_at end) asc nulls last
  limit p_limit offset p_offset;
$$;

grant execute on function public.admin_search_checks(text, text[], int, int, boolean) to authenticated;
