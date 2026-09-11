import Link from "next/link";
import { ArrowRight, Newspaper, GraduationCap, CalendarDays, ChevronRight, FileText, Search, Users } from "lucide-react";
import { prisma } from "@/shared/lib/infra/prisma";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { PortalValleyHero } from "../_components/portal-valley-hero";

export const dynamic = "force-dynamic";

const PROGRAM_IMAGES: Record<string, string> = {
  "CS-2026": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
  "IT-2026": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
  "DS-2026": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
};

export default async function PortalHomePage() {
  const locale = await getLocale();

  // Find demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
  });

  const tenantId = tenant?.id || "";

  // Query public data
  const [recentNews, programs, staffCount] = await Promise.all([
    prisma.newsArticle.findMany({
      where: { tenantId, status: "PUBLISHED" },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 6,
    }),
    prisma.academicProgram.findMany({
      where: { tenantId, status: { in: ["OPEN_ADMISSION", "ACTIVE"] } },
      orderBy: { degreeLevel: "asc" },
      take: 4,
    }),
    prisma.facultyMember.count({ where: { tenantId, isActive: true } }),
  ]);

  return (
    <div className="space-y-16 pb-16">
      {/* Cinematic Valley Hero Section */}
      <PortalValleyHero locale={locale} staffCount={staffCount} />

      {/* Quick Services & e-Tracking Search Hub */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="rounded-2xl border bg-card/95 backdrop-blur-md p-6 shadow-md max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="font-bold text-base md:text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>{locale === "en" ? "e-Tracking & Quick Public Services" : "ระบบสืบค้นเอกสารและติดตามสถานะคำขอ (e-Tracking)"}</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {locale === "en"
                  ? "Enter your tracking code or download official faculty request forms."
                  : "กรอกรหัสติดตามเอกสาร หรือดาวน์โหลดแบบฟอร์มคำขอมาตรฐานของคณะ"}
              </p>
            </div>

            <form action="/portal/documents" method="GET" className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                name="track"
                placeholder={locale === "en" ? "e.g. TRK-ICSE26" : "เช่น TRK-ICSE26 หรือ TRK-FORM01"}
                className="w-full md:w-56 rounded-md border px-3 py-1.5 text-xs font-mono placeholder:font-sans"
              />
              <Button type="submit" size="sm" className="gap-1 text-xs shrink-0">
                <Search className="h-3.5 w-3.5" />
                <span>{locale === "en" ? "Track" : "ติดตาม"}</span>
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <Link
              href="/portal/curriculum"
              className="p-3 rounded-xl border bg-background/50 hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center gap-1.5 group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-semibold text-xs">{locale === "en" ? "All Programs" : "หลักสูตรทั้งหมด"}</span>
              <span className="text-[10px] text-muted-foreground">{locale === "en" ? "Bachelor / Master / Ph.D." : "ป.ตรี / โท / เอก"}</span>
            </Link>

            <Link
              href="/portal/staff"
              className="p-3 rounded-xl border bg-background/50 hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center gap-1.5 group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <span className="font-semibold text-xs">{locale === "en" ? "Faculty Directory" : "ทำเนียบคณาจารย์"}</span>
              <span className="text-[10px] text-muted-foreground">{locale === "en" ? "Contact & Rooms" : "ช่องทางติดต่อและห้อง"}</span>
            </Link>

            <Link
              href="/portal/bookings"
              className="p-3 rounded-xl border bg-background/50 hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center gap-1.5 group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <CalendarDays className="h-5 w-5" />
              </div>
              <span className="font-semibold text-xs">{locale === "en" ? "Facility Schedule" : "ตารางการใช้ห้อง"}</span>
              <span className="text-[10px] text-muted-foreground">{locale === "en" ? "Meeting & Vehicle" : "ห้องประชุมและรถยนต์"}</span>
            </Link>

            <Link
              href="/portal/documents"
              className="p-3 rounded-xl border bg-background/50 hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center gap-1.5 group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <span className="font-semibold text-xs">{locale === "en" ? "Forms & Memos" : "แบบฟอร์มคำขอ"}</span>
              <span className="text-[10px] text-muted-foreground">{locale === "en" ? "Download PDF" : "ดาวน์โหลดเอกสาร"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Programs Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">

              {locale === "en" ? "Academics" : "การศึกษาและหลักสูตร"}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {locale === "en" ? "Featured Programs" : "หลักสูตรเด่นที่เปิดรับสมัคร"}
            </h2>
          </div>
          <Link href="/portal/curriculum" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            <span>{locale === "en" ? "View all" : "ดูทั้งหมด"}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.length > 0 ? (
            programs.map((prog) => {
              const imgUrl = PROGRAM_IMAGES[prog.code] || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80";
              return (
                <div key={prog.id} className="group rounded-xl border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="h-36 w-full bg-muted relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-background/90 backdrop-blur shadow-xs text-primary">
                        <GraduationCap className="h-3 w-3" />
                        <span>{prog.degreeLevel}</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {locale === "en" ? prog.nameEn : prog.nameTh}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {locale === "en" ? prog.degreeEn : prog.degreeTh}
                      </p>
                    </div>
                    <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span>{prog.durationYears} {locale === "en" ? "Yrs" : "ปี"}</span>
                      <Link href="/portal/curriculum" className="font-medium text-primary hover:underline">
                        {locale === "en" ? "Details →" : "รายละเอียด →"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground text-sm border rounded-xl">
              {locale === "en" ? "Programs are being updated" : "กำลังปรับปรุงข้อมูลหลักสูตร"}
            </div>
          )}
        </div>
      </section>

      {/* News & Announcements Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              {locale === "en" ? "News & Events" : "ข่าวสารและกิจกรรม"}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {locale === "en" ? "Latest Announcements" : "ข่าวสารประชาสัมพันธ์ล่าสุด"}
            </h2>
          </div>
          <Link href="/portal/news" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            <span>{locale === "en" ? "All news" : "ข่าวทั้งหมด"}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentNews.length > 0 ? (
            recentNews.map((news) => (
              <div key={news.id} className="group rounded-xl border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
                <div className="h-48 bg-muted/60 relative overflow-hidden flex items-center justify-center">
                  {news.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={news.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {news.category}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {news.publishedAt ? formatDate(news.publishedAt, locale) : "—"}
                    </div>
                    <h3 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-2">
                      {locale === "en" ? news.titleEn : news.titleTh}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {locale === "en" ? news.summaryEn : news.summaryTh}
                    </p>
                  </div>
                  <Link href={`/portal/news/${news.slug}`} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 pt-2">
                    <span>{locale === "en" ? "Read full article" : "อ่านต่อ"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground text-sm border rounded-xl">
              {locale === "en" ? "No news published yet" : "ยังไม่มีข่าวสารที่เผยแพร่"}
            </div>
          )}
        </div>
      </section>

      {/* Services Banner */}
      <section className="container mx-auto px-4">
        <div className="rounded-2xl bg-muted/50 border p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <h3 className="text-2xl font-bold tracking-tight">
              {locale === "en" ? "Internal Staff & Student Services" : "บริการดิจิทัลสำหรับบุคลากรและนักศึกษา"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "Access internal document workflows, academic leave submissions, conference room reservations, and vehicle booking through single sign-on."
                : "เข้าถึงระบบบริหารจัดการเอกสารอิเล็กทรอนิกส์ การขออนุมัติเดินทางไปราชการ ตลอดจนการจองห้องประชุมและยานพาหนะส่วนกลางของคณะ"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild variant="outline">
              <Link href="/portal/bookings">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>{locale === "en" ? "Room Schedule" : "ปฏิทินห้องประชุม"}</span>
              </Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                <span>{locale === "en" ? "Log in to Portal" : "เข้าสู่ระบบหลังบ้าน"}</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
