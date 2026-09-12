import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { seedCore, seedUser } from "./lib/seed-core";
import { requireDatabaseUrl } from "./lib/require-database-url";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }) });

/** รหัสผ่านทุกบัญชีตัวอย่าง */
export const DEV_PASSWORD = "Passw0rd!vibe";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PROD !== "1") {
    console.error("[seed] ปฏิเสธ: NODE_ENV=production — ใช้ npm run db:bootstrap แทน");
    process.exit(1);
  }
  const core = await seedCore(prisma, { tenantCode: "DEMO", nameTh: "องค์กรตัวอย่าง", nameEn: "Sample Organization" });
  const hash = await bcrypt.hash(DEV_PASSWORD, 12);
  const users = [
    { email: "admin@app.local", name: "ผู้ดูแลสูงสุด", roles: ["SUPER_ADMIN"] },
    { email: "staff@app.local", name: "เจ้าหน้าที่", roles: ["STAFF"] },
    { email: "viewer@app.local", name: "ผู้ดู", roles: ["VIEWER"] },
    { email: "lockme@app.local", name: "บัญชีทดสอบล็อก", roles: ["VIEWER"] },
    { email: "forced@app.local", name: "บัญชีบังคับเปลี่ยนรหัส", roles: ["VIEWER"], mustChangePassword: true },
  ];
  for (const u of users) {
    await seedUser(prisma, core.tenantId, { ...u, passwordHash: hash, roleIds: u.roles.map((c) => core.roleIds[c]) });
  }

  // Seed News Articles
  const newsCount = await prisma.newsArticle.count({ where: { tenantId: core.tenantId } });
  if (newsCount === 0) {
    await prisma.newsArticle.createMany({
      data: [
        {
          tenantId: core.tenantId,
          slug: "ai-business-conference-2026",
          titleTh: "ขอเชิญร่วมงานสัมมนาวิชาการระดับชาติด้านปัญญาประดิษฐ์และนวัตกรรมธุรกิจ 2026",
          titleEn: "National Academic Conference on AI and Business Innovation 2026",
          summaryTh: "การบรรยายพิเศษจากผู้เชี่ยวชาญระดับแนวหน้าของอุตสาหกรรมเทคโนโลยีและการจัดการ",
          summaryEn: "Keynote speeches from leading industry experts in digital transformation and AI strategy.",
          contentTh: "คณะวิทยาการจัดการ ขอเชิญคณาจารย์ นักวิจัย นักศึกษา และผู้สนใจทั่วไป เข้าร่วมงานสัมมนาวิชาการระดับชาติ ประจำปี 2569 ณ หอประชุมใหญ่คณะ...",
          contentEn: "Faculty of Management Sciences invites scholars, researchers, and students to join the National Conference 2026...",
          category: "ACADEMIC",
          coverImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
          isPinned: true,
          pinPriority: 2,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
        {
          tenantId: core.tenantId,
          slug: "tcas-69-portfolio-round",
          titleTh: "เปิดรับสมัครนักศึกษาใหม่ระดับปริญญาตรี TCAS69 รอบ Portfolio",
          titleEn: "Undergraduate Admissions TCAS 2026 Portfolio Round Open",
          summaryTh: "เปิดรับสมัคร 3 สาขาวิชาหลัก พร้อมทุนการศึกษาสำหรับผู้มีความสามารถพิเศษ",
          summaryEn: "Applications open for all Bachelor degree programs with excellence scholarships.",
          contentTh: "เปิดรับสมัครตั้งแต่วันนี้ถึงสิ้นเดือนตุลาคม ผ่านระบบรับสมัครออนไลน์ของคณะ...",
          contentEn: "Apply now via the faculty online application portal...",
          category: "ANNOUNCEMENT",
          coverImageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
          isPinned: true,
          pinPriority: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
        {
          tenantId: core.tenantId,
          slug: "faculty-ieee-research-award-2026",
          titleTh: "อาจารย์คณะได้รับรางวัลผลงานวิจัยดีเด่นระดับนานาชาติ IEEE 2026",
          titleEn: "Faculty Professor Wins Prestigious IEEE International Best Paper Award",
          summaryTh: "ผลงานการวิจัยด้าน Multi-Agent Deep Reinforcement Learning สำหรับระบบโลจิสติกส์อัจฉริยะ",
          summaryEn: "Outstanding research breakthrough in Multi-Agent Deep Reinforcement Learning for smart logistics.",
          contentTh: "ขอแสดงความยินดีกับ ศ.ดร. สมชาย วิทยากุล และคณะผู้วิจัย ที่ได้รับรางวัล Best Paper Award...",
          contentEn: "Congratulations to Prof. Dr. Somchai Wittayakun and his team...",
          category: "RESEARCH",
          coverImageUrl: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=800&auto=format&fit=crop&q=80",
          isPinned: false,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      ],
    });
  }

  // Seed Faculty Members
  const staffCount = await prisma.facultyMember.count({ where: { tenantId: core.tenantId } });
  if (staffCount === 0) {
    await prisma.facultyMember.createMany({
      data: [
        {
          tenantId: core.tenantId,
          titleTh: "ศ.ดร.",
          titleEn: "Prof. Dr.",
          firstNameTh: "สมชาย",
          lastNameTh: "วิทยากุล",
          firstNameEn: "Somchai",
          lastNameEn: "Wittayakun",
          academicPosition: "PROFESSOR",
          adminPositionTh: "คณบดีคณะวิทยาการจัดการ",
          adminPositionEn: "Dean of Faculty",
          department: "ภาควิชาวิทยาการคอมพิวเตอร์",
          email: "somchai.w@fms.ac.th",
          phoneExt: "1001",
          roomNumber: "401A",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
          orderIndex: 1,
          isActive: true,
        },
        {
          tenantId: core.tenantId,
          titleTh: "รศ.ดร.",
          titleEn: "Assoc. Prof. Dr.",
          firstNameTh: "นันทิยา",
          lastNameTh: "มั่นคง",
          firstNameEn: "Nanthiya",
          lastNameEn: "Mankong",
          academicPosition: "ASSOC_PROF",
          adminPositionTh: "รองคณบดีฝ่ายวิชาการและวิจัย",
          adminPositionEn: "Associate Dean for Academic Affairs",
          department: "ภาควิชาระบบสารสนเทศ",
          email: "nanthiya.m@fms.ac.th",
          phoneExt: "1002",
          roomNumber: "401B",
          avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
          orderIndex: 2,
          isActive: true,
        },
        {
          tenantId: core.tenantId,
          titleTh: "ผศ.ดร.",
          titleEn: "Asst. Prof. Dr.",
          firstNameTh: "กิตติพงษ์",
          lastNameTh: "สิทธิศาสตร์",
          firstNameEn: "Kittipong",
          lastNameEn: "Sittisart",
          academicPosition: "ASST_PROF",
          adminPositionTh: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์",
          adminPositionEn: "Head of Computer Science Department",
          department: "ภาควิชาวิทยาการคอมพิวเตอร์",
          email: "kittipong.s@fms.ac.th",
          phoneExt: "1020",
          roomNumber: "305",
          avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
          orderIndex: 3,
          isActive: true,
        },
      ],
    });
  }

  // Seed Academic Departments (ภาควิชา/ส่วนงาน)
  let csDept = await prisma.academicDepartment.findFirst({ where: { tenantId: core.tenantId, code: "CS" } });
  if (!csDept) {
    csDept = await prisma.academicDepartment.create({
      data: {
        tenantId: core.tenantId,
        code: "CS",
        nameTh: "ภาควิชาวิทยาการคอมพิวเตอร์",
        nameEn: "Department of Computer Science",
        descriptionTh: "มุ่งเน้นการผลิตบัณฑิตด้านศาสตร์คอมพิวเตอร์ ปัญญาประดิษฐ์ วิศวกรรมซอฟต์แวร์ และนวัตกรรมดิจิทัล",
        descriptionEn: "Focused on computer science, artificial intelligence, software engineering, and digital innovation.",
        headNameTh: "ผศ.ดร. กิตติพงษ์ สิทธิศาสตร์",
        headNameEn: "Asst. Prof. Dr. Kittipong Sittisart",
        contactEmail: "cs@fms.ac.th",
        contactPhone: "02-123-4567 ต่อ 1020",
        officeLocation: "อาคาร 4 ชั้น 3 ห้อง 305",
        orderIndex: 1,
        isActive: true,
      },
    });
  }

  let isDept = await prisma.academicDepartment.findFirst({ where: { tenantId: core.tenantId, code: "IS" } });
  if (!isDept) {
    isDept = await prisma.academicDepartment.create({
      data: {
        tenantId: core.tenantId,
        code: "IS",
        nameTh: "ภาควิชาระบบสารสนเทศและธุรกิจดิจิทัล",
        nameEn: "Department of Information Systems & Digital Business",
        descriptionTh: "บ่มเพาะนักเทคโนโลยีที่เข้าใจบริบทธุรกิจและการประยุกต์ใช้ระบบสารสนเทศเพื่อความได้เปรียบเชิงแข่งขัน",
        descriptionEn: "Nurturing technologists with strong business acumen and information system applications.",
        headNameTh: "รศ.ดร. นันทิยา มั่นคง",
        headNameEn: "Assoc. Prof. Dr. Nanthiya Mankong",
        contactEmail: "is@fms.ac.th",
        contactPhone: "02-123-4567 ต่อ 1030",
        officeLocation: "อาคาร 4 ชั้น 3 ห้อง 308",
        orderIndex: 2,
        isActive: true,
      },
    });
  }

  let baDept = await prisma.academicDepartment.findFirst({ where: { tenantId: core.tenantId, code: "BA" } });
  if (!baDept) {
    baDept = await prisma.academicDepartment.create({
      data: {
        tenantId: core.tenantId,
        code: "BA",
        nameTh: "ภาควิชาบริหารธุรกิจและการตลาด",
        nameEn: "Department of Business Administration & Marketing",
        descriptionTh: "ผู้นำด้านการจัดการธุรกิจ การตลาดดิจิทัล และผู้ประกอบการสมัยใหม่ในระดับสากล",
        descriptionEn: "Leading modern business administration, digital marketing, and global entrepreneurship.",
        headNameTh: "ศ.ดร. สมชาย วิจิตรศิลป์",
        headNameEn: "Prof. Dr. Somchai Wijitsin",
        contactEmail: "ba@fms.ac.th",
        contactPhone: "02-123-4567 ต่อ 1040",
        officeLocation: "อาคาร 4 ชั้น 2 ห้อง 201",
        orderIndex: 3,
        isActive: true,
      },
    });
  }

  // Seed Academic Programs
  const programCount = await prisma.academicProgram.count({ where: { tenantId: core.tenantId } });
  if (programCount === 0) {
    await prisma.academicProgram.createMany({
      data: [
        {
          tenantId: core.tenantId,
          code: "CS-2026",
          nameTh: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์",
          nameEn: "Bachelor of Science in Computer Science",
          degreeTh: "วท.บ. (วิทยาการคอมพิวเตอร์)",
          degreeEn: "B.Sc. (Computer Science)",
          degreeLevel: "BACHELOR",
          departmentId: csDept.id,
          department: "ภาควิชาวิทยาการคอมพิวเตอร์",
          durationYears: 4,
          totalCredits: 128,
          tuitionFeePerTerm: 25000,
          status: "OPEN_ADMISSION",
          admissionLink: "https://admissions.fms.ac.th",
        },
        {
          tenantId: core.tenantId,
          code: "IT-2026",
          nameTh: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศและธุรกิจดิจิทัล",
          nameEn: "Bachelor of Science in Information Technology & Digital Business",
          degreeTh: "วท.บ. (เทคโนโลยีสารสนเทศ)",
          degreeEn: "B.Sc. (Information Technology)",
          degreeLevel: "BACHELOR",
          departmentId: isDept.id,
          department: "ภาควิชาระบบสารสนเทศและธุรกิจดิจิทัล",
          durationYears: 4,
          totalCredits: 126,
          tuitionFeePerTerm: 24000,
          status: "OPEN_ADMISSION",
          admissionLink: "https://admissions.fms.ac.th",
        },
        {
          tenantId: core.tenantId,
          code: "DS-2026",
          nameTh: "วิทยาศาสตรมหาบัณฑิต สาขาวิชาวิทยาการข้อมูลและปัญญาประดิษฐ์",
          nameEn: "Master of Science in Data Science & Artificial Intelligence",
          degreeTh: "วท.ม. (วิทยาการข้อมูลและปัญญาประดิษฐ์)",
          degreeEn: "M.Sc. (Data Science & AI)",
          degreeLevel: "MASTER",
          departmentId: csDept.id,
          department: "ภาควิชาวิทยาการคอมพิวเตอร์",
          durationYears: 2,
          totalCredits: 36,
          tuitionFeePerTerm: 45000,
          status: "ACTIVE",
        },
      ],
    });
  } else {
    // ซิงค์ departmentId ให้กับโปรแกรมเดิมหากยังไม่มี
    await prisma.academicProgram.updateMany({
      where: { tenantId: core.tenantId, code: "CS-2026", departmentId: null },
      data: { departmentId: csDept.id, department: "ภาควิชาวิทยาการคอมพิวเตอร์" },
    });
    await prisma.academicProgram.updateMany({
      where: { tenantId: core.tenantId, code: "IT-2026", departmentId: null },
      data: { departmentId: isDept.id, department: "ภาควิชาระบบสารสนเทศและธุรกิจดิจิทัล" },
    });
    await prisma.academicProgram.updateMany({
      where: { tenantId: core.tenantId, code: "DS-2026", departmentId: null },
      data: { departmentId: csDept.id, department: "ภาควิชาวิทยาการคอมพิวเตอร์" },
    });
  }

  // Seed Booking Resources
  const resourceCount = await prisma.bookingResource.count({ where: { tenantId: core.tenantId } });
  if (resourceCount === 0) {
    const room1 = await prisma.bookingResource.create({
      data: {
        tenantId: core.tenantId,
        type: "MEETING_ROOM",
        nameTh: "ห้องประชุมสารภี 1",
        nameEn: "Sarapee Conference Room 1",
        capacity: 40,
        locationOrPlate: "อาคาร 4 ชั้น 4",
        amenities: ["Projector 4K", "Wireless Mic", "Video Conference System"],
        imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80",
        isActive: true,
      },
    });

    await prisma.bookingResource.create({
      data: {
        tenantId: core.tenantId,
        type: "MEETING_ROOM",
        nameTh: "ห้องประชุมบอร์ดรูม (Smart Board)",
        nameEn: "Executive Boardroom",
        capacity: 20,
        locationOrPlate: "อาคาร 4 ชั้น 4 (ห้อง 402)",
        amenities: ["Interactive Smart Board", "High-speed WiFi", "Polycom Conference"],
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
        isActive: true,
      },
    });

    const van = await prisma.bookingResource.create({
      data: {
        tenantId: core.tenantId,
        type: "VEHICLE",
        nameTh: "รถตู้โตโยต้า คอมมิวเตอร์ (คันที่ 1)",
        nameEn: "Toyota Commuter Van #1",
        capacity: 12,
        locationOrPlate: "ทะเบียน นข-4567 กทม.",
        amenities: ["GPS Tracking", "Dashcam", "First-aid Kit"],
        imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
        isActive: true,
      },
    });

    const adminUser = await prisma.user.findFirst({ where: { email: "admin@app.local" } });
    if (adminUser) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(12, 0, 0, 0);

      await prisma.bookingReservation.create({
        data: {
          tenantId: core.tenantId,
          userId: adminUser.id,
          resourceId: room1.id,
          title: "การประชุมคณะกรรมการบริหารคณะวิทยาการจัดการ ครั้งที่ 9/2569",
          startTime: tomorrow,
          endTime: tomorrowEnd,
          attendeesCount: 25,
          status: "APPROVED",
          approverId: adminUser.id,
          approvedAt: new Date(),
        },
      });

      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      dayAfter.setHours(8, 30, 0, 0);

      const dayAfterEnd = new Date(dayAfter);
      dayAfterEnd.setHours(16, 30, 0, 0);

      await prisma.bookingReservation.create({
        data: {
          tenantId: core.tenantId,
          userId: adminUser.id,
          resourceId: van.id,
          title: "นำคณาจารย์และนักศึกษาเข้าร่วมนำเสนอผลงานทางวิชาการ ณ ศูนย์ประชุมแห่งชาติสิริกิติ์",
          destination: "ศูนย์การประชุมแห่งชาติสิริกิติ์ กรุงเทพฯ",
          startTime: dayAfter,
          endTime: dayAfterEnd,
          attendeesCount: 10,
          driverRequired: true,
          driverName: "นายสมชาย ใจดี (พนักงานขับรถประจำคณะ)",
          status: "APPROVED",
          approverId: adminUser.id,
          approvedAt: new Date(),
        },
      });
    }
  }


  // Seed Document Requests & Approvals
  const docCount = await prisma.documentRequest.count({ where: { tenantId: core.tenantId } });
  const adminUser = await prisma.user.findFirst({ where: { email: "admin@app.local" } });
  const requesterId = adminUser?.id;

  if (docCount === 0 && requesterId) {
    const doc1 = await prisma.documentRequest.create({
      data: {
        tenantId: core.tenantId,
        requesterId,
        docNumber: "ศธ 0514.2/ว101",
        trackingCode: "TRK-FORM01",
        title: "แบบฟอร์มขออนุมัติเดินทางไปราชการและฝึกอบรมภายนอกสถาบัน (มคอ./บก.01)",
        docType: "PUBLIC_ANNOUNCEMENT",
        priority: "NORMAL",
        accessLevel: "PUBLIC",
        status: "APPROVED",
        currentStep: 2,
        totalSteps: 2,
        department: "งานบริหารทั่วไปและสารบรรณ",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        submittedAt: new Date(),
        completedAt: new Date(),
      },
    });

    const doc2 = await prisma.documentRequest.create({
      data: {
        tenantId: core.tenantId,
        requesterId,
        docNumber: "ศธ 0514.2/ว102",
        trackingCode: "TRK-ANNC02",
        title: "ประกาศคณะ ที่ 15/2569 เรื่อง แนวปฏิบัติการขอรับทุนสนับสนุนงานวิจัยตีพิมพ์ระดับนานาชาติ (Scopus/WoS)",
        docType: "PUBLIC_ANNOUNCEMENT",
        priority: "NORMAL",
        accessLevel: "PUBLIC",
        status: "APPROVED",
        currentStep: 2,
        totalSteps: 2,
        department: "ฝ่ายวิจัยและนวัตกรรม",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        submittedAt: new Date(),
        completedAt: new Date(),
      },
    });

    const doc3 = await prisma.documentRequest.create({
      data: {
        tenantId: core.tenantId,
        requesterId,
        docNumber: "ศธ 0514.2/1045",
        trackingCode: "TRK-ICSE26",
        title: "ขออนุมัติลาไปเสนอผลงานวิจัยในการประชุมวิชาการระดับนานาชาติ IEEE ICSE 2026 ณ ประเทศญี่ปุ่น",
        docType: "LEAVE_ACADEMIC",
        priority: "URGENT",
        accessLevel: "CONFIDENTIAL",
        status: "IN_REVIEW",
        currentStep: 2,
        totalSteps: 2,
        department: "ภาควิชาวิทยาการคอมพิวเตอร์",
        payload: {
          destination: "Tokyo, Japan",
          startDate: "2026-10-15",
          endDate: "2026-10-22",
        },
        submittedAt: new Date(),
      },
    });

    // บันทึก Routing Slip ขั้นที่ 1
    await prisma.documentApproval.create({
      data: {
        requestId: doc3.id,
        stepOrder: 1,
        approverId: requesterId,
        action: "APPROVE",
        comments: "ตรวจสอบแล้ว กำหนดการไม่กระทบภาระงานสอนและการสอบปลายภาค เห็นควรเสนอคณบดีพิจารณาอนุมัติ",
        signedAt: new Date(),
      },
    });

    console.log(`[seed] สร้างเอกสารตัวอย่าง: ${doc1.docNumber}, ${doc2.docNumber}, ${doc3.docNumber}`);
  }

  console.log(`[seed] เสร็จ — login: admin@app.local / ${DEV_PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
