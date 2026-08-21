-- Bug: the tenant on a check could read neither their own `payments` row
-- nor the `properties` row it's tied to — both policies only considered
-- the landlord/admin perspective. Concretely this meant the payment page
-- silently rendered an "amount" of 0 (payment fetch returned nothing
-- under RLS) and PayFast rejected the resulting form with "Amount must
-- be a valid payment amount." Caught by actually driving the tenant
-- flow through a live PayFast sandbox submission.

create policy "payments_select_tenant" on public.payments
  for select using (public.is_tenant_of_check(check_id));

create policy "properties_select_tenant" on public.properties
  for select using (
    exists (
      select 1 from public.checks c
      where c.property_id = properties.id and c.tenant_id = auth.uid()
    )
  );
