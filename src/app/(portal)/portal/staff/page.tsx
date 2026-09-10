import { Mail, Phone, MapPin } from "lucide-react";
import { prisma } from "@/shared/lib/infra/prisma";
import { getLocale } from "@/shared/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function PublicStaffPage() {
  const locale = await getLocale();
  const tenant = await prisma.tenant.findFirst({ where: { isActive: true } });
  const tenantId = tenant?.id || "";

  const staffList = await prisma.facultyMember.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="container mx-auto px-4 py-12 space-y-10">
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {locale === "en" ? "Faculty & Staff Directory" : "ทำเนียบคณาจารย์และบุคลากร"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {locale === "en"
            ? "Meet our professors, lecturers, researchers, and professional officers dedicated to academic excellence."
            : "คณาจารย์และบุคลากรผู้ทรงคุณวุฒิที่ร่วมกันขับเคลื่อนการเรียนการสอนและการวิจัยของคณะ"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.length > 0 ? (
          staffList.map((member) => {
            const fullName = locale === "en"
              ? `${member.titleEn} ${member.firstNameEn} ${member.lastNameEn}`
              : `${member.titleTh} ${member.firstNameTh} ${member.lastNameTh}`;
            const adminTitle = locale === "en"
              ? member.adminPositionEn || member.adminPositionTh
              : member.adminPositionTh;

            return (
              <div
                key={member.id}
                className="group rounded-2xl border bg-card p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border flex items-center justify-center text-primary font-bold text-xl shrink-0 overflow-hidden">
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                    ) : (
                      member.firstNameEn.charAt(0) || member.firstNameTh.charAt(0) || "F"
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors truncate">
                      {fullName}
                    </h3>
                    {adminTitle && (
                      <div className="text-xs font-semibold text-primary">
                        {adminTitle}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground truncate">
                      {member.department}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phoneExt && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{locale === "en" ? "Ext." : "เบอร์ต่อ"} {member.phoneExt}</span>
                    </div>
                  )}
                  {member.roomNumber && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{locale === "en" ? "Room" : "ห้องพักอาจารย์"} {member.roomNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground text-sm border rounded-xl">
            {locale === "en" ? "No staff members listed" : "ยังไม่มีข้อมูลบุคลากรในระบบ"}
          </div>
        )}
      </div>
    </div>
  );
}
