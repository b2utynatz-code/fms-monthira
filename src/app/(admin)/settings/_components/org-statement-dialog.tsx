"use client";

import { useState } from "react";
import { Globe, Check, BookOpen, Target, Compass, Award } from "lucide-react";
import { toast } from "sonner";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonField,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import type { OrgStatementSettings } from "@/features/identity";

interface OrgStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: OrgStatementSettings;
  onSave: (statement: OrgStatementSettings) => void;
  hasGeminiKey?: boolean;
}

export function OrgStatementDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  hasGeminiKey: _hasGeminiKey = false,
}: OrgStatementDialogProps) {
  const t = useT();

  const [statement, setStatement] = useState<OrgStatementSettings>(initial);

  // Sync with initial whenever dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStatement(initial);
    }
    onOpenChange(nextOpen);
  };

  const handleApply = () => {
    onSave(statement);
    toast.success("อัปเดตข้อความองค์กรมาตรฐานโลกแล้ว (อย่าลืมกดปุ่มบันทึกทั้งหมดด้านล่างสุด)");
    onOpenChange(false);
  };

  return (
    <LiyonDialog open={open} onOpenChange={handleOpenChange} wide>
      <LiyonDialogHeader
        title={t("settings.statementCardTitle")}
        description={t("settings.statementCardDesc")}
      />

      <LiyonDialogBody className="max-h-[75vh] overflow-y-auto pr-1 space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 rounded-xl p-3.5 text-xs text-sky-900 dark:text-sky-200">
          <Globe className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">เกณฑ์อัตลักษณ์องค์กรระดับมาตรฐานสากล (World-Class Academic Standards)</p>
            <p className="text-sky-800 dark:text-sky-300 leading-relaxed">
              ข้อความวิสัยทัศน์ พันธกิจ คำขวัญ และค่านิยมหลัก เป็นองค์ประกอบสำคัญในการประเมินคุณภาพสถาบันการศึกษาระดับสากล (เช่น AACSB, QS Stars, สกอ.) และจะถูกนำไปแสดงผลบนหน้า Portal สาธารณะเพื่อสื่อสารกับประชาคมโลก
            </p>
          </div>
        </div>

        {/* 1. Slogan / Tagline */}
        <div className="space-y-3 p-4 rounded-xl border bg-card/60 shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Compass className="h-4 w-4 text-primary" />
            <span>คำขวัญ / สโลแกน (Tagline & Slogan)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LiyonField label={t("settings.statementSloganTh")}>
              <input
                type="text"
                value={statement.sloganTh}
                onChange={(e) => setStatement({ ...statement, sloganTh: e.target.value })}
                placeholder="เช่น มุ่งมั่นสู่ความเป็นเลิศทางวิชาการและการจัดการระดับสากล"
                className="w-full text-xs"
              />
            </LiyonField>
            <LiyonField label={t("settings.statementSloganEn")}>
              <input
                type="text"
                value={statement.sloganEn}
                onChange={(e) => setStatement({ ...statement, sloganEn: e.target.value })}
                placeholder="e.g. Striving for Academic Excellence and Global Management Standards"
                className="w-full text-xs"
              />
            </LiyonField>
          </div>
        </div>

        {/* 2. Vision */}
        <div className="space-y-3 p-4 rounded-xl border bg-card/60 shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Target className="h-4 w-4 text-primary" />
            <span>วิสัยทัศน์ (Vision Statement)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LiyonField label={t("settings.statementVisionTh")}>
              <textarea
                rows={3}
                value={statement.visionTh}
                onChange={(e) => setStatement({ ...statement, visionTh: e.target.value })}
                placeholder="ระบุวิสัยทัศน์องค์กรภาษาไทย..."
                className="w-full text-xs"
              />
            </LiyonField>
            <LiyonField label={t("settings.statementVisionEn")}>
              <textarea
                rows={3}
                value={statement.visionEn}
                onChange={(e) => setStatement({ ...statement, visionEn: e.target.value })}
                placeholder="State the vision statement in English..."
                className="w-full text-xs"
              />
            </LiyonField>
          </div>
        </div>

        {/* 3. Mission */}
        <div className="space-y-3 p-4 rounded-xl border bg-card/60 shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>พันธกิจ (Mission Statement)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LiyonField label={t("settings.statementMissionTh")}>
              <textarea
                rows={4}
                value={statement.missionTh}
                onChange={(e) => setStatement({ ...statement, missionTh: e.target.value })}
                placeholder="ระบุพันธกิจหลักขององค์กรภาษาไทย..."
                className="w-full text-xs"
              />
            </LiyonField>
            <LiyonField label={t("settings.statementMissionEn")}>
              <textarea
                rows={4}
                value={statement.missionEn}
                onChange={(e) => setStatement({ ...statement, missionEn: e.target.value })}
                placeholder="State key institutional missions in English..."
                className="w-full text-xs"
              />
            </LiyonField>
          </div>
        </div>

        {/* 4. Core Values */}
        <div className="space-y-3 p-4 rounded-xl border bg-card/60 shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Award className="h-4 w-4 text-primary" />
            <span>ปรัชญาและค่านิยมหลัก (Core Values & Philosophy)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LiyonField label={t("settings.statementValuesTh")}>
              <textarea
                rows={3}
                value={statement.valuesTh}
                onChange={(e) => setStatement({ ...statement, valuesTh: e.target.value })}
                placeholder="เช่น คุณธรรม นวัตกรรม มุ่งมั่นสู่ความเป็นเลิศ และความรับผิดชอบต่อสังคม"
                className="w-full text-xs"
              />
            </LiyonField>
            <LiyonField label={t("settings.statementValuesEn")}>
              <textarea
                rows={3}
                value={statement.valuesEn}
                onChange={(e) => setStatement({ ...statement, valuesEn: e.target.value })}
                placeholder="e.g. Integrity, Innovation, Excellence, and Social Responsibility"
                className="w-full text-xs"
              />
            </LiyonField>
          </div>
        </div>
      </LiyonDialogBody>

      <LiyonDialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleApply} className="gap-1.5 font-semibold">
          <Check className="h-4 w-4" />
          <span>ยืนยันการปรับแต่ง</span>
        </Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}
