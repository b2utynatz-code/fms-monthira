"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Loader2, User, Settings } from "lucide-react";
import { AdminShell, useBreadcrumbTailItems, type Crumb } from "@/shared/components/liyon";
import { AdminSidebarNav } from "@/components/layout/admin-sidebar-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useSidebarStore } from "@/components/layout/sidebar-store";
import { getActiveNavChain } from "@/components/layout/sidebar-nav";
import { useAppSession } from "@/hooks/use-session";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { localizedName } from "@/shared/lib/format";
import { hasPermission, P } from "@/features/identity";

export interface AdminLayoutClientProps {
  tenant?: {
    nameTh?: string | null;
    nameEn?: string | null;
    logoUrl?: string | null;
    statement?: {
      sloganTh?: string | null;
      sloganEn?: string | null;
    } | null;
  } | null;
  children: React.ReactNode;
}

export function AdminLayoutClient({ tenant, children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const t = useT();
  const locale = useLocale();
  const tail = useBreadcrumbTailItems();
  const { status, user, roles, permissions, isSuperAdmin } = useAppSession();
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prev, setPrev] = useState(pathname);
  const [mounted, setMounted] = useState(false);
  const [previewTenant, setPreviewTenant] = useState<Partial<{
    nameTh?: string | null;
    nameEn?: string | null;
    logoUrl?: string | null;
    statement?: {
      sloganTh?: string | null;
      sloganEn?: string | null;
    } | null;
  }> | null>(null);

  useEffect(() => {
    const handlePreview = (e: Event) => {
      const customEvent = e as CustomEvent<{
        nameTh?: string;
        nameEn?: string;
        logoUrl?: string;
        sloganTh?: string;
        sloganEn?: string;
      }>;
      if (customEvent.detail) {
        setPreviewTenant((prev) => ({
          nameTh: customEvent.detail.nameTh !== undefined ? customEvent.detail.nameTh : (prev?.nameTh ?? tenant?.nameTh),
          nameEn: customEvent.detail.nameEn !== undefined ? customEvent.detail.nameEn : (prev?.nameEn ?? tenant?.nameEn),
          logoUrl: customEvent.detail.logoUrl !== undefined ? customEvent.detail.logoUrl : (prev?.logoUrl ?? tenant?.logoUrl),
          statement: {
            sloganTh: customEvent.detail.sloganTh !== undefined ? customEvent.detail.sloganTh : (prev?.statement?.sloganTh ?? tenant?.statement?.sloganTh),
            sloganEn: customEvent.detail.sloganEn !== undefined ? customEvent.detail.sloganEn : (prev?.statement?.sloganEn ?? tenant?.statement?.sloganEn),
          },
        }));
      }
    };

    window.addEventListener("tenant-brand-preview", handlePreview);
    return () => window.removeEventListener("tenant-brand-preview", handlePreview);
  }, [tenant]);

  if (pathname !== prev) {
    setPrev(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);


  if (!mounted || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = (user?.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const chain = getActiveNavChain(pathname);
  const breadcrumb: Crumb[] =
    chain.length === 0 && tail.length === 0
      ? []
      : [{ label: t("nav.home"), href: "/dashboard" }, ...chain.map((c) => ({ label: t(c.title), href: c.href })), ...tail];
  const ctx = { roles, permissions, isSuperAdmin };
  const links = [
    { href: "/me", label: t("account.profile"), icon: <User className="h-4 w-4" /> },
    ...(hasPermission(ctx, P.settingsManage) ? [{ href: "/settings", label: t("nav.settings"), icon: <Settings className="h-4 w-4" /> }] : []),
  ];

  const activeTenant = {
    ...tenant,
    ...previewTenant,
    statement: {
      ...tenant?.statement,
      ...previewTenant?.statement,
    },
  };

  const brandName = locale === "en" ? (activeTenant?.nameEn || t("app.name")) : (activeTenant?.nameTh || t("app.name"));
  const brandTagline = locale === "en"
    ? (activeTenant?.statement?.sloganEn || t("app.tagline"))
    : (activeTenant?.statement?.sloganTh || t("app.tagline"));

  return (
    <AdminShell
      brandName={brandName}
      brandTagline={brandTagline}
      brandHref="/dashboard"
      brandLogo={activeTenant?.logoUrl}
      breadcrumb={breadcrumb}
      breadcrumbLabel={t("common.breadcrumb")}
      roleLabel={roles[0] ? localizedName(roles[0], locale) : null}
      languageSwitcher={<LanguageSwitcher className="lang" />}
      notifications={null}
      account={
        user
          ? {
              name: user.name ?? "",
              email: user.email ?? "",
              imageUrl: user.image,
              initials,
              links,
              onSignOut: () => signOut({ callbackUrl: "/login" }),
              signOutLabel: t("account.logout"),
            }
          : null
      }
      accountLoading={!user}
      themeToggleLabel={t("nav.themeToggle")}
      collapsed={collapsed}
      onToggleCollapsed={toggleCollapsed}
      collapseLabel={t("nav.collapse")}
      expandLabel={t("nav.expand")}
      drawerOpen={drawerOpen}
      onToggleDrawer={() => setDrawerOpen((v) => !v)}
      onCloseDrawer={() => setDrawerOpen(false)}
      drawerLabel={t("nav.openDrawer")}
      sidebarAriaLabel={t("nav.menu")}
      sidebarNav={<AdminSidebarNav />}
    >
      {children}
    </AdminShell>
  );
}
