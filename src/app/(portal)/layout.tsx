import { resolveTenantSettings } from "@/features/identity/server";
import { PortalLayoutClient } from "./_components/portal-layout-client";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const tenant = await resolveTenantSettings();

  return (
    <PortalLayoutClient
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
    </PortalLayoutClient>
  );
}
