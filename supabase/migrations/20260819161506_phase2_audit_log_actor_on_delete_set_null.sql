-- Bug: audit_log.actor_id and checks.shipped_by referenced profiles with
-- the default NO ACTION behavior, which blocks deleting ANY user who ever
-- triggered an audit log entry (i.e. almost anyone) or shipped a check.
-- That's both a practical nuisance and a POPIA right-to-erasure problem —
-- the audit trail itself should survive account deletion (that's the
-- point of an audit log), so the actor reference should go null instead
-- of blocking the delete.

alter table public.audit_log
  drop constraint audit_log_actor_id_fkey,
  add constraint audit_log_actor_id_fkey
    foreign key (actor_id) references public.profiles (id) on delete set null;

alter table public.checks
  drop constraint checks_shipped_by_fkey,
  add constraint checks_shipped_by_fkey
    foreign key (shipped_by) references public.profiles (id) on delete set null;
