import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { APPLICATION_FORM_FIELDS, type ApplicationFormData } from "./application-form";

// Mirrors the look of the tenant's actual form UI (ApplicationForm —
// label above a bordered value box, same field order) so the landlord's
// downloaded PDF reads like the form the tenant actually filled out,
// not a generic data dump.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#171717" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#525252", marginBottom: 2 },
  divider: {
    marginTop: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  field: { marginBottom: 12 },
  label: { fontSize: 9, color: "#525252", marginBottom: 4 },
  valueBox: {
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minHeight: 22,
  },
  value: { fontSize: 10, color: "#171717" },
  valueEmpty: { fontSize: 10, color: "#a3a3a3" },
});

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
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Tenantcheck application — {propertyLabel}</Text>
        <Text style={styles.subtitle}>{tenantName}</Text>
        <Text style={styles.subtitle}>
          Submitted {submittedAt ? new Date(submittedAt).toLocaleString() : "—"}
        </Text>
        <View style={styles.divider} />

        {APPLICATION_FORM_FIELDS.map((field) => {
          const raw = formData?.[field.name];
          return (
            <View key={field.name} style={styles.field} wrap={false}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.valueBox}>
                <Text style={raw ? styles.value : styles.valueEmpty}>
                  {raw || "Not answered"}
                </Text>
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
