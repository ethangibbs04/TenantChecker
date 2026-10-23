"use client";

import { useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  Briefcase,
  Calendar,
  Car,
  Check,
  FileSignature,
  History,
  Home,
  Landmark,
  PawPrint,
  Phone,
  ShieldAlert,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { saveApplicationDraft, submitApplication } from "@/app/tenant/actions";
import { Logo } from "@/components/logo";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCOUNT_TYPE_OPTIONS,
  APPLICATION_TYPE_OPTIONS,
  BANK_OPTIONS,
  EMPTY_APPLICATION_FORM_DATA,
  GENDER_OPTIONS,
  ID_TYPE_OPTIONS,
  INCOME_TYPE_OPTIONS,
  LEASE_TERM_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MAX_ADULTS,
  MAX_PETS,
  MAX_VEHICLES,
  PETS_VACCINATED_OPTIONS,
  YES_NO_OPTIONS,
  type ApplicationFormData,
} from "@/lib/application-form";

// Required/optional marker — every field in this form carries one,
// per the client's request to mark which fields are and aren't required.
function RequiredMark({ required }: { required?: boolean }) {
  return required ? (
    <span className="text-danger-600"> *</span>
  ) : (
    <span className="font-normal text-slate-400"> (optional)</span>
  );
}

function FieldWrap({
  id,
  label,
  required,
  full,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id}>
        {label}
        <RequiredMark required={required} />
      </Label>
      {children}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Icon className="size-4 text-navy-700" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      </CardContent>
    </Card>
  );
}

export function ApplicationForm({
  checkId,
  initialData,
  allDocumentsUploaded,
}: {
  checkId: string;
  initialData: ApplicationFormData | null;
  allDocumentsUploaded: boolean;
}) {
  // Merged onto defaults, not used directly — a draft saved under an
  // older field shape (or simply missing a field added since) would
  // otherwise leave e.g. `adults` undefined and crash the first `.map()`.
  const [data, setData] = useState<ApplicationFormData>({
    ...EMPTY_APPLICATION_FORM_DATA,
    ...initialData,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();
  const errorRef = useRef<HTMLParagraphElement>(null);

  function set<K extends keyof ApplicationFormData>(key: K, value: ApplicationFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function addAdult() {
    if (data.adults.length >= MAX_ADULTS) return;
    setData((d) => ({ ...d, adults: [...d.adults, { full_name: "" }] }));
  }
  function updateAdult(index: number, full_name: string) {
    setData((d) => ({
      ...d,
      adults: d.adults.map((a, i) => (i === index ? { full_name } : a)),
    }));
  }
  function removeAdult(index: number) {
    setData((d) => ({ ...d, adults: d.adults.filter((_, i) => i !== index) }));
  }

  function addPet() {
    if (data.pets.length >= MAX_PETS) return;
    setData((d) => ({ ...d, pets: [...d.pets, { description: "" }] }));
  }
  function updatePet(index: number, description: string) {
    setData((d) => ({ ...d, pets: d.pets.map((p, i) => (i === index ? { description } : p)) }));
  }
  function removePet(index: number) {
    setData((d) => ({ ...d, pets: d.pets.filter((_, i) => i !== index) }));
  }

  function addVehicle() {
    if (data.vehicles.length >= MAX_VEHICLES) return;
    setData((d) => ({ ...d, vehicles: [...d.vehicles, { description: "" }] }));
  }
  function updateVehicle(index: number, description: string) {
    setData((d) => ({
      ...d,
      vehicles: d.vehicles.map((v, i) => (i === index ? { description } : v)),
    }));
  }
  function removeVehicle(index: number) {
    setData((d) => ({ ...d, vehicles: d.vehicles.filter((_, i) => i !== index) }));
  }

  function handleSaveDraft() {
    setError(null);
    startSaving(async () => {
      try {
        await saveApplicationDraft(checkId, data);
        setSavedAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleSubmit() {
    setError(null);
    if (!data.declaration_agree) {
      setError("Please confirm the declaration before submitting.");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!data.signature_data_url) {
      setError("Please sign before submitting.");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    startSubmitting(async () => {
      try {
        await submitApplication(checkId, data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit");
      }
    });
  }

  const netAfterExpenses =
    (Number(data.net_monthly_income) || 0) - (Number(data.monthly_expenses) || 0);
  const isSaIdApplicant = data.id_type === "South African ID";
  const isPassportApplicant = data.id_type === "Passport";
  const isJointApplication = data.application_type === "Joint";
  const hasPets = data.has_pets === "Yes";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
        <Logo size="sm" />
        <p className="text-xs text-slate-500">Rental application form</p>
      </div>

      <SectionCard icon={Calendar} title="Rental particulars">
        <FieldWrap id="desired_move_in_date" label="When would you like to move in?" required>
          <Input
            id="desired_move_in_date"
            type="date"
            value={data.desired_move_in_date}
            onChange={(e) => set("desired_move_in_date", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="requested_lease_term" label="Required lease term" required>
          <Select
            id="requested_lease_term"
            value={data.requested_lease_term}
            onChange={(e) => set("requested_lease_term", e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {LEASE_TERM_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap id="monthly_rental_amount" label="Monthly rental (ZAR)" required>
          <Input
            id="monthly_rental_amount"
            type="number"
            value={data.monthly_rental_amount}
            onChange={(e) => set("monthly_rental_amount", e.target.value)}
          />
        </FieldWrap>
      </SectionCard>

      <SectionCard icon={User} title="Applicant details">
        <FieldWrap id="id_type" label="Valid South African ID" required>
          <Select id="id_type" value={data.id_type} onChange={(e) => set("id_type", e.target.value)}>
            <option value="" disabled>
              Select…
            </option>
            {ID_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>

        {/* Smart branch: an SA ID number already encodes date of birth and
            gender, so a South African ID holder is never asked those, or
            for a passport/country of issue. */}
        {isSaIdApplicant && (
          <FieldWrap id="id_number" label="SA ID number" required>
            <Input id="id_number" value={data.id_number} onChange={(e) => set("id_number", e.target.value)} />
          </FieldWrap>
        )}

        {isPassportApplicant && (
          <>
            <FieldWrap id="passport_number" label="Passport number" required>
              <Input
                id="passport_number"
                value={data.passport_number}
                onChange={(e) => set("passport_number", e.target.value)}
              />
            </FieldWrap>
            <FieldWrap id="gender" label="Gender" required>
              <Select id="gender" value={data.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="" disabled>
                  Select…
                </option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap id="passport_country_of_issue" label="Country of issue (passport)" required>
              <Input
                id="passport_country_of_issue"
                value={data.passport_country_of_issue}
                onChange={(e) => set("passport_country_of_issue", e.target.value)}
              />
            </FieldWrap>
            <FieldWrap id="date_of_birth" label="Date of birth" required>
              <Input
                id="date_of_birth"
                type="date"
                value={data.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
              />
            </FieldWrap>
          </>
        )}

        <FieldWrap id="occupation" label="Occupation" required>
          <Input id="occupation" value={data.occupation} onChange={(e) => set("occupation", e.target.value)} />
        </FieldWrap>
        <FieldWrap id="phone" label="Phone" required>
          <Input id="phone" type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
        </FieldWrap>
        <FieldWrap id="email" label="Email" required>
          <Input id="email" type="email" value={data.email} onChange={(e) => set("email", e.target.value)} />
        </FieldWrap>
        <FieldWrap id="marital_status" label="Marital status" required>
          <Select
            id="marital_status"
            value={data.marital_status}
            onChange={(e) => set("marital_status", e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {MARITAL_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap id="application_type" label="Application type" required>
          <Select
            id="application_type"
            value={data.application_type}
            onChange={(e) => set("application_type", e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {APPLICATION_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        {isJointApplication && (
          <FieldWrap id="co_applicant_name" label="Co-applicant's full name" full>
            <Input
              id="co_applicant_name"
              value={data.co_applicant_name}
              onChange={(e) => set("co_applicant_name", e.target.value)}
            />
          </FieldWrap>
        )}
      </SectionCard>

      <SectionCard icon={Home} title="Current residence">
        <FieldWrap id="current_address" label="Address" required full>
          <Textarea
            id="current_address"
            rows={2}
            value={data.current_address}
            onChange={(e) => set("current_address", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="current_landlord_name" label="Landlord / agent name" required>
          <Input
            id="current_landlord_name"
            value={data.current_landlord_name}
            onChange={(e) => set("current_landlord_name", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="current_landlord_phone" label="Landlord / agent phone" required>
          <Input
            id="current_landlord_phone"
            type="tel"
            value={data.current_landlord_phone}
            onChange={(e) => set("current_landlord_phone", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="current_landlord_email" label="Landlord / agent email" required>
          <Input
            id="current_landlord_email"
            type="email"
            value={data.current_landlord_email}
            onChange={(e) => set("current_landlord_email", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="current_monthly_rent" label="Current monthly rent (ZAR)">
          <Input
            id="current_monthly_rent"
            type="number"
            value={data.current_monthly_rent}
            onChange={(e) => set("current_monthly_rent", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="current_residence_duration" label="How long have you lived here?" required full>
          <Input
            id="current_residence_duration"
            placeholder="e.g. 2 years 3 months"
            value={data.current_residence_duration}
            onChange={(e) => set("current_residence_duration", e.target.value)}
          />
        </FieldWrap>
      </SectionCard>

      <SectionCard icon={History} title="Previous residence">
        <FieldWrap id="previous_address" label="Address" full>
          <Textarea
            id="previous_address"
            rows={2}
            value={data.previous_address}
            onChange={(e) => set("previous_address", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="previous_landlord_name" label="Landlord / agent name">
          <Input
            id="previous_landlord_name"
            value={data.previous_landlord_name}
            onChange={(e) => set("previous_landlord_name", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="previous_landlord_phone" label="Landlord / agent phone">
          <Input
            id="previous_landlord_phone"
            type="tel"
            value={data.previous_landlord_phone}
            onChange={(e) => set("previous_landlord_phone", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="previous_landlord_email" label="Landlord / agent email">
          <Input
            id="previous_landlord_email"
            type="email"
            value={data.previous_landlord_email}
            onChange={(e) => set("previous_landlord_email", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="previous_monthly_rent" label="Monthly rent paid (ZAR)">
          <Input
            id="previous_monthly_rent"
            type="number"
            value={data.previous_monthly_rent}
            onChange={(e) => set("previous_monthly_rent", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="previous_residence_duration" label="How long did you live there?">
          <Input
            id="previous_residence_duration"
            placeholder="e.g. 1 year"
            value={data.previous_residence_duration}
            onChange={(e) => set("previous_residence_duration", e.target.value)}
          />
        </FieldWrap>
      </SectionCard>

      <SectionCard icon={Phone} title="Alternative contact">
        <p className="text-xs text-slate-500 sm:col-span-2">
          A relative or contact who doesn&apos;t live at the same address as you.
        </p>
        <FieldWrap id="alt_contact_name" label="Full name" required>
          <Input
            id="alt_contact_name"
            value={data.alt_contact_name}
            onChange={(e) => set("alt_contact_name", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="alt_contact_relationship" label="Relationship to you">
          <Input
            id="alt_contact_relationship"
            value={data.alt_contact_relationship}
            onChange={(e) => set("alt_contact_relationship", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="alt_contact_phone" label="Contact number" required>
          <Input
            id="alt_contact_phone"
            type="tel"
            value={data.alt_contact_phone}
            onChange={(e) => set("alt_contact_phone", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="alt_contact_email" label="Contact email" required>
          <Input
            id="alt_contact_email"
            type="email"
            value={data.alt_contact_email}
            onChange={(e) => set("alt_contact_email", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="alt_contact_address" label="Address" required full>
          <Textarea
            id="alt_contact_address"
            rows={2}
            value={data.alt_contact_address}
            onChange={(e) => set("alt_contact_address", e.target.value)}
          />
        </FieldWrap>
      </SectionCard>

      <SectionCard icon={Briefcase} title="Employment & income type">
        <FieldWrap id="applicant_income_type" label="Income type" required full>
          <Select
            id="applicant_income_type"
            value={data.applicant_income_type}
            onChange={(e) => set("applicant_income_type", e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {INCOME_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap id="employer_name" label="Employer name" required>
          <Input
            id="employer_name"
            value={data.employer_name}
            onChange={(e) => set("employer_name", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="employer_phone" label="Employer phone" required>
          <Input
            id="employer_phone"
            type="tel"
            value={data.employer_phone}
            onChange={(e) => set("employer_phone", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="employer_address" label="Employer address" required full>
          <Textarea
            id="employer_address"
            rows={2}
            value={data.employer_address}
            onChange={(e) => set("employer_address", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="hr_contact_person" label="HR contact person" required>
          <Input
            id="hr_contact_person"
            value={data.hr_contact_person}
            onChange={(e) => set("hr_contact_person", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="hr_email" label="HR email">
          <Input id="hr_email" type="email" value={data.hr_email} onChange={(e) => set("hr_email", e.target.value)} />
        </FieldWrap>
        <FieldWrap id="employment_start_date" label="Employment start date" required>
          <Input
            id="employment_start_date"
            type="date"
            value={data.employment_start_date}
            onChange={(e) => set("employment_start_date", e.target.value)}
          />
        </FieldWrap>
      </SectionCard>

      <SectionCard icon={TrendingUp} title="Affordability">
        <FieldWrap id="gross_monthly_income" label="Gross monthly income (ZAR)" required>
          <Input
            id="gross_monthly_income"
            type="number"
            value={data.gross_monthly_income}
            onChange={(e) => set("gross_monthly_income", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="net_monthly_income" label="Net monthly income (ZAR)" required>
          <Input
            id="net_monthly_income"
            type="number"
            value={data.net_monthly_income}
            onChange={(e) => set("net_monthly_income", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="monthly_expenses" label="Current monthly expenses (ZAR)" required>
          <Input
            id="monthly_expenses"
            type="number"
            value={data.monthly_expenses}
            onChange={(e) => set("monthly_expenses", e.target.value)}
          />
        </FieldWrap>
        <div className="flex flex-col gap-1.5">
          <Label>Net income after expenses (calculated)</Label>
          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
            R {netAfterExpenses.toLocaleString()}
          </div>
        </div>
        <FieldWrap id="salary_payment_date" label="Salary payment date">
          <Input
            id="salary_payment_date"
            placeholder="e.g. 25th of each month"
            value={data.salary_payment_date}
            onChange={(e) => set("salary_payment_date", e.target.value)}
          />
        </FieldWrap>
      </SectionCard>

      <SectionCard icon={Landmark} title="Banking details">
        <FieldWrap id="bank_name" label="Bank" required>
          <Select id="bank_name" value={data.bank_name} onChange={(e) => set("bank_name", e.target.value)}>
            <option value="" disabled>
              Select…
            </option>
            {BANK_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap id="account_holder_name" label="Account holder name" required>
          <Input
            id="account_holder_name"
            value={data.account_holder_name}
            onChange={(e) => set("account_holder_name", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="branch_name" label="Branch name" required>
          <Input
            id="branch_name"
            value={data.branch_name}
            onChange={(e) => set("branch_name", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="branch_code" label="Branch code">
          <Input
            id="branch_code"
            value={data.branch_code}
            onChange={(e) => set("branch_code", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="account_number" label="Account number" required>
          <Input
            id="account_number"
            value={data.account_number}
            onChange={(e) => set("account_number", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="account_type" label="Account type" required>
          <Select id="account_type" value={data.account_type} onChange={(e) => set("account_type", e.target.value)}>
            <option value="" disabled>
              Select…
            </option>
            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
      </SectionCard>

      <SectionCard icon={Users} title="Occupants">
        <FieldWrap id="total_occupants" label="Total number of occupants" required>
          <Input
            id="total_occupants"
            type="number"
            min={1}
            value={data.total_occupants}
            onChange={(e) => set("total_occupants", e.target.value)}
          />
        </FieldWrap>
        <FieldWrap id="number_of_children" label="Number of children" required>
          <Input
            id="number_of_children"
            type="number"
            min={0}
            value={data.number_of_children}
            onChange={(e) => set("number_of_children", e.target.value)}
          />
        </FieldWrap>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Adult occupants</Label>
          {data.adults.map((adult, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                aria-label={`Adult ${i + 1} full name`}
                placeholder="Full name"
                value={adult.full_name}
                onChange={(e) => updateAdult(i, e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeAdult(i)}>
                <X />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
          {data.adults.length < MAX_ADULTS && (
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addAdult}>
              Add an adult occupant
            </Button>
          )}
        </div>
      </SectionCard>

      <SectionCard icon={PawPrint} title="Pets">
        <FieldWrap id="has_pets" label="Do you have any pets?" required>
          <Select id="has_pets" value={data.has_pets} onChange={(e) => set("has_pets", e.target.value)}>
            <option value="" disabled>
              Select…
            </option>
            {YES_NO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        {hasPets && (
          <>
            <FieldWrap id="pets_vaccinated" label="Sterilised & vaccinations up to date?" required>
              <Select
                id="pets_vaccinated"
                value={data.pets_vaccinated}
                onChange={(e) => set("pets_vaccinated", e.target.value)}
              >
                <option value="" disabled>
                  Select…
                </option>
                {PETS_VACCINATED_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </FieldWrap>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Pet details</Label>
              {data.pets.map((pet, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    aria-label={`Pet ${i + 1} description`}
                    placeholder="Type, age, and breed — e.g. 1 dog, 2 years, Labrador"
                    value={pet.description}
                    onChange={(e) => updatePet(i, e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removePet(i)}>
                    <X />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
              {data.pets.length < MAX_PETS && (
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addPet}>
                  Add a pet
                </Button>
              )}
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard icon={Car} title="Vehicles">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Vehicles on the premises</Label>
          {data.vehicles.map((vehicle, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                aria-label={`Vehicle ${i + 1} description`}
                placeholder="Make, model, and registration"
                value={vehicle.description}
                onChange={(e) => updateVehicle(i, e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeVehicle(i)}>
                <X />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
          {data.vehicles.length < MAX_VEHICLES && (
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addVehicle}>
              Add a vehicle
            </Button>
          )}
        </div>
      </SectionCard>

      <SectionCard icon={ShieldAlert} title="Background & disclosure">
        <FieldWrap id="has_judgments_or_defaults" label="Any judgments or defaults against you?" required>
          <Select
            id="has_judgments_or_defaults"
            value={data.has_judgments_or_defaults}
            onChange={(e) => set("has_judgments_or_defaults", e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {YES_NO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap id="is_insolvent_or_debt_review" label="Currently insolvent or under debt review?" required>
          <Select
            id="is_insolvent_or_debt_review"
            value={data.is_insolvent_or_debt_review}
            onChange={(e) => set("is_insolvent_or_debt_review", e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {YES_NO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap id="has_criminal_record" label="Do you have a criminal record?" required>
          <Select
            id="has_criminal_record"
            value={data.has_criminal_record}
            onChange={(e) => set("has_criminal_record", e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {YES_NO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap id="was_previously_evicted" label="Ever evicted or had a lease cancelled?">
          <Select
            id="was_previously_evicted"
            value={data.was_previously_evicted}
            onChange={(e) => set("was_previously_evicted", e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {YES_NO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldWrap>
      </SectionCard>

      <SectionCard icon={FileSignature} title="Declaration">
        <div className="flex flex-col gap-4 sm:col-span-2">
          <p className="text-sm text-slate-600">
            I declare that the information I have supplied is true and accurate. I understand that
            Tenantcheck will use it, together with a credit check and reference information, to
            compile a vetting report for the landlord, and that providing false information may
            result in my application being declined.
          </p>

          <div className="flex items-start gap-2">
            <input
              id="declaration_agree"
              type="checkbox"
              checked={data.declaration_agree}
              onChange={(e) => set("declaration_agree", e.target.checked)}
              className="mt-1 size-4 rounded border-slate-300 text-navy-700 focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Label htmlFor="declaration_agree" className="font-normal">
              I confirm that I agree to the above. <RequiredMark required />
            </Label>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Signature
              <RequiredMark required />
            </Label>
            <SignaturePad
              value={data.signature_data_url}
              onChange={(dataUrl) => set("signature_data_url", dataUrl)}
            />
          </div>

          <FieldWrap id="confirmation_email" label="Send me a copy at">
            <Input
              id="confirmation_email"
              type="email"
              value={data.confirmation_email}
              onChange={(e) => set("confirmation_email", e.target.value)}
            />
          </FieldWrap>
        </div>
      </SectionCard>

      {error && (
        <p
          ref={errorRef}
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {!allDocumentsUploaded && (
        <p className="rounded-lg bg-warning-100 px-3 py-2 text-sm text-warning-600">
          Upload your required documents above before you can submit.
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {savedAt && !error ? (
            <span className="flex items-center gap-1 text-success-600">
              <Check className="size-3.5" aria-hidden="true" />
              Draft saved at {savedAt.toLocaleTimeString()}
            </span>
          ) : (
            "Your progress is saved as a draft until you submit."
          )}
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save draft"}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !allDocumentsUploaded}>
            {isSubmitting ? "Submitting…" : "Submit application"}
          </Button>
        </div>
      </div>
    </div>
  );
}
