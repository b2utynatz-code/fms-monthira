"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Newspaper,
  BookOpen,
  CalendarDays,
  FileText,
  LogIn,
  Menu,
  X,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { useAppSession } from "@/hooks/use-session";
import { hasPermission, P } from "@/features/identity";

export interface PortalLayoutClientProps {
  tenant?: {
    nameTh?: string | null;
    nameEn?: string | null;
    logoUrl?: string | null;
  } | null;
  children: React.ReactNode;
}

export function PortalLayoutClient({ tenant, children }: PortalLayoutClientProps) {
  const locale = useLocale();
  const t = useT();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const session = useAppSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session.user;
  const initials = (user?.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const canSettings = hasPermission(
    { roles: session.roles, permissions: session.permissions, isSuperAdmin: session.isSuperAdmin },
    P.settingsManage
  );

  const navLinks = [
    { href: "/portal", label: locale === "en" ? "Home" : "หน้าแรก" },
    { href: "/portal/news", label: locale === "en" ? "News" : "ข่าวประชาสัมพันธ์", icon: Newspaper },
    { href: "/portal/staff", label: locale === "en" ? "Faculty & Staff" : "ทำเนียบคณาจารย์", icon: GraduationCap },
    { href: "/portal/curriculum", label: locale === "en" ? "Curriculum" : "หลักสูตร", icon: BookOpen },
    { href: "/portal/bookings", label: locale === "en" ? "Room Schedule" : "ตารางการใช้ห้อง", icon: CalendarDays },
    { href: "/portal/documents", label: locale === "en" ? "e-Documents" : "เอกสาร/คำร้อง", icon: FileText },
  ];

  const facultyName =
    locale === "en"
      ? tenant?.nameEn || "Faculty of Management Sciences"
      : tenant?.nameTh || "คณะวิทยาการจัดการ";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Portal Navbar in Admin / Liyon Style */}
      <header className="sticky top-0 z-40 w-full h-16 flex items-center px-4 sm:px-6 lg:px-8 bg-[var(--glass)] backdrop-blur-[18px] border-b border-[var(--glass-border)] shadow-xs">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left Brand Block - Same style as Admin .brand-blk */}
          <Link
            className="brand-blk flex items-center gap-2.5 shrink-0 max-w-[240px] sm:max-w-none text-inherit no-underline"
            href="/portal"
          >
            <i className="w-[34px] h-[34px] rounded-[var(--r-sm)] flex items-center justify-center shrink-0 bg-[var(--brand)] text-[var(--on-brand)] overflow-hidden shadow-xs font-normal">
              {tenant?.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={tenant.logoUrl}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }}
                />
              ) : (
                <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-current" aria-hidden="true">
                  <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                  <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
                </svg>
              )}
            </i>
            <div className="t min-w-0">
              <b className="block text-[0.95rem] font-bold tracking-tight truncate leading-snug">{facultyName}</b>
              <span className="block text-[0.72rem] text-[var(--text-2)] whitespace-nowrap leading-none mt-0.5">
                {locale === "en" ? "Academic & Innovation Excellence" : "มหาวิทยาลัยเพื่อการพัฒนาและนวัตกรรม"}
              </span>
            </div>
          </Link>

          {/* Center Navigation Menu (Preserving all portal links) */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium bg-[var(--glass-strong)] px-2 py-1 rounded-[var(--r-md)] border border-[var(--glass-border)]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-[var(--r-ctl)] text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[var(--brand)] text-[var(--on-brand)] shadow-xs font-semibold"
                      : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-hover)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Theme toggle, Language switcher, and Staff/Admin button */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation for intermediate screens (lg to xl) */}
            <nav className="hidden md:flex xl:hidden items-center gap-2 text-xs font-medium mr-1">
              {navLinks.slice(0, 4).map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2 py-1 rounded transition-colors ${
                      isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Theme Toggle Button (Same icon-btn as Admin) */}
            <button
              type="button"
              className="icon-btn"
              aria-label={t("nav.themeToggle")}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <svg className="sun" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2v2.3M12 19.7V22M2 12h2.3M19.7 12H22M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
              </svg>
              <svg className="moon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.2 14.7A8.3 8.3 0 0 1 9.3 3.8a8.5 8.5 0 1 0 10.9 10.9Z" />
              </svg>
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher className="lang" />

            {/* Account Avatar Menu or Staff Login button */}
            {session.isLoading ? (
              <div aria-hidden="true" className="h-8 w-8 animate-pulse rounded-full bg-[var(--glass-strong)]" />
            ) : session.isAuthenticated && user ? (
              <div className="acct hidden sm:block">
                <DropdownMenuPrimitive.Root>
                  <DropdownMenuPrimitive.Trigger asChild>
                    <button type="button" aria-label={t("account.profile")}>
                      <span className="who" aria-hidden="true">
                        {user.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          initials
                        )}
                      </span>
                      <span className="nm">{user.name}</span>
                      <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </DropdownMenuPrimitive.Trigger>
                  <DropdownMenuPrimitive.Portal>
                    <DropdownMenuPrimitive.Content
                      className="menu-list"
                      align="end"
                      sideOffset={8}
                      style={{ position: "static" }}
                    >
                      <DropdownMenuPrimitive.Label asChild>
                        <div className="px-2.5 py-2">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuPrimitive.Label>
                      <DropdownMenuPrimitive.Separator asChild>
                        <hr />
                      </DropdownMenuPrimitive.Separator>
                      <DropdownMenuPrimitive.Item asChild>
                        <Link href="/dashboard">
                          <ShieldCheck className="h-4 w-4" />
                          {locale === "en" ? "Admin Console" : "ระบบหลังบ้าน"}
                        </Link>
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item asChild>
                        <Link href="/me">
                          <User className="h-4 w-4" />
                          {t("account.profile")}
                        </Link>
                      </DropdownMenuPrimitive.Item>
                      {canSettings && (
                        <DropdownMenuPrimitive.Item asChild>
                          <Link href="/settings">
                            <Settings className="h-4 w-4" />
                            {t("nav.settings")}
                          </Link>
                        </DropdownMenuPrimitive.Item>
                      )}
                      <DropdownMenuPrimitive.Separator asChild>
                        <hr />
                      </DropdownMenuPrimitive.Separator>
                      <DropdownMenuPrimitive.Item asChild onSelect={() => signOut({ callbackUrl: "/login" })}>
                        <button type="button" className="danger">
                          <LogOut className="h-4 w-4" />
                          {t("account.logout")}
                        </button>
                      </DropdownMenuPrimitive.Item>
                    </DropdownMenuPrimitive.Content>
                  </DropdownMenuPrimitive.Portal>
                </DropdownMenuPrimitive.Root>
              </div>
            ) : (
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex gap-1.5 text-xs h-8">
                <Link href="/login">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{locale === "en" ? "Staff Login" : "เข้าสู่ระบบบุคลากร"}</span>
                </Link>
              </Button>
            )}

            {/* Mobile Drawer Toggle Button */}
            <button
              type="button"
              className="icon-btn xl:hidden inline-flex"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t("nav.openDrawer")}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden absolute top-16 left-0 right-0 border-b border-[var(--glass-border)] bg-[var(--glass-strong)] backdrop-blur-[20px] px-5 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-[var(--r-ctl)] text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--brand)] text-[var(--on-brand)] font-semibold"
                      : "text-foreground hover:bg-[var(--glass-hover)]"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 border-t border-[var(--glass-border)] flex flex-col gap-2">
              {session.isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--r-ctl)] bg-[var(--glass)] border border-[var(--glass-border)]">
                    <span className="who w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--brand)] text-[var(--on-brand)] font-bold text-xs overflow-hidden">
                      {user.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        initials
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button asChild className="w-full gap-2 text-xs" size="sm">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <ShieldCheck className="h-4 w-4" />
                      <span>{locale === "en" ? "Admin Console" : "ระบบหลังบ้าน"}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full gap-2 text-xs" size="sm">
                    <Link href="/me" onClick={() => setMobileMenuOpen(false)}>
                      <User className="h-4 w-4" />
                      <span>{t("account.profile")}</span>
                    </Link>
                  </Button>
                  {canSettings && (
                    <Button asChild variant="outline" className="w-full gap-2 text-xs" size="sm">
                      <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                        <Settings className="h-4 w-4" />
                        <span>{t("nav.settings")}</span>
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 justify-center"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t("account.logout")}</span>
                  </Button>
                </div>
              ) : (
                <Button asChild className="w-full gap-2 text-xs" size="sm" variant="outline">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <LogIn className="h-4 w-4" />
                    <span>{locale === "en" ? "Staff Login" : "เข้าสู่ระบบบุคลากร"}</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer — Liyon Ink Band Theme */}
      <footer className="relative mt-20 bg-[var(--ink-band)] text-[var(--ink-band-text)] border-t border-white/10 shadow-2xl overflow-hidden">
        {/* Decorative background glow based on current brand color */}
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/3 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--brand)] opacity-10 blur-3xl pointer-events-none"
        />

        <div className="foot-in relative z-10">
          {/* Column 1: Brand, Tagline, Vision & Badges */}
          <div className="space-y-4">
            <Link className="brand-blk inline-flex items-center gap-3 text-inherit no-underline" href="/portal">
              <i className="w-[38px] h-[38px] rounded-[var(--r-sm)] flex items-center justify-center shrink-0 bg-[var(--brand)] text-[var(--on-brand)] overflow-hidden shadow-md font-normal">
                {tenant?.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={tenant.logoUrl}
                    alt="Logo"
                    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] fill-current" aria-hidden="true">
                    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
                  </svg>
                )}
              </i>
              <div className="t">
                <b className="block text-base font-bold leading-tight text-[var(--ink-band-text)]">
                  {facultyName}
                </b>
                <span className="block text-xs text-[var(--ink-band-muted)] font-normal leading-tight mt-0.5">
                  {locale === "en" ? "Faculty of Management Sciences" : "ระบบบริการสารสนเทศและบริหารงานคณะ"}
                </span>
              </div>
            </Link>

            <p className="foot-tag text-xs leading-relaxed text-[var(--ink-band-muted)] max-w-sm">
              {locale === "en"
                ? "Dedicated to cultivating leadership, business insight, and digital innovative minds for sustainable society."
                : "มุ่งมั่นผลิตบัณฑิตที่มีคุณธรรม เชี่ยวชาญวิชาการ ก้าวทันเทคโนโลยี และสร้างสรรค์นวัตกรรมเพื่อการพัฒนาสังคมอย่างยั่งยืน"}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-[var(--ink-band-text)]">
                <GraduationCap className="h-3.5 w-3.5 text-[var(--brand-light)]" />
                <span>{locale === "en" ? "Quality Education" : "มาตรฐานการศึกษาสากล"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-[var(--ink-band-text)]">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-light)]" />
                <span>{locale === "en" ? "Digital Management" : "การบริหารจัดการดิจิทัล"}</span>
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links & Internal Systems */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-band-muted)] mb-3">
                {locale === "en" ? "PORTAL" : "บริการหน้าเว็บ"}
              </h4>
              <ul className="space-y-2.5 text-xs text-[var(--ink-band-muted)]">
                <li>
                  <Link href="/portal" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "Home" : "หน้าหลัก"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/news" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "News" : "ข่าวสารและประกาศ"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/staff" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "Faculty & Staff" : "ทำเนียบคณาจารย์"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/curriculum" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "Curriculum" : "หลักสูตรทั้งหมด"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/bookings" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "Room Schedule" : "ตารางใช้ห้อง"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/documents" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "e-Documents" : "เอกสาร/คำร้อง"}</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-band-muted)] mb-3">
                {locale === "en" ? "INTERNAL" : "ระบบงานภายใน"}
              </h4>
              <ul className="space-y-2.5 text-xs text-[var(--ink-band-muted)]">
                <li>
                  <Link href="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "Admin Console" : "ระบบหลังบ้านคณะ"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/documents" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "Document Flow" : "สารบรรณและคำขอ"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/bookings" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "Reservations" : "จองห้องและยานพาหนะ"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/me" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{t("account.profile")}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink-band-text)]">
                    <ChevronRight className="h-3 w-3 opacity-60" />
                    <span>{locale === "en" ? "Staff Login" : "เข้าสู่ระบบบุคลากร"}</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Contact & Working Hours */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-band-muted)] mb-3">
              {locale === "en" ? "CONTACT & HOURS" : "ติดต่อและเวลาทำการ"}
            </h4>
            <div className="space-y-3 text-xs text-[var(--ink-band-muted)]">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--brand-light)] mt-0.5" />
                <span className="leading-relaxed">
                  {locale === "en"
                    ? "Faculty of Management Sciences, 123 University Avenue, Bangkok 10000"
                    : "คณะวิทยาการจัดการ 123 ถนนมหาวิทยาลัย แขวงในเมือง เขตเมือง กรุงเทพฯ 10000"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[var(--brand-light)]" />
                <span>02-123-4567 {locale === "en" ? "ext. 100-104" : "ต่อ 100-104"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[var(--brand-light)]" />
                <span>contact@fms.ac.th</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-[var(--brand-light)]" />
                <span>{locale === "en" ? "Mon – Fri: 08:30 – 16:30" : "จันทร์ – ศุกร์: 08:30 – 16:30 น."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="foot-bottom">
          <div className="foot-bottom-in">
            <div>
              © {new Date().getFullYear()} {facultyName}. {locale === "en" ? "All rights reserved." : "สงวนลิขสิทธิ์ทั้งหมด."}
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="opacity-80">Powered by VibeCore Framework</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-1 hover:text-[var(--ink-band-text)] transition-colors cursor-pointer"
                aria-label="Back to top"
              >
                <span>{locale === "en" ? "Back to top" : "กลับขึ้นด้านบน"}</span>
                <ArrowUp className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
