// Field model for the tenant application form — rebuilt to match a
// reference South African rental application 1:1 on the individual-
// applicant path (the reference's separate Company/Business-applicant
// branch is intentionally not built; this product has no concept of a
// company tenant anywhere else — see conversation decision).
//
// The form itself is hand-written JSX (not generically rendered from this
// file) because it needs real conditional logic — an SA ID vs Passport
// branch, a Single vs Joint branch, and "add another" repeatable groups
// for adults/pets/vehicles — which a flat metadata-driven renderer can't
// express. This file holds only the shared type and the option lists/
// constants both the form and the PDF pull from, so labels can't drift
// between option sets even though the two renderers are separate.
//
// Storage: both `application_forms.form_data` (this shape, as jsonb) and
// a generated PDF snapshot (uploaded as a `documents` row, document_type
// 'application_form') are kept — client decision, see submit_application
// migration's comment.

export interface AdultOccupant {
  full_name: string;
}
export interface PetEntry {
  description: string;
}
export interface VehicleEntry {
  description: string;
}

export interface ApplicationFormData {
  // Rental particulars
  desired_move_in_date: string;
  requested_lease_term: string;
  monthly_rental_amount: string;

  // Applicant details
  id_type: string;
  id_number: string;
  passport_number: string;
  gender: string;
  passport_country_of_issue: string;
  date_of_birth: string;
  occupation: string;
  phone: string;
  email: string;
  marital_status: string;
  application_type: string;
  co_applicant_name: string;

  // Current residence
  current_address: string;
  current_landlord_name: string;
  current_landlord_email: string;
  current_landlord_phone: string;
  current_monthly_rent: string;
  current_residence_duration: string;

  // Previous residence
  previous_address: string;
  previous_landlord_name: string;
  previous_landlord_email: string;
  previous_landlord_phone: string;
  previous_monthly_rent: string;
  previous_residence_duration: string;

  // Income type (drives nothing structurally — document list is fixed
  // per this session's instruction — but still collected, 1:1 with the
  // reference)
  applicant_income_type: string;

  // Alternative / emergency contact
  alt_contact_name: string;
  alt_contact_address: string;
  alt_contact_phone: string;
  alt_contact_email: string;
  alt_contact_relationship: string;

  // Employment
  employer_name: string;
  employer_address: string;
  employer_phone: string;
  hr_contact_person: string;
  hr_email: string;
  employment_start_date: string;

  // Affordability
  gross_monthly_income: string;
  net_monthly_income: string;
  monthly_expenses: string;
  salary_payment_date: string;

  // Banking
  bank_name: string;
  account_holder_name: string;
  branch_name: string;
  branch_code: string;
  account_number: string;
  account_type: string;

  // Occupants
  total_occupants: string;
  number_of_children: string;
  adults: AdultOccupant[];

  // Pets
  has_pets: string;
  pets_vaccinated: string;
  pets: PetEntry[];

  // Vehicles
  vehicles: VehicleEntry[];

  // Background & disclosure
  has_judgments_or_defaults: string;
  is_insolvent_or_debt_review: string;
  has_criminal_record: string;
  was_previously_evicted: string;

  // Declaration
  declaration_agree: boolean;
  signature_data_url: string;
  confirmation_email: string;
}

export const MAX_ADULTS = 5;
export const MAX_PETS = 4;
export const MAX_VEHICLES = 4;

export const EMPTY_APPLICATION_FORM_DATA: ApplicationFormData = {
  desired_move_in_date: "",
  requested_lease_term: "",
  monthly_rental_amount: "",
  id_type: "",
  id_number: "",
  passport_number: "",
  gender: "",
  passport_country_of_issue: "",
  date_of_birth: "",
  occupation: "",
  phone: "",
  email: "",
  marital_status: "",
  application_type: "",
  co_applicant_name: "",
  current_address: "",
  current_landlord_name: "",
  current_landlord_email: "",
  current_landlord_phone: "",
  current_monthly_rent: "",
  current_residence_duration: "",
  previous_address: "",
  previous_landlord_name: "",
  previous_landlord_email: "",
  previous_landlord_phone: "",
  previous_monthly_rent: "",
  previous_residence_duration: "",
  applicant_income_type: "",
  alt_contact_name: "",
  alt_contact_address: "",
  alt_contact_phone: "",
  alt_contact_email: "",
  alt_contact_relationship: "",
  employer_name: "",
  employer_address: "",
  employer_phone: "",
  hr_contact_person: "",
  hr_email: "",
  employment_start_date: "",
  gross_monthly_income: "",
  net_monthly_income: "",
  monthly_expenses: "",
  salary_payment_date: "",
  bank_name: "",
  account_holder_name: "",
  branch_name: "",
  branch_code: "",
  account_number: "",
  account_type: "",
  total_occupants: "",
  number_of_children: "",
  adults: [],
  has_pets: "",
  pets_vaccinated: "",
  pets: [],
  vehicles: [],
  has_judgments_or_defaults: "",
  is_insolvent_or_debt_review: "",
  has_criminal_record: "",
  was_previously_evicted: "",
  declaration_agree: false,
  signature_data_url: "",
  confirmation_email: "",
};

export const LEASE_TERM_OPTIONS = ["6 months", "12 months", "24 months", "Other"];
export const ID_TYPE_OPTIONS = ["South African ID", "Passport"];
export const GENDER_OPTIONS = ["Male", "Female", "Other / prefer not to say"];
export const MARITAL_STATUS_OPTIONS = [
  "Single",
  "Married in community of property",
  "Married out of community of property (ANC)",
  "Married under customary law",
  "Married under Muslim or Hindu rites",
  "Divorced",
  "Widowed",
];
export const APPLICATION_TYPE_OPTIONS = ["Single", "Joint"];
export const INCOME_TYPE_OPTIONS = [
  "Employed (salary earner)",
  "Employed (commission earner)",
  "Self-employed",
];
export const BANK_OPTIONS = [
  "ABSA",
  "FNB",
  "Nedbank",
  "Standard Bank",
  "Capitec",
  "Investec",
  "TymeBank",
  "Bidvest Bank",
  "Other",
];
export const ACCOUNT_TYPE_OPTIONS = ["Cheque / current", "Savings", "Other"];
export const YES_NO_OPTIONS = ["No", "Yes"];
export const PETS_VACCINATED_OPTIONS = [
  "Not applicable",
  "Yes, all up to date",
  "No, not all up to date",
];

// Tenant-uploaded documents — exactly the 5 categories the client gave,
// drawn from the reference form's "Documents Required — Employed
// Applicants" list.
export const REQUIRED_DOCUMENT_TYPES = [
  "id_copy",
  "bank_statement",
  "payslip",
  "employment_contract",
  "proof_of_address",
] as const;
export type RequiredDocumentType = (typeof REQUIRED_DOCUMENT_TYPES)[number];

export const MAX_FILES_PER_DOCUMENT_TYPE = 5;

export const DOCUMENT_UPLOAD_GROUPS: {
  type: RequiredDocumentType;
  label: string;
  helpText?: string;
  required: boolean;
}[] = [
  { type: "id_copy", label: "Certified ID document", required: true },
  { type: "bank_statement", label: "Latest 3 months' original bank statements", required: true },
  {
    type: "payslip",
    label: "Latest 3 months' payslips",
    helpText: "Or upload an employment contract instead, below",
    required: false,
  },
  {
    type: "employment_contract",
    label: "Employment contract",
    helpText: "Only needed if 3 months of payslips aren't available",
    required: false,
  },
  {
    type: "proof_of_address",
    label: "Proof of current address",
    helpText: "Not older than 3 months",
    required: true,
  },
];

// id_copy, bank_statement, and proof_of_address are always required; the
// payslip/employment_contract pair is an OR — either one satisfies it.
export function isDocumentSetComplete(uploadedTypes: Set<string>): boolean {
  return (
    uploadedTypes.has("id_copy") &&
    uploadedTypes.has("bank_statement") &&
    uploadedTypes.has("proof_of_address") &&
    (uploadedTypes.has("payslip") || uploadedTypes.has("employment_contract"))
  );
}

// Uploaded by admin, not the tenant — the credit check is run manually
// against TPN and the recommendation manually via LLM, both outside this
// app for now.
export const ADMIN_DOCUMENT_TYPES = ["credit_check", "ai_recommendation"] as const;
export type AdminDocumentType = (typeof ADMIN_DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  id_copy: "Certified ID document",
  bank_statement: "Bank statement (last 3 months)",
  payslip: "Payslip (last 3 months)",
  employment_contract: "Employment contract",
  proof_of_address: "Proof of address (last 3 months)",
  application_form: "Application form (PDF)",
  credit_check: "TPN credit check",
  ai_recommendation: "AI recommendation",
  other: "Other",
};
