"use client";

import { useState, useTransition } from "react";
import { Plus, CheckCircle, XCircle, CalendarDays, AlertCircle, Ban, Users, Car, DoorOpen, MapPin, Tag, Trash2, Edit } from "lucide-react";
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
import { formatDate } from "@/shared/lib/format";
import type {
  BookingReservationDto,
  BookingResourceDto,
  CreateBookingReservationInput,
  CreateBookingResourceInput,
} from "@/features/bookings";
import {
  createReservationAction,
  approveReservationAction,
  cancelReservationAction,
  createBookingResourceAction,
  updateBookingResourceAction,
  deleteBookingResourceAction,
} from "@/features/bookings/actions";

interface BookingsClientProps {
  initialReservations: BookingReservationDto[];
  resources: BookingResourceDto[];
  canCreate: boolean;
  canApprove: boolean;
  canManage?: boolean;
}

const RESOURCE_TYPE_MAP = {
  MEETING_ROOM: "bookings.type.MEETING_ROOM",
  VEHICLE: "bookings.type.VEHICLE",
} as const;

const BOOKING_STATUS_MAP = {
  PENDING: "bookings.status.PENDING",
  APPROVED: "bookings.status.APPROVED",
  REJECTED: "bookings.status.REJECTED",
  CANCELLED: "bookings.status.CANCELLED",
} as const;

export function BookingsClient({
  initialReservations,
  resources: initialResources,
  canCreate,
  canApprove,
  canManage = false,
}: BookingsClientProps) {
  const t = useT();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<"reservations" | "resources">("reservations");
  const [reservations, setReservations] = useState<BookingReservationDto[]>(initialReservations);
  const [resources, setResources] = useState<BookingResourceDto[]>(initialResources);
  const [isPending, startTransition] = useTransition();

  // Reservation Form states
  const [resModalOpen, setResModalOpen] = useState(false);
  const [resourceId, setResourceId] = useState(resources[0]?.id || "");
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [driverRequired, setDriverRequired] = useState(false);

  // Approval Dialog states
  const [approvalModalItem, setApprovalModalItem] = useState<BookingReservationDto | null>(null);
  const [approvalAction, setApprovalAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [driverName, setDriverName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Resource Form states
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<BookingResourceDto | null>(null);
  const [resType, setResType] = useState<"MEETING_ROOM" | "VEHICLE">("MEETING_ROOM");
  const [resNameTh, setResNameTh] = useState("");
  const [resNameEn, setResNameEn] = useState("");
  const [resCapacity, setResCapacity] = useState(10);
  const [resLocation, setResLocation] = useState("");
  const [resAmenities, setResAmenities] = useState("");
  const [resImageUrl, setResImageUrl] = useState("");
  const [resIsActive, setResIsActive] = useState(true);

  const selectedResource = resources.find((r) => r.id === resourceId);

  // Open Create Reservation
  const openCreateResDialog = () => {
    setResourceId(resources[0]?.id || "");
    setTitle("");
    setDestination("");
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    const inTwoHours = new Date(now);
    inTwoHours.setHours(inTwoHours.getHours() + 2);
    setStartTime(now.toISOString().slice(0, 16));
    setEndTime(inTwoHours.toISOString().slice(0, 16));
    setAttendeesCount(4);
    setDriverRequired(false);
    setResModalOpen(true);
  };

  // Open Approval Dialog
  const openApprovalDialog = (item: BookingReservationDto, action: "APPROVED" | "REJECTED") => {
    setApprovalModalItem(item);
    setApprovalAction(action);
    setDriverName(item.driverName || "");
    setRejectionReason("");
  };

  // Open Create Resource Dialog
  const openCreateResourceDialog = () => {
    setEditingResource(null);
    setResType("MEETING_ROOM");
    setResNameTh("");
    setResNameEn("");
    setResCapacity(10);
    setResLocation("");
    setResAmenities("Projector, Wifi, Whiteboard");
    setResImageUrl("");
    setResIsActive(true);
    setResourceModalOpen(true);
  };

  // Open Edit Resource Dialog
  const openEditResourceDialog = (res: BookingResourceDto) => {
    setEditingResource(res);
    setResType(res.type);
    setResNameTh(res.nameTh);
    setResNameEn(res.nameEn);
    setResCapacity(res.capacity);
    setResLocation(res.locationOrPlate);
    setResAmenities(res.amenities.join(", "));
    setResImageUrl(res.imageUrl || "");
    setResIsActive(res.isActive);
    setResourceModalOpen(true);
  };

  // Submit Reservation
  const handleCreateReservation = () => {
    if (!resourceId || !title.trim() || !startTime || !endTime) {
      toast.error(t("error.validation"));
      return;
    }

    startTransition(async () => {
      const payload: CreateBookingReservationInput = {
        resourceId,
        title,
        destination: destination || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        attendeesCount: Number(attendeesCount),
        driverRequired,
      };
      const res = await createReservationAction(payload);
      if (res.ok) {
        setReservations((prev) => [res.data, ...prev]);
        toast.success(t("common.save"));
        setResModalOpen(false);
      } else {
        toast.error(res.error.message || t("common.error"));
      }
    });
  };

  // Submit Approval / Rejection
  const handleProcessApproval = () => {
    if (!approvalModalItem) return;

    startTransition(async () => {
      const res = await approveReservationAction({
        reservationId: approvalModalItem.id,
        action: approvalAction,
        driverName: approvalAction === "APPROVED" ? driverName || undefined : undefined,
        rejectionReason: approvalAction === "REJECTED" ? rejectionReason || undefined : undefined,
      });
      if (res.ok) {
        setReservations((prev) =>
          prev.map((it) =>
            it.id === approvalModalItem.id
              ? {
                  ...it,
                  status: approvalAction,
                  driverName: approvalAction === "APPROVED" ? driverName || null : it.driverName,
                }
              : it
          )
        );
        toast.success(approvalAction === "APPROVED" ? t("bookings.status.APPROVED") : t("bookings.status.REJECTED"));
        setApprovalModalItem(null);
      } else {
        toast.error(res.error.message || t("common.error"));
      }
    });
  };

  // Cancel Reservation
  const handleCancelReservation = (item: BookingReservationDto) => {
    startTransition(async () => {
      const res = await cancelReservationAction(item.id);
      if (res.ok) {
        setReservations((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: "CANCELLED" } : it))
        );
        toast.success(t("bookings.cancel"));
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  // Submit Resource (Create or Update)
  const handleSaveResource = () => {
    if (!resNameTh.trim() || !resNameEn.trim() || !resLocation.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    const amenitiesList = resAmenities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      if (editingResource) {
        const res = await updateBookingResourceAction({
          id: editingResource.id,
          type: resType,
          nameTh: resNameTh,
          nameEn: resNameEn,
          capacity: Number(resCapacity),
          locationOrPlate: resLocation,
          amenities: amenitiesList,
          imageUrl: resImageUrl || "",
          isActive: resIsActive,
        });
        if (res.ok) {
          setResources((prev) => prev.map((r) => (r.id === editingResource.id ? res.data : r)));
          toast.success(t("common.save"));
          setResourceModalOpen(false);
        } else {
          toast.error(res.error.message || t("common.error"));
        }
      } else {
        const payload: CreateBookingResourceInput = {
          type: resType,
          nameTh: resNameTh,
          nameEn: resNameEn,
          capacity: Number(resCapacity),
          locationOrPlate: resLocation,
          amenities: amenitiesList,
          imageUrl: resImageUrl || "",
          isActive: resIsActive,
        };
        const res = await createBookingResourceAction(payload);
        if (res.ok) {
          setResources((prev) => [...prev, res.data]);
          toast.success(t("common.save"));
          setResourceModalOpen(false);
        } else {
          toast.error(res.error.message || t("common.error"));
        }
      }
    });
  };

  // Delete Resource
  const handleDeleteResource = (res: BookingResourceDto) => {
    if (!confirm(`ต้องการลบ ${res.nameTh} ใช่หรือไม่?`)) return;
    startTransition(async () => {
      const result = await deleteBookingResourceAction(res.id);
      if (result.ok) {
        setResources((prev) => prev.filter((r) => r.id !== res.id));
        toast.success(t("common.delete"));
      } else {
        toast.error(result.error.message || t("common.error"));
      }
    });
  };

  // Reservations Columns
  const reservationColumns: DataTableColumn<BookingReservationDto>[] = [
    {
      key: "resource",
      header: t("bookings.resource"),
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.resourceType === "MEETING_ROOM" ? (
            <DoorOpen className="h-4 w-4 text-sky-600 shrink-0" />
          ) : (
            <Car className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <div>
            <div className="font-medium">{row.resourceNameTh}</div>
            <div className="text-xs text-muted-foreground">
              {t(RESOURCE_TYPE_MAP[row.resourceType as keyof typeof RESOURCE_TYPE_MAP] ?? "bookings.type.MEETING_ROOM")}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "title",
      header: t("bookings.titleLabel"),
      render: (row) => (
        <div>
          <div className="font-medium">{row.title}</div>
          {row.destination && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-red-500" />
              <span>{row.destination}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <span>ผู้จอง: {row.userName}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {row.attendeesCount} คน
            </span>
            {row.driverRequired && (
              <>
                <span>•</span>
                <span className="text-amber-600 font-medium">
                  {row.driverName ? `คนขับ: ${row.driverName}` : "ขอคนขับ (ยังไม่มอบหมาย)"}
                </span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "time",
      header: t("bookings.startTime"),
      className: "nowrap text-xs",
      render: (row) => {
        const start = new Date(row.startTime);
        const end = new Date(row.endTime);
        return (
          <div>
            <div className="font-medium">{formatDate(start, locale)}</div>
            <div className="text-muted-foreground">
              {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
              {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: t("bookings.status"),
      className: "nowrap",
      render: (row) => {
        const tone =
          row.status === "APPROVED" ? "ok" : row.status === "PENDING" ? "warn" : row.status === "REJECTED" ? "bad" : "off";
        return <StatusPill tone={tone}>{t(BOOKING_STATUS_MAP[row.status as keyof typeof BOOKING_STATUS_MAP] ?? "bookings.status.PENDING")}</StatusPill>;
      },
    },
  ];

  // Resources Columns
  const resourceColumns: DataTableColumn<BookingResourceDto>[] = [
    {
      key: "name",
      header: t("bookings.resource.nameTh"),
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.type === "MEETING_ROOM" ? (
            <DoorOpen className="h-4 w-4 text-sky-600 shrink-0" />
          ) : (
            <Car className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <div>
            <div className="font-medium">{row.nameTh}</div>
            <div className="text-xs text-muted-foreground">{row.nameEn}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "ประเภท",
      className: "nowrap",
      render: (row) => (
        <span className="text-xs px-2 py-0.5 rounded bg-muted">
          {t(RESOURCE_TYPE_MAP[row.type as keyof typeof RESOURCE_TYPE_MAP])}
        </span>
      ),
    },
    {
      key: "location",
      header: t("bookings.resource.location"),
      render: (row) => <span className="text-sm">{row.locationOrPlate}</span>,
    },
    {
      key: "capacity",
      header: t("bookings.resource.capacity"),
      className: "nowrap text-sm",
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {row.capacity} ที่นั่ง
        </span>
      ),
    },
    {
      key: "amenities",
      header: "สิ่งอำนวยความสะดวก",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.amenities.map((am) => (
            <span key={am} className="text-[11px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
              {am}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: t("bookings.resource.status"),
      className: "nowrap",
      render: (row) => (
        <StatusPill tone={row.isActive ? "ok" : "off"}>
          {row.isActive ? "พร้อมใช้งาน" : "ปิดปรับปรุง"}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("bookings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("bookings.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "reservations" && canCreate && (
            <Button onClick={openCreateResDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("bookings.create")}
            </Button>
          )}
          {activeTab === "resources" && canManage && (
            <Button onClick={openCreateResourceDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("bookings.resource.create")}
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      {canManage && (
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab("reservations")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "reservations"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("bookings.tab.reservations")} ({reservations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "resources"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("bookings.tab.resources")} ({resources.length})
          </button>
        </div>
      )}

      {/* Tab 1: Reservations */}
      {activeTab === "reservations" && (
        <LiyonCard>
          <DataTable<BookingReservationDto>
            state={reservations.length === 0 ? "empty" : "data"}
            rows={reservations}
            columns={reservationColumns}
            getRowId={(row) => row.id}
            headHeading={<span>{t("bookings.tab.reservations")}</span>}
            renderRowMenu={(row) => (
              <>
                {canApprove && row.status === "PENDING" && (
                  <>
                    <RowMenuItem
                      onSelect={() => openApprovalDialog(row, "APPROVED")}
                      icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
                    >
                      {t("bookings.status.APPROVED")}
                    </RowMenuItem>
                    <RowMenuItem
                      onSelect={() => openApprovalDialog(row, "REJECTED")}
                      danger
                      icon={<XCircle className="h-4 w-4" />}
                    >
                      {t("bookings.status.REJECTED")}
                    </RowMenuItem>
                  </>
                )}
                {row.status === "PENDING" && (
                  <RowMenuItem onSelect={() => handleCancelReservation(row)} danger icon={<Ban className="h-4 w-4" />}>
                    {t("bookings.cancel")}
                  </RowMenuItem>
                )}
              </>
            )}
            empty={{
              icon: <CalendarDays className="h-10 w-10 text-muted-foreground/50" />,
              title: t("bookings.title"),
              description: t("bookings.description"),
            }}
            error={{
              icon: <AlertCircle className="h-10 w-10 text-destructive" />,
              title: t("common.error"),
            }}
          />
        </LiyonCard>
      )}

      {/* Tab 2: Resources Management */}
      {activeTab === "resources" && canManage && (
        <LiyonCard>
          <DataTable<BookingResourceDto>
            state={resources.length === 0 ? "empty" : "data"}
            rows={resources}
            columns={resourceColumns}
            getRowId={(row) => row.id}
            headHeading={<span>{t("bookings.tab.resources")}</span>}
            renderRowMenu={(row) => (
              <>
                <RowMenuItem onSelect={() => openEditResourceDialog(row)} icon={<Edit className="h-4 w-4" />}>
                  {t("bookings.resource.edit")}
                </RowMenuItem>
                <RowMenuItem onSelect={() => handleDeleteResource(row)} danger icon={<Trash2 className="h-4 w-4" />}>
                  {t("common.delete")}
                </RowMenuItem>
              </>
            )}
            empty={{
              icon: <Tag className="h-10 w-10 text-muted-foreground/50" />,
              title: t("bookings.tab.resources"),
              description: "ยังไม่มีรายการห้องหรือยานพาหนะในระบบ",
            }}
            error={{
              icon: <AlertCircle className="h-10 w-10 text-destructive" />,
              title: t("common.error"),
            }}
          />
        </LiyonCard>
      )}

      {/* Dialog ส่งคำขอจองห้อง/รถ */}
      <LiyonDialog open={resModalOpen} onOpenChange={setResModalOpen}>
        <LiyonDialogHeader
          title={t("bookings.create")}
          description={t("bookings.description")}
        />
        <LiyonDialogBody>
          <div className="space-y-4 py-2">
            <LiyonField label={t("bookings.resource")}>
              <LiyonSelect value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
                {resources
                  .filter((r) => r.isActive)
                  .map((res) => (
                    <option key={res.id} value={res.id}>
                      [{t(RESOURCE_TYPE_MAP[res.type as keyof typeof RESOURCE_TYPE_MAP] ?? "bookings.type.MEETING_ROOM")}] {res.nameTh} ({res.locationOrPlate}) - จุ {res.capacity} คน
                    </option>
                  ))}
              </LiyonSelect>
            </LiyonField>
            <LiyonField label={t("bookings.titleLabel")}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น การประชุมคณะกรรมการบริหารประจำเดือน หรือ เดินทางไปราชการ..."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            {selectedResource?.type === "VEHICLE" && (
              <LiyonField label={t("bookings.destination")}>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="เช่น มหาวิทยาลัยเชียงใหม่ หรือ ศาลากลางจังหวัด..."
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
            )}

            <div className="grid grid-cols-2 gap-3">
              <LiyonField label={t("bookings.startTime")}>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
              <LiyonField label={t("bookings.endTime")}>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>
            <LiyonField label={t("bookings.attendees")}>
              <input
                type="number"
                min={1}
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(Number(e.target.value))}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            {selectedResource?.type === "VEHICLE" && (
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={driverRequired}
                  onChange={(e) => setDriverRequired(e.target.checked)}
                  className="rounded border"
                />
                <span>{t("bookings.driver")}</span>
              </label>
            )}
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setResModalOpen(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleCreateReservation} disabled={isPending}>
            {t("common.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog อนุมัติ/ปฏิเสธการจอง */}
      <LiyonDialog
        open={!!approvalModalItem}
        onOpenChange={(open) => !open && setApprovalModalItem(null)}
        danger={approvalAction === "REJECTED"}
      >
        <LiyonDialogHeader
          title={approvalAction === "APPROVED" ? t("bookings.status.APPROVED") : t("bookings.status.REJECTED")}
          description={approvalModalItem?.title}
        />
        <LiyonDialogBody>
          <div className="space-y-3 py-2">
            {approvalAction === "APPROVED" &&
              approvalModalItem &&
              approvalModalItem.resourceType === "VEHICLE" &&
              approvalModalItem.driverRequired && (
                <LiyonField label={t("bookings.driverName")}>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="เช่น นายสมชาย ใจดี (พนักงานขับรถ)"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </LiyonField>
              )}

            {approvalAction === "REJECTED" && (
              <LiyonField label="เหตุผลประกอบการพิจารณา (กรณีปฏิเสธ)">
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="ระบุเหตุผล เช่น ติดภารกิจเร่งด่วน หรือห้องอยู่ระหว่างปิดซ่อมบำรุง..."
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
            )}
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setApprovalModalItem(null)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={approvalAction === "APPROVED" ? "default" : "destructive"}
            onClick={handleProcessApproval}
            disabled={isPending}
          >
            {approvalAction === "APPROVED" ? t("bookings.status.APPROVED") : t("bookings.status.REJECTED")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog เพิ่ม / แก้ไข ทรัพยากร (ห้อง/รถ) */}
      <LiyonDialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <LiyonDialogHeader
          title={editingResource ? t("bookings.resource.edit") : t("bookings.resource.create")}
          description="กำหนดรายละเอียดห้องประชุม หรือ ยานพาหนะของคณะ"
        />
        <LiyonDialogBody>
          <div className="space-y-4 py-2">
            <LiyonField label="ประเภททรัพยากร">
              <LiyonSelect
                value={resType}
                onChange={(e) => setResType(e.target.value as "MEETING_ROOM" | "VEHICLE")}
              >
                <option value="MEETING_ROOM">{t("bookings.type.MEETING_ROOM")}</option>
                <option value="VEHICLE">{t("bookings.type.VEHICLE")}</option>
              </LiyonSelect>
            </LiyonField>

            <div className="grid grid-cols-2 gap-3">
              <LiyonField label={t("bookings.resource.nameTh")}>
                <input
                  type="text"
                  value={resNameTh}
                  onChange={(e) => setResNameTh(e.target.value)}
                  placeholder="เช่น ห้องประชุมเกียรติยศ 1"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
              <LiyonField label={t("bookings.resource.nameEn")}>
                <input
                  type="text"
                  value={resNameEn}
                  onChange={(e) => setResNameEn(e.target.value)}
                  placeholder="e.g. Grand Boardroom 1"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <LiyonField label={t("bookings.resource.location")}>
                <input
                  type="text"
                  value={resLocation}
                  onChange={(e) => setResLocation(e.target.value)}
                  placeholder={resType === "MEETING_ROOM" ? "เช่น ชั้น 4 อาคาร 1" : "เช่น กข-9999 กทม."}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
              <LiyonField label={t("bookings.resource.capacity")}>
                <input
                  type="number"
                  min={1}
                  value={resCapacity}
                  onChange={(e) => setResCapacity(Number(e.target.value))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <LiyonField label="สิ่งอำนวยความสะดวก (คั่นด้วยเครื่องหมายจุลภาค ,)">
              <input
                type="text"
                value={resAmenities}
                onChange={(e) => setResAmenities(e.target.value)}
                placeholder="เช่น จอโปรเจคเตอร์, ระบบประชุมทางไกล, เครื่องเสียง"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <LiyonField label="URL รูปภาพ (ถ้ามี)">
              <input
                type="text"
                value={resImageUrl}
                onChange={(e) => setResImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>

            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={resIsActive}
                onChange={(e) => setResIsActive(e.target.checked)}
                className="rounded border"
              />
              <span>{t("bookings.resource.status")} (พร้อมให้บริการ)</span>
            </label>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setResourceModalOpen(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSaveResource} disabled={isPending}>
            {t("common.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}

