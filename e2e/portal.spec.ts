import { test, expect } from "@playwright/test";
import { expectNoRawI18nKeys } from "./helpers";

test.describe("Portal & Valley Hero Tests", () => {
  test("หน้า Portal แสดงผล Valley Hero, สถิติ, เมนู และ Footer ครบถ้วน", async ({ page }) => {
    await page.goto("/portal");
    await expectNoRawI18nKeys(page);

    // ตรวจสอบ Navbar
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: /หน้าแรก|Home/ })).toBeVisible();
    await expect(header.getByRole("link", { name: /ข่าวประชาสัมพันธ์|News/ })).toBeVisible();
    await expect(header.getByRole("link", { name: /คณาจารย์|Faculty/ })).toBeVisible();

    // ตรวจสอบ Valley Hero Section
    const heroSection = page.locator("section").first();
    await expect(heroSection).toBeVisible();
    await expect(heroSection.getByText(/เปิดรับสมัครนักศึกษาใหม่|Admissions Open/i)).toBeVisible();
    await expect(heroSection.getByRole("link", { name: /ดูหลักสูตรทั้งหมด|Explore Programs/i })).toBeVisible();
    await expect(heroSection.getByRole("link", { name: /ข่าวสารและประกาศ|Latest News/i })).toBeVisible();

    // ตรวจสอบ Video Ambient Element
    const video = heroSection.locator("video");
    await expect(video).toBeAttached();

    // ตรวจสอบปุ่มควบคุม Ambient Video
    const ambientBtn = heroSection.getByRole("button", { name: /Pause background video|Play background video/i });
    await expect(ambientBtn).toBeVisible();

    // ตรวจสอบ 4 Stats Columns
    await expect(heroSection.getByText(/หลักสูตรมาตรฐาน|Academic Programs/i)).toBeVisible();
    await expect(heroSection.getByText(/อัตราการได้งานทำ|Graduate Employment/i)).toBeVisible();

    // ตรวจสอบ Liyon Ink Band Footer
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/All rights reserved|สงวนลิขสิทธิ์/i)).toBeVisible();
    await expect(footer.getByRole("button", { name: /Back to top|กลับขึ้นด้านบน/i })).toBeVisible();
  });

  test("สามารถเปิดหน้าย่อยของ Portal ได้ครบทุกเส้นทางโดยไม่มีข้อผิดพลาด", async ({ page }) => {
    // 1. หน้าข่าวสาร
    await page.goto("/portal/news");
    await expectNoRawI18nKeys(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // 2. หน้าคณาจารย์
    await page.goto("/portal/staff");
    await expectNoRawI18nKeys(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // 3. หน้าหลักสูตร
    await page.goto("/portal/curriculum");
    await expectNoRawI18nKeys(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // 4. หน้าตารางการใช้ห้อง
    await page.goto("/portal/bookings");
    await expectNoRawI18nKeys(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // 5. หน้าเอกสารและแบบฟอร์ม
    await page.goto("/portal/documents");
    await expectNoRawI18nKeys(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("เมื่อล็อกอินเป็น Admin หน้า Portal Navbar จะแสดง Avatar Menu พร้อมทางลัดระบบหลังบ้าน", async ({ page }) => {
    await page.goto("/portal");

    // ตรวจสอบบล็อก .acct บน Navbar
    const acctTrigger = page.locator(".acct button").first();
    await expect(acctTrigger).toBeVisible();
    await expect(acctTrigger).toContainText("ผู้ดูแลสูงสุด");

    // คลิกเปิด Avatar Dropdown Menu
    await acctTrigger.click();

    // ตรวจสอบเมนูภายใน Dropdown
    await expect(page.getByText("admin@app.local")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /ระบบหลังบ้าน|Admin Console/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /โปรไฟล์|Profile/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /ตั้งค่า|Settings/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /ออกจากระบบ|Sign out/i })).toBeVisible();
  });

  test("Admin Console หน้าหลักและโมดูลสำคัญเรนเดอร์ได้สมบูรณ์", async ({ page }) => {
    // 1. Dashboard
    await page.goto("/dashboard");
    await expectNoRawI18nKeys(page);
    await expect(page.getByRole("heading", { name: /แดชบอร์ด|Dashboard/i })).toBeVisible();

    // 2. News Admin
    await page.goto("/news");
    await expectNoRawI18nKeys(page);

    // 3. Staff Admin
    await page.goto("/staff");
    await expectNoRawI18nKeys(page);

    // 4. Curriculum Admin
    await page.goto("/curriculum");
    await expectNoRawI18nKeys(page);

    // 5. Bookings Admin
    await page.goto("/bookings");
    await expectNoRawI18nKeys(page);

    // 6. Documents Admin
    await page.goto("/documents");
    await expectNoRawI18nKeys(page);

    // 7. Settings Admin
    await page.goto("/settings");
    await expectNoRawI18nKeys(page);

    // 8. Users Admin
    await page.goto("/users");
    await expectNoRawI18nKeys(page);
  });

  test("ระบบบริหารจัดการภาควิชาหรือส่วนงานเพื่อจัดเก็บหลักสูตรทำงานได้อย่างถูกต้อง", async ({ page }) => {
    await page.goto("/curriculum");
    await expectNoRawI18nKeys(page);

    // ตรวจสอบแท็บหลักสูตร และแท็บภาควิชา/ส่วนงาน
    const programTab = page.getByRole("button", { name: /หลักสูตรการศึกษา|Academic Programs/i });
    const deptTab = page.getByRole("button", { name: /ภาควิชา \/ ส่วนงาน|Departments & Divisions/i });
    await expect(programTab).toBeVisible();
    await expect(deptTab).toBeVisible();

    // สลับไปยังแท็บภาควิชา/ส่วนงาน
    await deptTab.click();
    await expect(page.getByText("ภาควิชาวิทยาการคอมพิวเตอร์").first()).toBeVisible();
    await expect(page.getByText("CS", { exact: true }).first()).toBeVisible();

    // ตรวจสอบการเปิด Dialog เพิ่มภาควิชา
    const addDeptBtn = page.getByRole("button", { name: /เพิ่มภาควิชา \/ ส่วนงาน|Add Department/i });
    await expect(addDeptBtn).toBeVisible();
    await addDeptBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByPlaceholder("เช่น CS, IS, BA")).toBeVisible();
    await page.getByRole("button", { name: /ยกเลิก|Cancel/i }).click();

    // สลับกลับมาแท็บหลักสูตร
    await programTab.click();
    const addProgBtn = page.getByRole("button", { name: /เพิ่มหลักสูตรใหม่|Add Program/i });
    await expect(addProgBtn).toBeVisible();
    await addProgBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // ตรวจสอบว่าในฟอร์มมีตัวเลือกภาควิชา
    const deptSelect = page.locator("select").filter({ hasText: /CS|เลือกภาควิชา/i });
    await expect(deptSelect).toBeVisible();
    await page.getByRole("button", { name: /ยกเลิก|Cancel/i }).click();

    // ทดสอบช่องค้นหารหัสและหลักสูตร
    const searchInput = page.getByPlaceholder(/ค้นหารหัส, ชื่อหลักสูตร/i);
    await expect(searchInput).toBeVisible();

    // ค้นหาด้วยรหัส "CS-2026"
    await searchInput.fill("CS-2026");
    await expect(page.getByText("CS-2026")).toBeVisible();
    await expect(page.getByText("IT-2026")).not.toBeVisible();

    // ล้างช่องค้นหา
    await searchInput.fill("");
    await expect(page.getByText("IT-2026")).toBeVisible();
  });
});
