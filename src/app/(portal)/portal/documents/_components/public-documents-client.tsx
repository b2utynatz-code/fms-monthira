"use client";

import { useState, useTransition } from "react";
import { Search, FileText, Download, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { trackDocumentPublicAction } from "@/features/documents/actions";
import type { DocumentRequestDto } from "@/features/documents";
import { formatDate } from "@/shared/lib/format";
import { Button } from "@/components/ui/button";

interface PublicDocItem {
  id: string;
  docNumber: string | null;
  title: string;
  docType: string;
  fileUrl: string | null;
  createdAt: string;
}

interface PublicDocumentsClientProps {
  initialDocs: PublicDocItem[];
  locale: "th" | "en";
}

export function PublicDocumentsClient({ initialDocs, locale }: PublicDocumentsClientProps) {
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<DocumentRequestDto | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [searchFilter, setSearchFilter] = useState("");

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    startTransition(async () => {
      setSearchAttempted(true);
      const res = await trackDocumentPublicAction(trackingCode.trim());
      if (res.ok) {
        setTrackingResult(res.data);
      } else {
        setTrackingResult(null);
      }
    });
  };

  const filteredDocs = initialDocs.filter((doc) =>
    doc.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (doc.docNumber && doc.docNumber.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero & e-Tracking Section */}
      <div className="bg-muted/40 border-b py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{locale === "en" ? "Faculty e-Document & e-Tracking" : "ระบบสารบรรณและติดตามสถานะเอกสาร"}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {locale === "en" ? "Document Tracking & Public Forms" : "ติดตามสถานะคำขอและดาวน์โหลดแบบฟอร์ม"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            {locale === "en"
              ? "Check the real-time review status of your submitted academic requests or download faculty forms."
              : "ตรวจสอบความคืบหน้าการพิจารณาคำร้องและคำขอเอกสารด้วยรหัส e-Tracking หรือดาวน์โหลดแบบฟอร์มคำร้องคณะ"}
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchTracking} className="pt-4 max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder={locale === "en" ? "Enter Tracking Code (e.g. TRK-ABC123)..." : "กรอกรหัสติดตามสถานะ (เช่น TRK-ABC123)..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm shadow-xs focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
            <Button type="submit" disabled={isPending} className="gap-2 px-5">
              <span>{locale === "en" ? "Track" : "ตรวจสอบ"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Tracking Result Card */}
          {searchAttempted && (
            <div className="pt-6 max-w-xl mx-auto text-left">
              {trackingResult ? (
                <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {locale === "en" ? "Tracking Code" : "รหัสติดตาม"}: <span className="font-mono font-semibold text-foreground">{trackingResult.trackingCode}</span>
                      </div>
                      <h2 className="font-bold text-base text-foreground mt-0.5">{trackingResult.title}</h2>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        trackingResult.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : trackingResult.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600"
                          : trackingResult.status === "RETURNED"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {trackingResult.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      {locale === "en" ? "Approval Progress" : "ความคืบหน้าการพิจารณา"}: ขั้นตอนที่ {trackingResult.currentStep} จาก {trackingResult.totalSteps}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{
                          width: `${(trackingResult.currentStep / trackingResult.totalSteps) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{locale === "en" ? "Submitted" : "ยื่นเรื่อง"}: {trackingResult.submittedAt ? formatDate(new Date(trackingResult.submittedAt), locale) : "—"}</span>
                      <span>{trackingResult.completedAt ? (locale === "en" ? "Completed" : "เสร็จสิ้น") : (locale === "en" ? "In Review" : "กำลังพิจารณา")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{locale === "en" ? "No document found with this tracking code. Please check and try again." : "ไม่พบข้อมูลเอกสารด้วยรหัสติดตามนี้ โปรดตรวจสอบรหัสและลองใหม่อีกครั้ง"}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Public Repository / Forms Section */}
      <div className="container mx-auto px-4 max-w-5xl pt-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {locale === "en" ? "Public Forms & Official Orders" : "แบบฟอร์มคำร้องและคำสั่งคณะเผยแพร่ทั่วไป"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {locale === "en" ? "Official downloadable forms for students and staff." : "เอกสารคำร้องและระเบียบประกาศสำหรับการติดต่อราชการภายในคณะ"}
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={locale === "en" ? "Search documents..." : "ค้นหาเอกสาร..."}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border bg-background text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all flex items-start justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                      <span className="font-mono">{doc.docNumber || "—"}</span>
                      <span>•</span>
                      <span>{formatDate(new Date(doc.createdAt), locale)}</span>
                    </div>
                  </div>
                </div>

                {doc.fileUrl ? (
                  <Button asChild size="sm" variant="outline" className="gap-1.5 shrink-0 text-xs">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5" />
                      <span>{locale === "en" ? "Download" : "ดาวน์โหลด"}</span>
                    </a>
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground shrink-0 mt-2">
                    {locale === "en" ? "No file" : "เอกสารข้อความ"}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground text-sm border rounded-xl">
              {locale === "en" ? "No public documents available" : "ไม่มีเอกสารเผยแพร่ในขณะนี้"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
