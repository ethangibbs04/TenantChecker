-- Phase 7: notification logging helper, mirrors log_audit()'s shape so
-- server-side code (actions, route handlers) can record a `notifications`
-- row regardless of which party is the *actor* vs the *recipient* — e.g.
-- a tenant submitting consent needs to log a notification whose
-- recipient is the landlord, which a plain RLS insert policy scoped to
-- auth.uid() couldn't express without opening the table up broadly.
-- SECURITY DEFINER sidesteps that the same way log_audit() already does
-- for audit_log. p_recipient_id is nullable — e.g. the very first
-- "consent requested" email goes to a tenant who hasn't accepted the
-- invite (and so has no profiles row) yet.

create function public.log_notification(
  p_check_id uuid,
  p_recipient_id uuid,
  p_channel text,
  p_template text,
  p_status text default 'sent'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (check_id, recipient_id, channel, template, status, sent_at)
  values (
    p_check_id, p_recipient_id, p_channel, p_template, p_status,
    case when p_status = 'sent' then now() else null end
  )
  returning id into v_id;
  return v_id;
end;
$$;
