"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, GraduationCap, AlertCircle, Mail, Phone } from "lucide-react";
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
import type { FacultyMemberDto, CreateStaffInput } from "@/features/staff";
import { createFacultyMemberAction, updateFacultyMemberAction, deleteFacultyMemberAction } from "@/features/staff/actions";

interface StaffClientProps {
  initialItems: FacultyMemberDto[];
  canManage: boolean;
}

export function StaffClient({ initialItems, canManage }: StaffClientProps) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState<FacultyMemberDto[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FacultyMemberDto | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<FacultyMemberDto | null>(null);

  // Form states
  const [titleTh, setTitleTh] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [firstNameTh, setFirstNameTh] = useState("");
  const [lastNameTh, setLastNameTh] = useState("");
  const [firstNameEn, setFirstNameEn] = useState("");
  const [lastNameEn, setLastNameEn] = useState("");
  const [academicPosition, setAcademicPosition] = useState<"PROFESSOR" | "ASSOC_PROF" | "ASST_PROF" | "LECTURER" | "OFFICER">("LECTURER");
  const [adminPositionTh, setAdminPositionTh] = useState("");
  const [adminPositionEn, setAdminPositionEn] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [phoneExt, setPhoneExt] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const openCreateDialog = () => {
    setEditingItem(null);
    setTitleTh("อ.");
    setTitleEn("Lect.");
    setFirstNameTh("");
    setLastNameTh("");
    setFirstNameEn("");
    setLastNameEn("");
    setAcademicPosition("LECTURER");
    setAdminPositionTh("");
    setAdminPositionEn("");
    setDepartment("ภาควิชาวิทยาการคอมพิวเตอร์");
    setEmail("");
    setPhoneExt("");
    setRoomNumber("");
    setModalOpen(true);
  };

  const openEditDialog = (item: FacultyMemberDto) => {
    setEditingItem(item);
    setTitleTh(item.titleTh);
    setTitleEn(item.titleEn);
    setFirstNameTh(item.firstNameTh);
    setLastNameTh(item.lastNameTh);
    setFirstNameEn(item.firstNameEn);
    setLastNameEn(item.lastNameEn);
    setAcademicPosition(item.academicPosition);
    setAdminPositionTh(item.adminPositionTh || "");
    setAdminPositionEn(item.adminPositionEn || "");
    setDepartment(item.department);
    setEmail(item.email);
    setPhoneExt(item.phoneExt || "");
    setRoomNumber(item.roomNumber || "");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!firstNameTh.trim() || !lastNameTh.trim() || !email.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    startTransition(async () => {
      if (editingItem) {
        const res = await updateFacultyMemberAction({
          id: editingItem.id,
          titleTh,
          titleEn,
          firstNameTh,
          lastNameTh,
          firstNameEn,
          lastNameEn,
          academicPosition,
          adminPositionTh: adminPositionTh || undefined,
          adminPositionEn: adminPositionEn || undefined,
          department,
          email,
          phoneExt: phoneExt || undefined,
          roomNumber: roomNumber || undefined,
        });
        if (res.ok) {
          setItems((prev) => prev.map((it) => (it.id === editingItem.id ? res.data : it)));
          toast.success(t("common.save"));
          setModalOpen(false);
        } else {
          toast.error(t("common.error"));
        }
      } else {
        const payload: CreateStaffInput = {
          titleTh,
          titleEn,
          firstNameTh,
          lastNameTh,
          firstNameEn,
          lastNameEn,
          academicPosition,
          adminPositionTh: adminPositionTh || undefined,
          adminPositionEn: adminPositionEn || undefined,
          department,
          email,
          phoneExt: phoneExt || undefined,
          roomNumber: roomNumber || undefined,
          expertise: [],
          orderIndex: 0,
          isActive: true,
        };
        const res = await createFacultyMemberAction(payload);
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

  const handleDelete = (item: FacultyMemberDto) => {
    startTransition(async () => {
      const res = await deleteFacultyMemberAction(item.id);
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        toast.success(t("common.save"));
        setDeleteConfirmItem(null);
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const positionLabels: Record<string, string> = {
    PROFESSOR: t("staff.pos.PROFESSOR"),
    ASSOC_PROF: t("staff.pos.ASSOC_PROF"),
    ASST_PROF: t("staff.pos.ASST_PROF"),
    LECTURER: t("staff.pos.LECTURER"),
    OFFICER: t("staff.pos.OFFICER"),
  };

  const columns: DataTableColumn<FacultyMemberDto>[] = [
    {
      key: "name",
      header: t("staff.nameTh"),
      render: (row) => (
        <div>
          <div className="font-medium">{locale === "en" ? row.fullNameEn : row.fullNameTh}</div>
          {(row.adminPositionTh || row.adminPositionEn) && (
            <div className="text-xs text-primary font-medium">{locale === "en" ? row.adminPositionEn || row.adminPositionTh : row.adminPositionTh}</div>
          )}
        </div>
      ),
    },
    {
      key: "academicPosition",
      header: t("staff.academicPosition"),
      className: "nowrap text-xs",
      render: (row) => <span>{positionLabels[row.academicPosition] || row.academicPosition}</span>,
    },
    {
      key: "department",
      header: t("staff.department"),
      className: "nowrap text-xs text-muted-foreground",
      render: (row) => <span>{row.department}</span>,
    },
    {
      key: "contact",
      header: t("staff.email"),
      className: "nowrap text-xs",
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{row.email}</span>
          </div>
          {row.phoneExt && (
            <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
              <Phone className="h-3 w-3" />
              <span>{t("staff.phoneExt")} {row.phoneExt}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: t("common.colStatus"),
      className: "nowrap",
      render: (row) => (
        <StatusPill tone={row.isActive ? "ok" : "off"}>
          {row.isActive ? t("status.active") : t("status.inactive")}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("staff.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("staff.description")}</p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("staff.create")}
          </Button>
        )}
      </div>

      <LiyonCard>
        <DataTable<FacultyMemberDto>
          state={items.length === 0 ? "empty" : "data"}
          rows={items}
          columns={columns}
          getRowId={(row) => row.id}
          headHeading={<span>{t("staff.title")}</span>}
          renderRowMenu={
            canManage
              ? (row) => (
                  <>
                    <RowMenuItem onSelect={() => openEditDialog(row)} icon={<Edit2 className="h-4 w-4" />}>
                      {t("staff.edit")}
                    </RowMenuItem>
                    <RowMenuItem onSelect={() => setDeleteConfirmItem(row)} danger icon={<Trash2 className="h-4 w-4" />}>
                      {t("staff.delete")}
                    </RowMenuItem>
                  </>
                )
              : undefined
          }
          empty={{
            icon: <GraduationCap className="h-10 w-10 text-muted-foreground/50" />,
            title: t("staff.title"),
            description: t("staff.description"),
          }}
          error={{
            icon: <AlertCircle className="h-10 w-10 text-destructive" />,
            title: t("common.error"),
          }}
        />
      </LiyonCard>

      {/* Dialog สร้าง/แก้ไขข้อมูลบุคลากร */}
      <LiyonDialog open={modalOpen} onOpenChange={setModalOpen} wide>
        <LiyonDialogHeader
          title={editingItem ? t("staff.edit") : t("staff.create")}
          description={t("staff.description")}
        />
        <LiyonDialogBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <LiyonField label="คำนำหน้า (ไทย)">
              <input
                type="text"
                value={titleTh}
                onChange={(e) => setTitleTh(e.target.value)}
                placeholder="ศ.ดร. / อ."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label="ชื่อ (ไทย)">
              <input
                type="text"
                value={firstNameTh}
                onChange={(e) => setFirstNameTh(e.target.value)}
                placeholder="ชื่อจริง"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label="นามสกุล (ไทย)">
              <input
                type="text"
                value={lastNameTh}
                onChange={(e) => setLastNameTh(e.target.value)}
                placeholder="นามสกุล"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label="Title (EN)">
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Prof. Dr. / Lect."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label="First Name (EN)">
              <input
                type="text"
                value={firstNameEn}
                onChange={(e) => setFirstNameEn(e.target.value)}
                placeholder="First Name"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label="Last Name (EN)">
              <input
                type="text"
                value={lastNameEn}
                onChange={(e) => setLastNameEn(e.target.value)}
                placeholder="Last Name"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("staff.academicPosition")}>
              <LiyonSelect value={academicPosition} onChange={(e) => setAcademicPosition(e.target.value as CreateStaffInput["academicPosition"])}>
                <option value="PROFESSOR">{t("staff.pos.PROFESSOR")}</option>
                <option value="ASSOC_PROF">{t("staff.pos.ASSOC_PROF")}</option>
                <option value="ASST_PROF">{t("staff.pos.ASST_PROF")}</option>
                <option value="LECTURER">{t("staff.pos.LECTURER")}</option>
                <option value="OFFICER">{t("staff.pos.OFFICER")}</option>
              </LiyonSelect>
            </LiyonField>

            <LiyonField label="ตำแหน่งบริหาร (ไทย)">
              <input
                type="text"
                value={adminPositionTh}
                onChange={(e) => setAdminPositionTh(e.target.value)}
                placeholder="เช่น รองคณบดีฝ่ายวิชาการ"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label="ตำแหน่งบริหาร (English)">
              <input
                type="text"
                value={adminPositionEn}
                onChange={(e) => setAdminPositionEn(e.target.value)}
                placeholder="e.g. Associate Dean"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("staff.department")}>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="ภาควิชา..."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("staff.email")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@university.ac.th"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label={t("staff.phoneExt")}>
              <input
                type="text"
                value={phoneExt}
                onChange={(e) => setPhoneExt(e.target.value)}
                placeholder="เช่น 1234"
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
          title={t("staff.delete")}
          description={t("common.confirm")}
        />
        <LiyonDialogBody>
          <p className="text-sm text-muted-foreground">
            {locale === "en" ? deleteConfirmItem?.fullNameEn : deleteConfirmItem?.fullNameTh}
          </p>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem)} disabled={isPending}>
            {t("staff.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
