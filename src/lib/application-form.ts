// First-draft field set for the tenant application form — the spec calls
// for a "comprehensive" form but doesn't specify exact fields. Grouped
// into sections that match what a landlord/TPN vetting package typically
// needs; revisit with real business input before launch.
export interface ApplicationFormData {
  id_number: string;
  date_of_birth: string;
  marital_status: string;
  current_address: string;
  monthly_income: string;
  employer_name: string;
  job_title: string;
  employment_status: string;
  employment_length: string;
  employer_phone: string;
  current_landlord_name: string;
  current_landlord_phone: string;
  reason_for_leaving: string;
  number_of_occupants: string;
  has_pets: string;
  pet_details: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
}

// "section" is a display-only grouping for the form UI (Section 1/Layout
// concern) — it doesn't affect what's stored in form_data. Field content
// itself (names, labels, options) is still the first-draft placeholder set
// noted above.
export const APPLICATION_FORM_SECTIONS = [
  "Personal details",
  "Current residence",
  "Employment & income",
  "Household",
  "Emergency contact",
] as const;
export type ApplicationFormSection = (typeof APPLICATION_FORM_SECTIONS)[number];

export const APPLICATION_FORM_FIELDS: {
  name: keyof ApplicationFormData;
  label: string;
  section: ApplicationFormSection;
  type?: "text" | "date" | "tel" | "number" | "select" | "textarea";
  options?: string[];
}[] = [
  { name: "id_number", label: "SA ID number", section: "Personal details" },
  { name: "date_of_birth", label: "Date of birth", section: "Personal details", type: "date" },
  {
    name: "marital_status",
    label: "Marital status",
    section: "Personal details",
    type: "select",
    options: ["Single", "Married", "Divorced", "Widowed"],
  },
  { name: "current_address", label: "Current address", section: "Current residence", type: "textarea" },
  { name: "current_landlord_name", label: "Current landlord's name", section: "Current residence" },
  { name: "current_landlord_phone", label: "Current landlord's phone", section: "Current residence", type: "tel" },
  { name: "reason_for_leaving", label: "Reason for leaving current address", section: "Current residence", type: "textarea" },
  {
    name: "employment_status",
    label: "Employment status",
    section: "Employment & income",
    type: "select",
    options: ["Permanent", "Contract", "Self-employed", "Unemployed", "Student"],
  },
  { name: "employer_name", label: "Employer name", section: "Employment & income" },
  { name: "job_title", label: "Job title", section: "Employment & income" },
  { name: "employment_length", label: "Length of employment", section: "Employment & income" },
  { name: "employer_phone", label: "Employer phone", section: "Employment & income", type: "tel" },
  { name: "monthly_income", label: "Monthly income (ZAR)", section: "Employment & income", type: "number" },
  { name: "number_of_occupants", label: "Number of occupants", section: "Household", type: "number" },
  {
    name: "has_pets",
    label: "Do you have pets?",
    section: "Household",
    type: "select",
    options: ["No", "Yes"],
  },
  { name: "pet_details", label: "Pet details (if any)", section: "Household", type: "textarea" },
  { name: "emergency_contact_name", label: "Emergency contact name", section: "Emergency contact" },
  { name: "emergency_contact_relationship", label: "Relationship to you", section: "Emergency contact" },
  { name: "emergency_contact_phone", label: "Emergency contact phone", section: "Emergency contact", type: "tel" },
];

export const REQUIRED_DOCUMENT_TYPES = ["id_copy", "payslip", "bank_statement"] as const;
export type RequiredDocumentType = (typeof REQUIRED_DOCUMENT_TYPES)[number];

// Uploaded by admin, not the tenant — the credit check is run manually
// against TPN and the recommendation manually via LLM, both outside this
// app for now (see Plan.md Phase 5).
export const ADMIN_DOCUMENT_TYPES = ["credit_check", "ai_recommendation"] as const;
export type AdminDocumentType = (typeof ADMIN_DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  id_copy: "Copy of ID",
  payslip: "Latest payslip",
  bank_statement: "Bank statement (last 3 months)",
  credit_check: "TPN credit check",
  ai_recommendation: "AI recommendation",
  other: "Other",
};
