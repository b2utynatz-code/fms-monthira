import Link from "next/link";
import {
  FileText,
  CalendarDays,
  Newspaper,
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  ArrowRight,
  ExternalLink,
  Activity,
  Car,
  DoorOpen,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { requireSession, getDashboardStats } from "@/features/identity/server";
import { getT } from "@/i18n/server";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { LiyonCard, StatusPill } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { prisma } from "@/shared/lib/infra/prisma";

export default async function DashboardPage() {
  const ctx = await requireSession();
  const [
    t,
    locale,
    identityStats,
    pendingDocsCount,
    urgentDocs,
    upcomingBookings,
    publishedNewsCount,
    staffCount,
    programsCount,
    recentAuditLogs,
  ] = await Promise.all([
    getT(),
    getLocale(),
    getDashboardStats(ctx.tenantId),
    prisma.documentRequest.count({
      where: { tenantId: ctx.tenantId, status: { in: ["SUBMITTED", "PENDING_REVIEW", "IN_REVIEW"] } },
    }),
    prisma.documentRequest.findMany({
      where: { tenantId: ctx.tenantId, status: { in: ["SUBMITTED", "PENDING_REVIEW", "IN_REVIEW"] } },
      include: { requester: { select: { name: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.bookingReservation.findMany({
      where: { tenantId: ctx.tenantId, status: "APPROVED", endTime: { gte: new Date() } },
      include: { resource: { select: { nameTh: true, type: true } }, user: { select: { name: true } } },
      orderBy: { startTime: "asc" },
      take: 4,
    }),
    prisma.newsArticle.count({ where: { tenantId: ctx.tenantId, status: "PUBLISHED" } }),
    prisma.facultyMember.count({ where: { tenantId: ctx.tenantId, isActive: true } }),
    prisma.academicProgram.count({ where: { tenantId: ctx.tenantId, status: { in: ["ACTIVE", "OPEN_ADMISSION"] } } }),
    prisma.auditLog.findMany({
      where: { tenantId: ctx.tenantId },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const kpis = [
    {
      label: t("dash.pendingDocs"),
      value: pendingDocsCount,
      icon: FileText,
      tone: pendingDocsCount > 0 ? "warn" : "ok",
      href: "/documents",
      desc: "เอกสารที่รอการตรวจสอบ/ลงนาม",
    },
    {
      label: t("dash.todayBookings"),
      value: upcomingBookings.length,
      icon: CalendarDays,
      tone: "info",
      href: "/bookings",
      desc: "การใช้ห้องและรถยนต์ที่อนุมัติแล้ว",
    },
    {
      label: t("dash.publishedNews"),
      value: publishedNewsCount,
      icon: Newspaper,
      tone: "ok",
      href: "/news",
      desc: "ข่าวประชาสัมพันธ์และประกาศ",
    },
    {
      label: t("dash.facultyStaff"),
      value: staffCount,
      icon: GraduationCap,
      tone: "info",
      href: "/staff",
      desc: "คณาจารย์และบุคลากรในระบบ",
    },
    {
      label: t("dash.academicPrograms"),
      value: programsCount,
      icon: BookOpen,
      tone: "ok",
      href: "/curriculum",
      desc: "หลักสูตรมาตรฐานที่เปิดสอน",
    },
    {
      label: t("dash.users"),
      value: identityStats.users,
      icon: Users,
      tone: "off",
      href: "/users",
      desc: `ผู้ใช้ที่เปิดใช้งาน: ${identityStats.activeUsers}`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("dash.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dash.welcome", { name: ctx.userName })} • {formatDate(new Date(), locale)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/portal" target="_blank">
              <ExternalLink className="h-4 w-4" />
              <span>{t("dash.portalLink")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} href={kpi.href} className="block group">
              <LiyonCard className="p-4 h-full flex flex-col justify-between transition-all group-hover:border-primary/50 group-hover:shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground truncate">{kpi.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight">{kpi.value}</div>
                  <p className="text-[11px] text-muted-foreground truncate mt-1">{kpi.desc}</p>
                </div>
              </LiyonCard>
            </Link>
          );
        })}
      </div>

      {/* Main Command Center: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Actionable Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Pending Approvals */}
          <LiyonCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-bold tracking-tight">{t("dash.urgentApprovals")}</h2>
              </div>
              <Link href="/documents" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
                <span>{t("dash.viewAll")} ({pendingDocsCount})</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {urgentDocs.length > 0 ? (
              <div className="divide-y text-sm">
                {urgentDocs.map((doc) => (
                  <div key={doc.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {doc.trackingCode}
                        </span>
                        {doc.priority === "URGENT" || doc.priority === "VERY_URGENT" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {doc.priority === "VERY_URGENT" ? "ด่วนที่สุด" : "ด่วน"}
                          </span>
                        ) : null}
                      </div>
                      <Link href="/documents" className="font-medium hover:underline hover:text-primary block line-clamp-1">
                        {doc.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        ผู้เสนอ: {doc.requester.name} {doc.department ? `(${doc.department})` : ""} • ขั้นตอนที่ {doc.currentStep}/{doc.totalSteps}
                      </div>
                    </div>

                    <Button asChild size="sm" variant="outline" className="shrink-0 text-xs">
                      <Link href="/documents">พิจารณา</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
                <span>ไม่มีเอกสารรอการพิจารณาในขณะนี้ ระบบงานเป็นปัจจุบันเรียบร้อย</span>
              </div>
            )}
          </LiyonCard>

          {/* Upcoming Facility Schedule */}
          <LiyonCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-sky-600" />
                <h2 className="text-base font-bold tracking-tight">{t("dash.schedule")}</h2>
              </div>
              <Link href="/bookings" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
                <span>{t("dash.viewAll")}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingBookings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingBookings.map((b) => {
                  const start = new Date(b.startTime);
                  const end = new Date(b.endTime);
                  return (
                    <div key={b.id} className="border rounded-lg p-3.5 space-y-2 bg-card">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary truncate">
                          {b.resource.type === "MEETING_ROOM" ? (
                            <DoorOpen className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                          ) : (
                            <Car className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          )}
                          <span className="truncate">{b.resource.nameTh}</span>
                        </div>
                        <StatusPill tone="ok">อนุมัติแล้ว</StatusPill>
                      </div>
                      <div className="font-medium text-xs line-clamp-1">{b.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                        <span>{formatDate(start, locale)}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                ไม่มีรายการจองห้องหรือรถยนต์ที่ได้รับอนุมัติในช่วงเวลานี้
              </div>
            )}
          </LiyonCard>
        </div>

        {/* Right Column: Quick Actions & Audit Stream */}
        <div className="space-y-6">
          {/* Quick Action Shortcuts */}
          <LiyonCard className="p-6 space-y-4">
            <h2 className="text-base font-bold tracking-tight">{t("dash.quickActions")}</h2>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="justify-start gap-2.5 h-10">
                <Link href="/documents">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span>ยื่นคำขอเอกสารใหม่ (Submit Document)</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2.5 h-10">
                <Link href="/bookings">
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  <span>จองห้องประชุม / รถยนต์ (Reserve Room/Van)</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2.5 h-10">
                <Link href="/news">
                  <Newspaper className="h-4 w-4 text-emerald-600" />
                  <span>เผยแพร่ข่าวสารประชาสัมพันธ์ (Publish News)</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2.5 h-10">
                <Link href="/staff">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <span>ปรับปรุงทำเนียบคณาจารย์ (Update Faculty)</span>
                </Link>
              </Button>
            </div>
          </LiyonCard>

          {/* Recent Audit Feed */}
          <LiyonCard className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold tracking-tight">{t("dash.recentActivity")}</h2>
            </div>

            {recentAuditLogs.length > 0 ? (
              <div className="space-y-3">
                {recentAuditLogs.map((log) => (
                  <div key={log.id} className="text-xs space-y-1 pb-3 border-b last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-medium text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {log.action.replace(/\./g, " : ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-muted-foreground truncate">
                      โดย: <span className="text-foreground font-medium">{log.actor?.name ?? "ระบบ (System)"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-4 text-center">
                ยังไม่มีประวัติการดำเนินงานในระบบ
              </div>
            )}
          </LiyonCard>
        </div>
      </div>
    </div>
  );
}

