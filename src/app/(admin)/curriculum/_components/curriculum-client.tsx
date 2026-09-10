"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DataTable,
  LiyonCard,
  RowMenuItem,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonField,
  LiyonSelect,
  type DataTableColumn,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import type { AcademicProgramDto, CreateProgramInput } from "@/features/curriculum";
import { createProgramAction, updateProgramAction, deleteProgramAction } from "@/features/curriculum/actions";

interface CurriculumClientProps {
  initialItems: AcademicProgramDto[];
  canManage: boolean;
}

const LEVEL_MAP = {
  BACHELOR: "curriculum.level.BACHELOR",
  MASTER: "curriculum.level.MASTER",
  DOCTORAL: "curriculum.level.DOCTORAL",
  DIPLOMA: "curriculum.level.DIPLOMA",
} as const;

const STATUS_MAP = {
  OPEN_ADMISSION: "curriculum.status.OPEN_ADMISSION",
  ACTIVE: "curriculum.status.ACTIVE",
  PHASING_OUT: "curriculum.status.PHASING_OUT",
  CLOSED: "curriculum.status.CLOSED",
} as const;

export function CurriculumClient({ initialItems, canManage }: CurriculumClientProps) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState<AcademicProgramDto[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicProgramDto | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AcademicProgramDto | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [degreeTh, setDegreeTh] = useState("");
  const [degreeEn, setDegreeEn] = useState("");
  const [degreeLevel, setDegreeLevel] = useState<"BACHELOR" | "MASTER" | "DOCTORAL" | "DIPLOMA">("BACHELOR");
  const [department, setDepartment] = useState("");
  const [durationYears, setDurationYears] = useState(4);
  const [totalCredits, setTotalCredits] = useState(128);
  const [tuitionFee, setTuitionFee] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<"OPEN_ADMISSION" | "ACTIVE" | "PHASING_OUT" | "CLOSED">("ACTIVE");

  const openCreateDialog = () => {
    setEditingItem(null);
    setCode("");
    setNameTh("");
    setNameEn("");
    setDegreeTh("");
    setDegreeEn("");
    setDegreeLevel("BACHELOR");
    setDepartment("ภาควิชาวิทยาการคอมพิวเตอร์");
    setDurationYears(4);
    setTotalCredits(128);
    setTuitionFee(undefined);
    setStatus("ACTIVE");
    setModalOpen(true);
  };

  const openEditDialog = (item: AcademicProgramDto) => {
    setEditingItem(item);
    setCode(item.code);
    setNameTh(item.nameTh);
    setNameEn(item.nameEn);
    setDegreeTh(item.degreeTh);
    setDegreeEn(item.degreeEn);
    setDegreeLevel(item.degreeLevel);
    setDepartment(item.department);
    setDurationYears(item.durationYears);
    setTotalCredits(item.totalCredits);
    setTuitionFee(item.tuitionFeePerTerm || undefined);
    setStatus(item.status);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!code.trim() || !nameTh.trim() || !nameEn.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    startTransition(async () => {
      if (editingItem) {
        const res = await updateProgramAction({
          id: editingItem.id,
          code,
          nameTh,
          nameEn,
          degreeTh,
          degreeEn,
          degreeLevel,
          department,
          durationYears,
          totalCredits,
          tuitionFeePerTerm: tuitionFee,
          status,
        });
        if (res.ok) {
          setItems((prev) => prev.map((it) => (it.id === editingItem.id ? res.data : it)));
          toast.success(t("common.save"));
          setModalOpen(false);
        } else {
          toast.error(t("common.error"));
        }
      } else {
        const payload: CreateProgramInput = {
          code,
          nameTh,
          nameEn,
          degreeTh,
          degreeEn,
          degreeLevel,
          department,
          durationYears,
          totalCredits,
          tuitionFeePerTerm: tuitionFee,
          careerPaths: [],
          status,
        };
        const res = await createProgramAction(payload);
        if (res.ok) {
          setItems((prev) => [res.data, ...prev]);
          toast.success(t("common.save"));
          setModalOpen(false);
        } else {
          toast.error(t("common.error"));
        }
      }
    });
  };

  const handleDelete = (item: AcademicProgramDto) => {
    startTransition(async () => {
      const res = await deleteProgramAction(item.id);
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        toast.success(t("common.save"));
        setDeleteConfirmItem(null);
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const columns: DataTableColumn<AcademicProgramDto>[] = [
    {
      key: "code",
      header: t("curriculum.code"),
      className: "nowrap font-mono font-medium text-xs",
      render: (row) => <span>{row.code}</span>,
    },
    {
      key: "name",
      header: t("curriculum.nameTh"),
      render: (row) => (
        <div>
          <div className="font-medium">{locale === "en" ? row.nameEn : row.nameTh}</div>
          <div className="text-xs text-muted-foreground">{locale === "en" ? row.degreeEn : row.degreeTh}</div>
        </div>
      ),
    },
    {
      key: "level",
      header: t("curriculum.degreeLevel"),
      className: "nowrap text-xs",
      render: (row) => <span>{t(LEVEL_MAP[row.degreeLevel as keyof typeof LEVEL_MAP] ?? "curriculum.level.BACHELOR")}</span>,
    },
    {
      key: "credits",
      header: t("curriculum.totalCredits"),
      className: "nowrap text-center text-xs",
      render: (row) => <span>{row.totalCredits} ({row.durationYears} ปี)</span>,
    },
    {
      key: "status",
      header: t("curriculum.status"),
      className: "nowrap",
      render: (row) => {
        const tone = row.status === "OPEN_ADMISSION" ? "ok" : row.status === "ACTIVE" ? "info" : "off";
        return <StatusPill tone={tone}>{t(STATUS_MAP[row.status as keyof typeof STATUS_MAP] ?? "curriculum.status.ACTIVE")}</StatusPill>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("curriculum.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("curriculum.description")}</p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("curriculum.create")}
          </Button>
        )}
      </div>

      <LiyonCard>
        <DataTable<AcademicProgramDto>
          state={items.length === 0 ? "empty" : "data"}
          rows={items}
          columns={columns}
          getRowId={(row) => row.id}
          headHeading={<span>{t("curriculum.title")}</span>}
          renderRowMenu={
            canManage
              ? (row) => (
                  <>
                    <RowMenuItem onSelect={() => openEditDialog(row)} icon={<Edit2 className="h-4 w-4" />}>
                      {t("curriculum.edit")}
                    </RowMenuItem>
                    <RowMenuItem onSelect={() => setDeleteConfirmItem(row)} danger icon={<Trash2 className="h-4 w-4" />}>
                      {t("curriculum.delete")}
                    </RowMenuItem>
                  </>
                )
              : undefined
          }
          empty={{
            icon: <BookOpen className="h-10 w-10 text-muted-foreground/50" />,
            title: t("curriculum.title"),
            description: t("curriculum.description"),
          }}
          error={{
            icon: <AlertCircle className="h-10 w-10 text-destructive" />,
            title: t("common.error"),
          }}
        />
      </LiyonCard>

      {/* Dialog สร้าง/แก้ไขข้อมูลหลักสูตร */}
      <LiyonDialog open={modalOpen} onOpenChange={setModalOpen} wide>
        <LiyonDialogHeader
          title={editingItem ? t("curriculum.edit") : t("curriculum.create")}
          description={t("curriculum.description")}
        />
        <LiyonDialogBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <LiyonField label={t("curriculum.code")}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น CS-2026"
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              />
            </LiyonField>
            <LiyonField label={t("curriculum.degreeLevel")}>
              <LiyonSelect value={degreeLevel} onChange={(e) => setDegreeLevel(e.target.value as CreateProgramInput["degreeLevel"])}>
                <option value="BACHELOR">{t("curriculum.level.BACHELOR")}</option>
                <option value="MASTER">{t("curriculum.level.MASTER")}</option>
                <option value="DOCTORAL">{t("curriculum.level.DOCTORAL")}</option>
                <option value="DIPLOMA">{t("curriculum.level.DIPLOMA")}</option>
              </LiyonSelect>
            </LiyonField>

            <LiyonField label={t("curriculum.nameTh")}>
              <input
                type="text"
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder="วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label={t("curriculum.nameEn")}>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Bachelor of Science in Computer Science"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.degreeTh")}>
              <input
                type="text"
                value={degreeTh}
                onChange={(e) => setDegreeTh(e.target.value)}
                placeholder="วท.บ. (วิทยาการคอมพิวเตอร์)"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label={t("curriculum.degreeEn")}>
              <input
                type="text"
                value={degreeEn}
                onChange={(e) => setDegreeEn(e.target.value)}
                placeholder="B.Sc. (Computer Science)"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.department")}>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="ภาควิชา..."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.status")}>
              <LiyonSelect value={status} onChange={(e) => setStatus(e.target.value as CreateProgramInput["status"])}>
                <option value="OPEN_ADMISSION">{t("curriculum.status.OPEN_ADMISSION")}</option>
                <option value="ACTIVE">{t("curriculum.status.ACTIVE")}</option>
                <option value="PHASING_OUT">{t("curriculum.status.PHASING_OUT")}</option>
                <option value="CLOSED">{t("curriculum.status.CLOSED")}</option>
              </LiyonSelect>
            </LiyonField>

            <LiyonField label={t("curriculum.totalCredits")}>
              <input
                type="number"
                value={totalCredits}
                onChange={(e) => setTotalCredits(Number(e.target.value))}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label={t("curriculum.durationYears")}>
              <input
                type="number"
                value={durationYears}
                onChange={(e) => setDurationYears(Number(e.target.value))}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {t("common.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog ยืนยันการลบ */}
      <LiyonDialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)} danger>
        <LiyonDialogHeader
          title={t("curriculum.delete")}
          description={t("common.confirm")}
        />
        <LiyonDialogBody>
          <p className="text-sm text-muted-foreground">
            {locale === "en" ? deleteConfirmItem?.nameEn : deleteConfirmItem?.nameTh}
          </p>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem)} disabled={isPending}>
            {t("curriculum.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
