import Link from "next/link";
import { Clock, MapPin, Users, Lock, Car, DoorOpen } from "lucide-react";
import { prisma } from "@/shared/lib/infra/prisma";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PublicBookingsPage() {
  const locale = await getLocale();
  const tenant = await prisma.tenant.findFirst({ where: { isActive: true } });
  const tenantId = tenant?.id || "";

  const [resources, upcomingBookings] = await Promise.all([
    prisma.bookingResource.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ type: "asc" }, { nameTh: "asc" }],
    }),
    prisma.bookingReservation.findMany({
      where: {
        tenantId,
        status: "APPROVED",
        endTime: { gte: new Date() },
      },
      include: {
        resource: { select: { nameTh: true, nameEn: true, locationOrPlate: true, type: true } },
      },
      orderBy: { startTime: "asc" },
      take: 15,
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {locale === "en" ? "Meeting Rooms & Vehicle Schedules" : "ตารางการใช้ห้องประชุมและยานพาหนะ"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {locale === "en"
              ? "Check facility and vehicle availability, amenities, and approved reservations in real time."
              : "ตรวจสอบสถานะความพร้อม สิ่งอำนวยความสะดวก และตารางการใช้งานห้องประชุมและยานพาหนะของคณะ"}
          </p>
        </div>

        <Button asChild className="gap-2 shrink-0">
          <Link href="/login">
            <Lock className="h-4 w-4" />
            <span>{locale === "en" ? "Login to Reserve" : "เข้าสู่ระบบเพื่อจอง"}</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resources Directory */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">
            {locale === "en" ? "Faculty Facilities & Fleet" : "ห้องประชุมและยานพาหนะ"}
          </h2>
          <div className="space-y-3">
            {resources.length > 0 ? (
              resources.map((res) => {
                const amenities = Array.isArray(res.amenities) ? (res.amenities as string[]) : [];
                return (
                  <div key={res.id} className="group rounded-xl border bg-card p-4 space-y-3 hover:shadow-xs transition-shadow">
                    {res.imageUrl && (
                      <div className="h-36 w-full rounded-lg overflow-hidden bg-muted relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={res.imageUrl}
                          alt={res.nameTh}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {res.type === "MEETING_ROOM" ? (
                          <DoorOpen className="h-4 w-4 text-sky-600 shrink-0" />
                        ) : (
                          <Car className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        <div>
                          <h3 className="font-bold text-sm">
                            {locale === "en" ? res.nameEn : res.nameTh}
                          </h3>
                          <span className="text-[11px] text-muted-foreground">
                            {res.type === "MEETING_ROOM" ? (locale === "en" ? "Room" : "ห้องประชุม") : (locale === "en" ? "Vehicle" : "ยานพาหนะ")}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                        {res.capacity} {locale === "en" ? "Seats" : "ที่นั่ง"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{res.locationOrPlate}</span>
                    </div>

                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {amenities.map((am) => (
                          <span key={am} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                            {am}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground p-4 border rounded-xl">
                {locale === "en" ? "No resources configured" : "ยังไม่มีข้อมูลห้องหรือยานพาหนะ"}
              </div>
            )}
          </div>
        </div>

        {/* Schedule list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold">
            {locale === "en" ? "Upcoming Approved Sessions" : "ตารางการใช้งานที่ได้รับอนุมัติแล้ว"}
          </h2>

          <div className="space-y-3">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((b) => {
                const start = new Date(b.startTime);
                const end = new Date(b.endTime);

                return (
                  <div key={b.id} className="rounded-xl border bg-card p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                        {b.resource.type === "MEETING_ROOM" ? (
                          <DoorOpen className="h-3.5 w-3.5 text-sky-600" />
                        ) : (
                          <Car className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        <span>{locale === "en" ? b.resource.nameEn : b.resource.nameTh} ({b.resource.locationOrPlate})</span>
                      </div>
                      <h3 className="font-bold text-base">
                        {b.title}
                      </h3>
                      {b.destination && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-red-500" />
                          <span>{locale === "en" ? `Destination: ${b.destination}` : `ปลายทาง: ${b.destination}`}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{b.attendeesCount} {locale === "en" ? "Attendees" : "คน"}</span>
                      </div>
                    </div>

                    <div className="text-left md:text-right text-xs text-muted-foreground space-y-0.5 border-t md:border-t-0 pt-2 md:pt-0">
                      <div className="font-medium text-foreground">{formatDate(start, locale)}</div>
                      <div className="flex items-center md:justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm border rounded-xl">
                {locale === "en" ? "No scheduled bookings found" : "ไม่มีการจองที่ได้รับอนุมัติในช่วงเวลานี้"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
