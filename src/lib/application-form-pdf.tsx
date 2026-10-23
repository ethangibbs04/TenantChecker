import type { ReactNode } from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Image } from "@react-pdf/renderer";
import type { ApplicationFormData } from "./application-form";

// Hand-written to mirror the tenant's actual form UI (ApplicationForm) —
// same section order, same label-above-value-box style — so the stored
// PDF reads like the form the tenant actually filled out. The header logo
// mirrors components/logo.tsx's shield mark and navy/sky wordmark exactly
// (same path data and hex values); react-pdf can't render a React
// component, so it's redrawn here with the Svg/Path primitives.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#171717" },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  logoText: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#525252", marginBottom: 2 },
  divider: { marginTop: 14, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#e5e5e5" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#123868", marginTop: 14, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 10 },
  field: { width: "46%" },
  fieldFull: { width: "100%" },
  label: { fontSize: 8, color: "#525252", marginBottom: 3 },
  valueBox: {
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 20,
  },
  value: { fontSize: 9, color: "#171717" },
  valueEmpty: { fontSize: 9, color: "#a3a3a3" },
  signatureImage: { width: 180, height: 60, borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 4 },
});

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <View style={full ? styles.fieldFull : styles.field} wrap={false}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueBox}>
        <Text style={value ? styles.value : styles.valueEmpty}>{value || "Not answered"}</Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

function joinNonEmpty(items: string[], sep: string) {
  const filtered = items.filter(Boolean);
  return filtered.length ? filtered.join(sep) : "";
}

export function ApplicationFormDocument({
  tenantName,
  propertyLabel,
  submittedAt,
  formData,
}: {
  tenantName: string;
  propertyLabel: string;
  submittedAt: string | null;
  formData: ApplicationFormData;
}) {
  const d = formData;
  const isSaId = d.id_type === "South African ID";
  const isJoint = d.application_type === "Joint";
  const hasPets = d.has_pets === "Yes";
  const netAfterExpenses = (Number(d.net_monthly_income) || 0) - (Number(d.monthly_expenses) || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M12 2.5 4.5 5.25v5.4c0 5.06 3.2 9.15 7.5 10.85 4.3-1.7 7.5-5.79 7.5-10.85v-5.4L12 2.5Z"
              fill="#123868"
            />
            <Path
              d="M8.25 12.4 11 15.15l4.75-5.3"
              stroke="#55b2ff"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
          <Text style={styles.logoText}>
            <Text style={{ color: "#0a1f3d" }}>Tenant</Text>
            <Text style={{ color: "#0072d6" }}>check</Text>
          </Text>
        </View>
        <Text style={styles.title}>Rental application — {propertyLabel}</Text>
        <Text style={styles.subtitle}>{tenantName}</Text>
        <Text style={styles.subtitle}>
          Submitted {submittedAt ? new Date(submittedAt).toLocaleString() : "—"}
        </Text>
        <View style={styles.divider} />

        <Section title="Rental particulars">
          <Field label="Desired move-in date" value={d.desired_move_in_date} />
          <Field label="Required lease term" value={d.requested_lease_term} />
          <Field label="Monthly rental (ZAR)" value={d.monthly_rental_amount} />
        </Section>

        <Section title="Applicant details">
          <Field label="ID type" value={d.id_type} />
          {isSaId ? (
            <Field label="SA ID number" value={d.id_number} />
          ) : (
            <>
              <Field label="Passport number" value={d.passport_number} />
              <Field label="Gender" value={d.gender} />
              <Field label="Country of issue" value={d.passport_country_of_issue} />
              <Field label="Date of birth" value={d.date_of_birth} />
            </>
          )}
          <Field label="Occupation" value={d.occupation} />
          <Field label="Phone" value={d.phone} />
          <Field label="Email" value={d.email} />
          <Field label="Marital status" value={d.marital_status} />
          <Field label="Application type" value={d.application_type} />
          {isJoint && <Field label="Co-applicant" value={d.co_applicant_name} />}
        </Section>

        <Section title="Current residence">
          <Field label="Address" value={d.current_address} full />
          <Field label="Landlord/agent name" value={d.current_landlord_name} />
          <Field label="Landlord/agent phone" value={d.current_landlord_phone} />
          <Field label="Landlord/agent email" value={d.current_landlord_email} />
          <Field label="Monthly rent" value={d.current_monthly_rent} />
          <Field label="Duration" value={d.current_residence_duration} />
        </Section>

        <Section title="Previous residence">
          <Field label="Address" value={d.previous_address} full />
          <Field label="Landlord/agent name" value={d.previous_landlord_name} />
          <Field label="Landlord/agent phone" value={d.previous_landlord_phone} />
          <Field label="Landlord/agent email" value={d.previous_landlord_email} />
          <Field label="Monthly rent" value={d.previous_monthly_rent} />
          <Field label="Duration" value={d.previous_residence_duration} />
        </Section>

        <Section title="Alternative contact">
          <Field label="Full name" value={d.alt_contact_name} />
          <Field label="Relationship" value={d.alt_contact_relationship} />
          <Field label="Phone" value={d.alt_contact_phone} />
          <Field label="Email" value={d.alt_contact_email} />
          <Field label="Address" value={d.alt_contact_address} full />
        </Section>

        <Section title="Employment & income type">
          <Field label="Income type" value={d.applicant_income_type} full />
          <Field label="Employer name" value={d.employer_name} />
          <Field label="Employer phone" value={d.employer_phone} />
          <Field label="Employer address" value={d.employer_address} full />
          <Field label="HR contact" value={d.hr_contact_person} />
          <Field label="HR email" value={d.hr_email} />
          <Field label="Employment start date" value={d.employment_start_date} />
        </Section>

        <Section title="Affordability">
          <Field label="Gross monthly income (ZAR)" value={d.gross_monthly_income} />
          <Field label="Net monthly income (ZAR)" value={d.net_monthly_income} />
          <Field label="Monthly expenses (ZAR)" value={d.monthly_expenses} />
          <Field label="Net income after expenses (ZAR)" value={String(netAfterExpenses)} />
          <Field label="Salary payment date" value={d.salary_payment_date} />
        </Section>

        <Section title="Banking details">
          <Field label="Bank" value={d.bank_name} />
          <Field label="Account holder" value={d.account_holder_name} />
          <Field label="Branch name" value={d.branch_name} />
          <Field label="Branch code" value={d.branch_code} />
          <Field label="Account number" value={d.account_number} />
          <Field label="Account type" value={d.account_type} />
        </Section>

        <Section title="Occupants">
          <Field label="Total occupants" value={d.total_occupants} />
          <Field label="Number of children" value={d.number_of_children} />
          <Field
            label="Adult occupants"
            value={joinNonEmpty(d.adults.map((a) => a.full_name), ", ")}
            full
          />
        </Section>

        <Section title="Pets">
          <Field label="Has pets" value={d.has_pets} />
          {hasPets && (
            <>
              <Field label="Sterilised / vaccinated" value={d.pets_vaccinated} />
              <Field
                label="Pet details"
                value={joinNonEmpty(d.pets.map((p) => p.description), "; ")}
                full
              />
            </>
          )}
        </Section>

        <Section title="Vehicles">
          <Field
            label="Vehicles on the premises"
            value={joinNonEmpty(d.vehicles.map((v) => v.description), "; ")}
            full
          />
        </Section>

        <Section title="Background & disclosure">
          <Field label="Judgments or defaults" value={d.has_judgments_or_defaults} />
          <Field label="Insolvent / debt review" value={d.is_insolvent_or_debt_review} />
          <Field label="Criminal record" value={d.has_criminal_record} />
          <Field label="Previously evicted" value={d.was_previously_evicted} />
        </Section>

        <Section title="Declaration">
          <Field label="Confirmed information is accurate" value={d.declaration_agree ? "Yes" : "No"} />
          <Field label="Confirmation email" value={d.confirmation_email} />
        </Section>

        {d.signature_data_url ? (
          <View style={{ marginTop: 6 }} wrap={false}>
            <Text style={styles.label}>Signature</Text>
            {/* react-pdf's Image, not an HTML img — no alt text concept in a PDF */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={d.signature_data_url} style={styles.signatureImage} />
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
