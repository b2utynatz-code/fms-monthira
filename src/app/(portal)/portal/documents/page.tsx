import { prisma } from "@/shared/lib/infra/prisma";
import { getLocale } from "@/shared/lib/i18n/server";
import { PublicDocumentsClient } from "./_components/public-documents-client";

export default async function PublicDocumentsPortalPage() {
  const locale = await getLocale();

  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
  });
  const tenantId = tenant?.id || "";

  // ดึงรายการประกาศและแบบฟอร์มคำร้องที่เป็นสาธารณะ
  const publicDocs = await prisma.documentRequest.findMany({
    where: {
      tenantId,
      accessLevel: "PUBLIC",
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const formattedDocs = publicDocs.map((doc) => ({
    id: doc.id,
    docNumber: doc.docNumber,
    title: doc.title,
    docType: doc.docType,
    fileUrl: doc.fileUrl,
    createdAt: doc.createdAt.toISOString(),
  }));

  return <PublicDocumentsClient initialDocs={formattedDocs} locale={locale} />;
}
