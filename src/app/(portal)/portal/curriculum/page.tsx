import Link from "next/link";
import { GraduationCap, Clock, ArrowRight } from "lucide-react";
import { prisma } from "@/shared/lib/infra/prisma";
import { getLocale } from "@/shared/lib/i18n/server";
import { Button } from "@/components/ui/button";

const PROGRAM_IMAGES: Record<string, string> = {
  "CS-2026": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
  "IT-2026": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
  "DS-2026": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
};

export default async function PublicCurriculumPage() {
  const locale = await getLocale();
  const tenant = await prisma.tenant.findFirst({ where: { isActive: true } });
  const tenantId = tenant?.id || "";

  const programs = await prisma.academicProgram.findMany({
    where: { tenantId, status: { not: "CLOSED" } },
    orderBy: [{ degreeLevel: "asc" }, { code: "asc" }],
  });

  return (
    <div className="container mx-auto px-4 py-12 space-y-10">
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {locale === "en" ? "Academic Programs & Curriculum" : "หลักสูตรและการจัดการศึกษา"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {locale === "en"
            ? "Discover our diverse undergraduate and graduate degree programs designed for real-world competency."
            : "หลักสูตรระดับปริญญาตรี โท และเอก ที่มุ่งเน้นการสร้างสรรค์บัณฑิตนักปฏิบัติและผู้ประกอบการนวัตกรรม"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.length > 0 ? (
          programs.map((prog) => {
            const name = locale === "en" ? prog.nameEn : prog.nameTh;
            const degree = locale === "en" ? prog.degreeEn : prog.degreeTh;
            const isOpen = prog.status === "OPEN_ADMISSION";
            const imgUrl = PROGRAM_IMAGES[prog.code] || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80";

            return (
              <div
                key={prog.id}
                className="group rounded-2xl border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="h-44 w-full bg-muted relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full shadow-xs backdrop-blur bg-background/90 ${
                        isOpen
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isOpen
                        ? (locale === "en" ? "Open for Admission" : "เปิดรับสมัคร")
                        : (locale === "en" ? "Active" : "จัดการเรียนการสอน")}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                      {prog.code}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        isOpen
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isOpen
                        ? (locale === "en" ? "Open for Admission" : "เปิดรับสมัคร")
                        : (locale === "en" ? "Active" : "จัดการเรียนการสอน")}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors">
                    {name}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {degree}
                  </p>

                  <div className="text-xs font-medium text-muted-foreground pt-1">
                    {prog.department}
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{prog.durationYears} {locale === "en" ? "Years" : "ปี"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>{prog.totalCredits} {locale === "en" ? "Credits" : "หน่วยกิต"}</span>
                    </div>
                  </div>

                  {prog.tuitionFeePerTerm && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        ฿{Number(prog.tuitionFeePerTerm).toLocaleString()}
                      </span>{" "}
                      / {locale === "en" ? "semester" : "ภาคการศึกษา"}
                    </div>
                  )}

                  {isOpen && (
                    <Button asChild size="sm" className="w-full gap-2">
                      <Link href={prog.admissionLink || "#"} target="_blank">
                        <span>{locale === "en" ? "Apply Now" : "สมัครเข้าศึกษา"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground text-sm border rounded-xl">
            {locale === "en" ? "No academic programs found" : "ไม่พบข้อมูลหลักสูตร"}
          </div>
        )}
      </div>
    </div>
  );
}
