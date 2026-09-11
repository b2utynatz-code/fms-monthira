import { resolveTenantSettings } from "@/features/identity/server";
import { AdminLayoutClient } from "./_components/admin-layout-client";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const tenant = await resolveTenantSettings();

  return (
    <AdminLayoutClient
      tenant={
        tenant
          ? {
              nameTh: tenant.nameTh,
              nameEn: tenant.nameEn,
              logoUrl: tenant.logoUrl,
            }
          : null
      }
    >
      {children}
    </AdminLayoutClient>
  );
}
