"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Newspaper, BookOpen, CalendarDays, FileText, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/shared/lib/i18n/client";

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
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Public Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-3">
            {tenant?.logoUrl ? (
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-background border flex items-center justify-center p-0.5 shadow-sm shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tenant.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm shrink-0">
                {tenant?.nameTh ? tenant.nameTh.charAt(0) : "F"}
              </div>
            )}
            <div>
              <div className="font-bold text-base leading-none tracking-tight">{facultyName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {locale === "en" ? "Academic & Innovation Excellence" : "มหาวิทยาลัยเพื่อการพัฒนาและนวัตกรรม"}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-primary ${
                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher className="scale-90" />
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span>{locale === "en" ? "Staff Login" : "เข้าสู่ระบบบุคลากร"}</span>
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher className="scale-90" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b bg-background px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-foreground hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t">
              <Button asChild className="w-full gap-2" size="sm">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="h-4 w-4" />
                  <span>{locale === "en" ? "Staff Login" : "เข้าสู่ระบบบุคลากร"}</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="border-t bg-muted/40 py-12 text-sm">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              {tenant?.logoUrl && (
                <div className="h-7 w-7 rounded-lg overflow-hidden bg-background border flex items-center justify-center p-0.5 shadow-xs shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tenant.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              )}
              <div className="font-bold text-base">{facultyName}</div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "Dedicated to cultivating leadership, business insight, and digital innovative minds for sustainable society."
                : "มุ่งมั่นผลิตบัณฑิตที่มีคุณธรรม เชี่ยวชาญวิชาการ ก้าวทันเทคโนโลยี และสร้างสรรค์นวัตกรรมสู่สากล"}
            </p>
          </div>

          <div>
            <div className="font-semibold mb-3">{locale === "en" ? "Quick Links" : "ลิงก์ด่วน"}</div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/portal/curriculum" className="hover:text-primary">
                  {locale === "en" ? "Curriculum" : "หลักสูตรทั้งหมด"}
                </Link>
              </li>
              <li>
                <Link href="/portal/staff" className="hover:text-primary">
                  {locale === "en" ? "Faculty Members" : "ทำเนียบอาจารย์"}
                </Link>
              </li>
              <li>
                <Link href="/portal/news" className="hover:text-primary">
                  {locale === "en" ? "Announcements" : "ประกาศและข่าวสาร"}
                </Link>
              </li>
              <li>
                <Link href="/portal/bookings" className="hover:text-primary">
                  {locale === "en" ? "Room Schedule" : "ปฏิทินห้องประชุม"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-3">{locale === "en" ? "Internal Systems" : "ระบบงานภายใน"}</div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-primary">
                  {locale === "en" ? "Admin Console" : "ระบบหลังบ้านคณะ (Admin)"}
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-primary">
                  {locale === "en" ? "Document Workflow" : "ระบบสารบรรณและคำขอ"}
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-primary">
                  {locale === "en" ? "Resource Reservations" : "ระบบจองห้องและยานพาหนะ"}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground mb-3">{locale === "en" ? "Contact Us" : "ติดต่อคณะ"}</div>
            <p>123 ถนนมหาวิทยาลัย ตำบลในเมือง อำเภอเมือง จังหวัดกรุงเทพฯ 10000</p>
            <p>โทรศัพท์: 02-123-4567 ต่อ 100-104</p>
            <p>อีเมล: contact@fms.ac.th</p>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {facultyName}. Powered by VibeCore Framework.
        </div>
      </footer>
    </div>
  );
}
