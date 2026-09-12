"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, BookOpen, AlertCircle, Building2, Mail, Phone, MapPin, Search } from "lucide-react";
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
import type {
  AcademicProgramDto,
  AcademicDepartmentDto,
  CreateProgramInput,
  CreateDepartmentInput,
} from "@/features/curriculum";
import {
  createProgramAction,
  updateProgramAction,
  deleteProgramAction,
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
} from "@/features/curriculum/actions";

interface CurriculumClientProps {
  initialItems: AcademicProgramDto[];
  initialDepartments: AcademicDepartmentDto[];
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

export function CurriculumClient({
  initialItems,
  initialDepartments,
  canManage,
}: CurriculumClientProps) {
  const t = useT();
  const locale = useLocale();

  // Tab State: "programs" | "departments"
  const [activeTab, setActiveTab] = useState<"programs" | "departments">("programs");

  const [items, setItems] = useState<AcademicProgramDto[]>(initialItems);
  const [departments, setDepartments] = useState<AcademicDepartmentDto[]>(initialDepartments);
  const [isPending, startTransition] = useTransition();

  // Search states for programs and departments
  const [searchQuery, setSearchQuery] = useState("");
  const [deptSearchQuery, setDeptSearchQuery] = useState("");

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.code.toLowerCase().includes(q) ||
      item.nameTh.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      (item.degreeTh || "").toLowerCase().includes(q) ||
      (item.degreeEn || "").toLowerCase().includes(q) ||
      (item.department || "").toLowerCase().includes(q) ||
      (item.departmentNameTh || "").toLowerCase().includes(q)
    );
  });

  const filteredDepartments = departments.filter((dept) => {
    if (!deptSearchQuery.trim()) return true;
    const q = deptSearchQuery.toLowerCase().trim();
    return (
      dept.code.toLowerCase().includes(q) ||
      dept.nameTh.toLowerCase().includes(q) ||
      dept.nameEn.toLowerCase().includes(q) ||
      (dept.headNameTh || "").toLowerCase().includes(q) ||
      (dept.headNameEn || "").toLowerCase().includes(q) ||
      (dept.contactEmail || "").toLowerCase().includes(q)
    );
  });

  // Program Dialog states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicProgramDto | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AcademicProgramDto | null>(null);

  // Program Form states
  const [code, setCode] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [degreeTh, setDegreeTh] = useState("");
  const [degreeEn, setDegreeEn] = useState("");
  const [degreeLevel, setDegreeLevel] = useState<"BACHELOR" | "MASTER" | "DOCTORAL" | "DIPLOMA">("BACHELOR");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [durationYears, setDurationYears] = useState(4);
  const [totalCredits, setTotalCredits] = useState(128);
  const [tuitionFee, setTuitionFee] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<"OPEN_ADMISSION" | "ACTIVE" | "PHASING_OUT" | "CLOSED">("ACTIVE");

  // Department Dialog states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<AcademicDepartmentDto | null>(null);
  const [deleteDeptConfirmItem, setDeleteDeptConfirmItem] = useState<AcademicDepartmentDto | null>(null);

  // Department Form states
  const [deptCode, setDeptCode] = useState("");
  const [deptNameTh, setDeptNameTh] = useState("");
  const [deptNameEn, setDeptNameEn] = useState("");
  const [deptHeadNameTh, setDeptHeadNameTh] = useState("");
  const [deptHeadNameEn, setDeptHeadNameEn] = useState("");
  const [deptContactEmail, setDeptContactEmail] = useState("");
  const [deptContactPhone, setDeptContactPhone] = useState("");
  const [deptOfficeLocation, setDeptOfficeLocation] = useState("");
  const [deptDescriptionTh, setDeptDescriptionTh] = useState("");
  const [deptOrderIndex, setDeptOrderIndex] = useState(0);
  const [deptIsActive, setDeptIsActive] = useState(true);

  // ─────────────────────────────────────────────────────────
  // Handlers for Academic Programs
  // ─────────────────────────────────────────────────────────

  const openCreateDialog = () => {
    setEditingItem(null);
    setCode("");
    setNameTh("");
    setNameEn("");
    setDegreeTh("");
    setDegreeEn("");
    setDegreeLevel("BACHELOR");
    const defaultDept = departments[0];
    setDepartmentId(defaultDept ? defaultDept.id : "");
    setDepartment(defaultDept ? defaultDept.nameTh : "ภาควิชาวิทยาการคอมพิวเตอร์");
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
    setDepartmentId(item.departmentId || "");
    setDepartment(item.department);
    setDurationYears(item.durationYears);
    setTotalCredits(item.totalCredits);
    setTuitionFee(item.tuitionFeePerTerm || undefined);
    setStatus(item.status);
    setModalOpen(true);
  };

  const handleSaveProgram = () => {
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
          departmentId: departmentId || null,
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
          departmentId: departmentId || null,
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
          // อัปเดตตัวเลขนับจำนวนหลักสูตรในภาควิชา
          if (departmentId) {
            setDepartments((prev) =>
              prev.map((d) => (d.id === departmentId ? { ...d, programsCount: d.programsCount + 1 } : d))
            );
          }
          toast.success(t("common.save"));
          setModalOpen(false);
        } else {
          toast.error(t("common.error"));
        }
      }
    });
  };

  const handleDeleteProgram = (item: AcademicProgramDto) => {
    startTransition(async () => {
      const res = await deleteProgramAction(item.id);
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        if (item.departmentId) {
          setDepartments((prev) =>
            prev.map((d) => (d.id === item.departmentId ? { ...d, programsCount: Math.max(0, d.programsCount - 1) } : d))
          );
        }
        toast.success(t("common.save"));
        setDeleteConfirmItem(null);
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // Handlers for Academic Departments (ภาควิชา/ส่วนงาน)
  // ─────────────────────────────────────────────────────────

  const openCreateDeptDialog = () => {
    setEditingDept(null);
    setDeptCode("");
    setDeptNameTh("");
    setDeptNameEn("");
    setDeptHeadNameTh("");
    setDeptHeadNameEn("");
    setDeptContactEmail("");
    setDeptContactPhone("");
    setDeptOfficeLocation("");
    setDeptDescriptionTh("");
    setDeptOrderIndex(departments.length + 1);
    setDeptIsActive(true);
    setDeptModalOpen(true);
  };

  const openEditDeptDialog = (dept: AcademicDepartmentDto) => {
    setEditingDept(dept);
    setDeptCode(dept.code);
    setDeptNameTh(dept.nameTh);
    setDeptNameEn(dept.nameEn);
    setDeptHeadNameTh(dept.headNameTh || "");
    setDeptHeadNameEn(dept.headNameEn || "");
    setDeptContactEmail(dept.contactEmail || "");
    setDeptContactPhone(dept.contactPhone || "");
    setDeptOfficeLocation(dept.officeLocation || "");
    setDeptDescriptionTh(dept.descriptionTh || "");
    setDeptOrderIndex(dept.orderIndex);
    setDeptIsActive(dept.isActive);
    setDeptModalOpen(true);
  };

  const handleSaveDept = () => {
    if (!deptCode.trim() || !deptNameTh.trim() || !deptNameEn.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    startTransition(async () => {
      if (editingDept) {
        const res = await updateDepartmentAction({
          id: editingDept.id,
          code: deptCode,
          nameTh: deptNameTh,
          nameEn: deptNameEn,
          headNameTh: deptHeadNameTh || null,
          headNameEn: deptHeadNameEn || null,
          contactEmail: deptContactEmail || null,
          contactPhone: deptContactPhone || null,
          officeLocation: deptOfficeLocation || null,
          descriptionTh: deptDescriptionTh || null,
          orderIndex: deptOrderIndex,
          isActive: deptIsActive,
        });
        if (res.ok) {
          setDepartments((prev) => prev.map((d) => (d.id === editingDept.id ? res.data : d)));
          // ซิงค์ชื่อภาควิชาในรายการหลักสูตรด้วย
          setItems((prev) =>
            prev.map((it) =>
              it.departmentId === editingDept.id
                ? { ...it, department: deptNameTh, departmentNameTh: deptNameTh }
                : it
            )
          );
          toast.success(t("common.save"));
          setDeptModalOpen(false);
        } else {
          toast.error(t("common.error"));
        }
      } else {
        const payload: CreateDepartmentInput = {
          code: deptCode,
          nameTh: deptNameTh,
          nameEn: deptNameEn,
          headNameTh: deptHeadNameTh || null,
          headNameEn: deptHeadNameEn || null,
          contactEmail: deptContactEmail || null,
          contactPhone: deptContactPhone || null,
          officeLocation: deptOfficeLocation || null,
          descriptionTh: deptDescriptionTh || null,
          orderIndex: deptOrderIndex,
          isActive: deptIsActive,
        };
        const res = await createDepartmentAction(payload);
        if (res.ok) {
          setDepartments((prev) => [...prev, res.data]);
          toast.success(t("common.save"));
          setDeptModalOpen(false);
        } else {
          toast.error(t("common.error"));
        }
      }
    });
  };

  const handleDeleteDept = (dept: AcademicDepartmentDto) => {
    if (dept.programsCount > 0) {
      toast.error(t("curriculum.dept.cannotDeleteWithPrograms"));
      return;
    }

    startTransition(async () => {
      const res = await deleteDepartmentAction(dept.id);
      if (res.ok) {
        setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
        toast.success(t("common.save"));
        setDeleteDeptConfirmItem(null);
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // DataTable Columns for Programs
  // ─────────────────────────────────────────────────────────

  const programColumns: DataTableColumn<AcademicProgramDto>[] = [
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
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{locale === "en" ? row.degreeEn : row.degreeTh}</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <Building2 className="h-3 w-3" />
              {row.departmentNameTh || row.department}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "level",
      header: t("curriculum.degreeLevel"),
      className: "nowrap text-xs",
      render: (row) => (
        <span>{t(LEVEL_MAP[row.degreeLevel as keyof typeof LEVEL_MAP] ?? "curriculum.level.BACHELOR")}</span>
      ),
    },
    {
      key: "credits",
      header: t("curriculum.totalCredits"),
      className: "nowrap text-center text-xs",
      render: (row) => (
        <span>
          {row.totalCredits} ({row.durationYears} {locale === "en" ? "Yrs" : "ปี"})
        </span>
      ),
    },
    {
      key: "status",
      header: t("curriculum.status"),
      className: "nowrap",
      render: (row) => {
        const tone = row.status === "OPEN_ADMISSION" ? "ok" : row.status === "ACTIVE" ? "info" : "off";
        return (
          <StatusPill tone={tone}>
            {t(STATUS_MAP[row.status as keyof typeof STATUS_MAP] ?? "curriculum.status.ACTIVE")}
          </StatusPill>
        );
      },
    },
  ];

  // ─────────────────────────────────────────────────────────
  // DataTable Columns for Departments
  // ─────────────────────────────────────────────────────────

  const departmentColumns: DataTableColumn<AcademicDepartmentDto>[] = [
    {
      key: "code",
      header: t("curriculum.dept.code"),
      className: "nowrap font-mono font-bold text-xs",
      render: (row) => (
        <span className="px-2 py-0.5 bg-muted rounded border text-xs font-semibold">
          {row.code}
        </span>
      ),
    },
    {
      key: "name",
      header: t("curriculum.dept.nameTh"),
      render: (row) => (
        <div>
          <div className="font-semibold text-sm">{locale === "en" ? row.nameEn : row.nameTh}</div>
          <div className="text-xs text-muted-foreground">
            {locale === "en" ? row.nameTh : row.nameEn}
          </div>
          {row.descriptionTh && (
            <div className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">
              {row.descriptionTh}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "head",
      header: t("curriculum.dept.headName"),
      className: "text-xs",
      render: (row) => (
        <div>
          <div className="font-medium">{row.headNameTh || "-"}</div>
          {row.headNameEn && (
            <div className="text-xs text-muted-foreground">{row.headNameEn}</div>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: t("curriculum.dept.contact"),
      className: "text-xs",
      render: (row) => (
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {row.contactEmail && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-muted-foreground/70" />
              <span>{row.contactEmail}</span>
            </div>
          )}
          {row.contactPhone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-muted-foreground/70" />
              <span>{row.contactPhone}</span>
            </div>
          )}
          {row.officeLocation && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground/70" />
              <span>{row.officeLocation}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "programs",
      header: t("curriculum.dept.programsCount"),
      className: "nowrap text-center text-xs",
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          <BookOpen className="h-3 w-3" />
          {row.programsCount} {t("curriculum.dept.programs")}
        </span>
      ),
    },
    {
      key: "status",
      header: t("curriculum.dept.status"),
      className: "nowrap",
      render: (row) => (
        <StatusPill tone={row.isActive ? "ok" : "off"}>
          {row.isActive ? (locale === "en" ? "Active" : "เปิดใช้งาน") : (locale === "en" ? "Inactive" : "ปิดใช้งาน")}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {activeTab === "programs" ? t("curriculum.title") : t("curriculum.dept.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "programs" ? t("curriculum.description") : t("curriculum.dept.description")}
          </p>
        </div>
        {canManage && (
          <div>
            {activeTab === "programs" ? (
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("curriculum.create")}
              </Button>
            ) : (
              <Button onClick={openCreateDeptDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("curriculum.dept.create")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Switcher: Programs vs Departments */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <Button
          variant={activeTab === "programs" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("programs")}
          className="gap-2 text-sm"
        >
          <BookOpen className="h-4 w-4" />
          {t("curriculum.tab.programs")}
          <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-xs font-semibold">
            {items.length}
          </span>
        </Button>
        <Button
          variant={activeTab === "departments" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("departments")}
          className="gap-2 text-sm"
        >
          <Building2 className="h-4 w-4" />
          {t("curriculum.tab.departments")}
          <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-xs font-semibold">
            {departments.length}
          </span>
        </Button>
      </div>

      {/* Content for Tab 1: Academic Programs */}
      {activeTab === "programs" && (
        <LiyonCard>
          <DataTable<AcademicProgramDto>
            state={filteredItems.length === 0 ? "empty" : "data"}
            rows={filteredItems}
            columns={programColumns}
            getRowId={(row) => row.id}
            headHeading={<span>{t("curriculum.tab.programs")}</span>}
            toolbar={
              <div className="flex items-center gap-3 w-full max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("curriculum.searchPh")}
                    className="w-full pl-9 pr-8 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            }
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
              title: searchQuery.trim() ? t("curriculum.noSearchResults") : t("curriculum.title"),
              description: searchQuery.trim() ? `"${searchQuery}"` : t("curriculum.description"),
            }}
            error={{
              icon: <AlertCircle className="h-10 w-10 text-destructive" />,
              title: t("common.error"),
            }}
          />
        </LiyonCard>
      )}

      {/* Content for Tab 2: Academic Departments */}
      {activeTab === "departments" && (
        <LiyonCard>
          <DataTable<AcademicDepartmentDto>
            state={filteredDepartments.length === 0 ? "empty" : "data"}
            rows={filteredDepartments}
            columns={departmentColumns}
            getRowId={(row) => row.id}
            headHeading={<span>{t("curriculum.tab.departments")}</span>}
            toolbar={
              <div className="flex items-center gap-3 w-full max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="search"
                    value={deptSearchQuery}
                    onChange={(e) => setDeptSearchQuery(e.target.value)}
                    placeholder={t("curriculum.dept.searchPh")}
                    className="w-full pl-9 pr-8 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {deptSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDeptSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            }
            renderRowMenu={
              canManage
                ? (row) => (
                    <>
                      <RowMenuItem onSelect={() => openEditDeptDialog(row)} icon={<Edit2 className="h-4 w-4" />}>
                        {t("curriculum.dept.edit")}
                      </RowMenuItem>
                      <RowMenuItem
                        onSelect={() => setDeleteDeptConfirmItem(row)}
                        danger
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        {t("curriculum.dept.delete")}
                      </RowMenuItem>
                    </>
                  )
                : undefined
            }
            empty={{
              icon: <Building2 className="h-10 w-10 text-muted-foreground/50" />,
              title: deptSearchQuery.trim() ? t("curriculum.dept.noSearchResults") : t("curriculum.dept.title"),
              description: deptSearchQuery.trim() ? `"${deptSearchQuery}"` : t("curriculum.dept.description"),
            }}
            error={{
              icon: <AlertCircle className="h-10 w-10 text-destructive" />,
              title: t("common.error"),
            }}
          />
        </LiyonCard>
      )}

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

            {/* เลือกภาควิชา/ส่วนงานที่จัดเก็บหลักสูตรนี้ */}
            <LiyonField label={t("curriculum.dept.title")}>
              <LiyonSelect
                value={departmentId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setDepartmentId(selectedId);
                  const selectedDept = departments.find((d) => d.id === selectedId);
                  if (selectedDept) {
                    setDepartment(selectedDept.nameTh);
                  }
                }}
              >
                <option value="">-- {t("curriculum.selectDepartment")} --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {locale === "en" ? d.nameEn : d.nameTh}
                  </option>
                ))}
              </LiyonSelect>
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
          <Button onClick={handleSaveProgram} disabled={isPending}>
            {t("common.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog สร้าง/แก้ไขภาควิชาหรือส่วนงาน */}
      <LiyonDialog open={deptModalOpen} onOpenChange={setDeptModalOpen} wide>
        <LiyonDialogHeader
          title={editingDept ? t("curriculum.dept.edit") : t("curriculum.dept.create")}
          description={t("curriculum.dept.description")}
        />
        <LiyonDialogBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <LiyonField label={t("curriculum.dept.code")}>
              <input
                type="text"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="เช่น CS, IS, BA"
                className="w-full rounded-md border px-3 py-2 text-sm font-mono font-semibold"
              />
            </LiyonField>
            <LiyonField label={t("curriculum.dept.orderIndex")}>
              <input
                type="number"
                value={deptOrderIndex}
                onChange={(e) => setDeptOrderIndex(Number(e.target.value))}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.dept.nameTh")}>
              <input
                type="text"
                value={deptNameTh}
                onChange={(e) => setDeptNameTh(e.target.value)}
                placeholder="ภาควิชาวิทยาการคอมพิวเตอร์"
                className="w-full rounded-md border px-3 py-2 text-sm font-medium"
              />
            </LiyonField>
            <LiyonField label={t("curriculum.dept.nameEn")}>
              <input
                type="text"
                value={deptNameEn}
                onChange={(e) => setDeptNameEn(e.target.value)}
                placeholder="Department of Computer Science"
                className="w-full rounded-md border px-3 py-2 text-sm font-medium"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.dept.headName") + " (ไทย)"}>
              <input
                type="text"
                value={deptHeadNameTh}
                onChange={(e) => setDeptHeadNameTh(e.target.value)}
                placeholder="ผศ.ดร. สมชาย ใจดี"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label={t("curriculum.dept.headName") + " (English)"}>
              <input
                type="text"
                value={deptHeadNameEn}
                onChange={(e) => setDeptHeadNameEn(e.target.value)}
                placeholder="Asst. Prof. Dr. Somchai Jaidee"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.dept.contactEmail")}>
              <input
                type="email"
                value={deptContactEmail}
                onChange={(e) => setDeptContactEmail(e.target.value)}
                placeholder="cs@fms.ac.th"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label={t("curriculum.dept.contactPhone")}>
              <input
                type="text"
                value={deptContactPhone}
                onChange={(e) => setDeptContactPhone(e.target.value)}
                placeholder="02-123-4567 ต่อ 1020"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <div className="md:col-span-2">
              <LiyonField label={t("curriculum.dept.officeLocation")}>
                <input
                  type="text"
                  value={deptOfficeLocation}
                  onChange={(e) => setDeptOfficeLocation(e.target.value)}
                  placeholder="อาคาร 4 ชั้น 3 ห้อง 305"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="md:col-span-2">
              <LiyonField label="คำอธิบายภาควิชา (ไทย)">
                <textarea
                  value={deptDescriptionTh}
                  onChange={(e) => setDeptDescriptionTh(e.target.value)}
                  rows={3}
                  placeholder="รายละเอียด พันธกิจ หรือจุดเด่นของภาควิชา..."
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeptModalOpen(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSaveDept} disabled={isPending}>
            {t("common.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog ยืนยันการลบหลักสูตร */}
      <LiyonDialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
        danger
      >
        <LiyonDialogHeader title={t("curriculum.delete")} description={t("common.confirm")} />
        <LiyonDialogBody>
          <p className="text-sm text-muted-foreground">
            {locale === "en" ? deleteConfirmItem?.nameEn : deleteConfirmItem?.nameTh}
          </p>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteConfirmItem && handleDeleteProgram(deleteConfirmItem)}
            disabled={isPending}
          >
            {t("curriculum.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog ยืนยันการลบภาควิชา */}
      <LiyonDialog
        open={!!deleteDeptConfirmItem}
        onOpenChange={(open) => !open && setDeleteDeptConfirmItem(null)}
        danger
      >
        <LiyonDialogHeader
          title={t("curriculum.dept.delete")}
          description={t("curriculum.dept.deleteConfirm")}
        />
        <LiyonDialogBody>
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              {locale === "en" ? deleteDeptConfirmItem?.nameEn : deleteDeptConfirmItem?.nameTh} ({deleteDeptConfirmItem?.code})
            </p>
            {deleteDeptConfirmItem && deleteDeptConfirmItem.programsCount > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{t("curriculum.dept.cannotDeleteWithPrograms")}</span>
              </div>
            )}
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteDeptConfirmItem(null)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteDeptConfirmItem && handleDeleteDept(deleteDeptConfirmItem)}
            disabled={isPending || (deleteDeptConfirmItem ? deleteDeptConfirmItem.programsCount > 0 : false)}
          >
            {t("curriculum.dept.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
