-- Performance fix for the admin To-Do/In Progress/History tabs and search
-- box (admin_search_checks, 20260826120000): checks.status had no index at
-- all, so every tab switch forced a sequential scan + join across checks/
-- properties/profiles, and the free-text search's leading-wildcard ilike
-- couldn't use a plain btree index either. Both turn into multi-second-plus
-- stalls once the checks table has any real volume — invisible on a small
-- dev seed, but reproducible on every navigation as it grows.

create index checks_status_created_at_idx on public.checks (status, created_at);

create extension if not exists pg_trgm;

create index checks_tenant_full_name_trgm_idx
  on public.checks using gin (tenant_full_name gin_trgm_ops);

create index properties_label_trgm_idx
  on public.properties using gin (label gin_trgm_ops);

create index properties_address_line1_trgm_idx
  on public.properties using gin (address_line1 gin_trgm_ops);

create index profiles_full_name_trgm_idx
  on public.profiles using gin (full_name gin_trgm_ops);
