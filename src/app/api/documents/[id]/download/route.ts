import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mints a short-lived signed URL and redirects to it. Deliberately a
// server route rather than a client-side signed-URL fetch: this is the
// single choke point where every package-document view/download gets
// logged via log_audit(), closing the POPIA accountability gap the
// architecture review flagged (see Plan.md Phase 6). RLS on `documents`
// already restricts SELECT to admins, the uploading tenant, or the
// landlord of a COMPLETED check's package documents — so a landlord
// requesting someone else's document, or their own before shipping,
// simply finds no row rather than needing a manual ownership check here.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isView = new URL(request.url).searchParams.get("view") === "1";

  const { data: doc } = await supabase
    .from("documents")
    .select("id, check_id, document_type, storage_path, is_package_document")
    .eq("id", id)
    .single();

  if (!doc || !doc.is_package_document) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Viewing renders inline in the browser (no Content-Disposition override);
  // downloading forces a save-to-disk prompt.
  const { data: signed, error: signError } = await supabase.storage
    .from("tenant-documents")
    .createSignedUrl(doc.storage_path, 60, isView ? undefined : { download: true });

  if (signError || !signed) {
    return new NextResponse("Could not generate link", { status: 500 });
  }

  await supabase.rpc("log_audit", {
    p_action: isView ? "document.viewed" : "document.downloaded",
    p_entity_type: "document",
    p_entity_id: doc.id,
    p_metadata: { document_type: doc.document_type, check_id: doc.check_id },
  });

  return NextResponse.redirect(signed.signedUrl);
}
