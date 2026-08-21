-- Same bug class as the earlier audit_log/checks.shipped_by fix, found
-- again while cleaning up test data: consents.tenant_id,
-- payments.landlord_id, application_forms.tenant_id, and
-- documents.uploaded_by all had the default NO ACTION behavior, which
-- blocks deleting any user who ever consented, paid, submitted an
-- application, or uploaded a document — i.e. nearly every real user.
-- These records should survive account deletion (consent proof, payment
-- records, submitted application content, upload provenance are exactly
-- the things you must NOT cascade-delete), they just shouldn't block the
-- delete. SET NULL on the actor reference, same as before. That requires
-- dropping NOT NULL on the three columns that had it.

alter table public.consents alter column tenant_id drop not null;
alter table public.consents
  drop constraint consents_tenant_id_fkey,
  add constraint consents_tenant_id_fkey
    foreign key (tenant_id) references public.profiles (id) on delete set null;

alter table public.payments alter column landlord_id drop not null;
alter table public.payments
  drop constraint payments_landlord_id_fkey,
  add constraint payments_landlord_id_fkey
    foreign key (landlord_id) references public.profiles (id) on delete set null;

alter table public.application_forms alter column tenant_id drop not null;
alter table public.application_forms
  drop constraint application_forms_tenant_id_fkey,
  add constraint application_forms_tenant_id_fkey
    foreign key (tenant_id) references public.profiles (id) on delete set null;

alter table public.documents alter column uploaded_by drop not null;
alter table public.documents
  drop constraint documents_uploaded_by_fkey,
  add constraint documents_uploaded_by_fkey
    foreign key (uploaded_by) references public.profiles (id) on delete set null;

alter table public.notifications
  drop constraint notifications_recipient_id_fkey,
  add constraint notifications_recipient_id_fkey
    foreign key (recipient_id) references public.profiles (id) on delete set null;
