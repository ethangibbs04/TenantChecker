"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_DOCUMENT_TYPES, type AdminDocumentType } from "@/lib/application-form";

export async function uploadAdminDocument(formData: FormData) {
  const checkId = String(formData.get("check_id") ?? "");
  const documentType = String(formData.get("document_type") ?? "") as AdminDocumentType;
  const file = formData.get("file") as File | null;

  if (!ADMIN_DOCUMENT_TYPES.includes(documentType)) {
    throw new Error("Invalid document type");
  }
  if (!file || file.size === 0) {
    throw new Error("No file provided");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File is too large (max 10MB)");
  }
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only PDF, JPG, or PNG files are allowed");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const extension = file.name.split(".").pop() || "bin";
  const storagePath = `${checkId}/${documentType}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("tenant-documents")
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("documents").insert({
    check_id: checkId,
    document_type: documentType,
    uploaded_by: user.id,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type,
    file_size_bytes: file.size,
  });

  if (insertError) throw new Error(insertError.message);

  revalidatePath(`/admin/checks/${checkId}`);
}

export async function shipCheck(checkId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("ship_check", { p_check_id: checkId });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/checks/${checkId}`);
  revalidatePath("/admin");
}
