import { requirePermission, hasPermission } from "@/features/identity/server";
import { DOCUMENTS_P, listDocumentRequests } from "@/features/documents/server";
import { DocumentsClient } from "./_components/documents-client";

export default async function DocumentsPage() {
  const ctx = await requirePermission(DOCUMENTS_P.documentRead);
  const initialItems = await listDocumentRequests(ctx.tenantId);
  return (
    <DocumentsClient
      initialItems={initialItems}
      currentUserId={ctx.userId}
      canApprove={hasPermission(ctx, DOCUMENTS_P.documentApprove)}
      canManage={hasPermission(ctx, DOCUMENTS_P.documentManage)}
    />
  );
}
