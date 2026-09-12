import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test("เปลี่ยน palette ใน settings แล้ว <html data-palette> เปลี่ยนทั้งระบบ", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "blue");
  await page.getByRole("radio", { name: /เขียว/ }).click();
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกการตั้งค่าแล้ว/)).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "green");
  // คืนค่า
  await page.goto("/settings");
  await page.getByRole("radio", { name: /น้ำเงิน/ }).click();
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกการตั้งค่าแล้ว/)).toBeVisible();
});

test("แก้ชื่อที่แสดงใน /me แล้ว navbar เปลี่ยน", async ({ page }) => {
  await page.goto("/me");
  await page.fill("#me-name", "ผู้ดูแลสูงสุด (แก้)");
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกโปรไฟล์แล้ว/)).toBeVisible();
  await expect(page.locator(".acct .nm")).toContainText("(แก้)");
  await page.fill("#me-name", "ผู้ดูแลสูงสุด");
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
});

// A4 — แถบเมนูซ่อนลิงก์ /settings ให้ VIEWER อยู่แล้ว แต่ bookmark เดิมหรือการพิมพ์ URL เองยังพามาถึงได้
// requirePermission จะ throw ตอน render ซึ่งก่อนมีไฟล์ (admin)/error.tsx จะกลายเป็นหน้า 500 เปล่า ๆ ของ Next
test("VIEWER เปิด /settings ตรง ๆ เห็นข้อความ 403 ไม่ใช่หน้า 500", async ({ browser }) => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await loginAs(p, "viewer@app.local");
  await p.waitForURL("**/dashboard");
  await p.goto("/settings");
  // getByRole("alert") เจอ #__next-route-announcer__ ด้วย — filter ด้วยข้อความจริงเหมือน login.spec.ts
  await expect(p.getByRole("alert").filter({ hasText: /ไม่มีสิทธิ์ดำเนินการ/ })).toBeVisible();
  await expect(p.getByText(/เกิดข้อผิดพลาดภายในระบบ/)).toHaveCount(0);
  await ctx.close();
});

test("หน้า settings แสดงส่วนตั้งค่า SMTP Gmail และสามารถกรอกข้อมูลได้", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText(/การตั้งค่าอีเมล \(SMTP Gmail\)/)).toBeVisible();
  await expect(page.locator("#s-smtp-enabled")).toBeVisible();
  await expect(page.locator("#s-smtp-user")).toBeVisible();
  await expect(page.locator("#s-smtp-pass")).toBeVisible();
  await expect(page.getByText(/คำแนะนำการใช้งาน Google App Password/)).toBeVisible();
  await expect(page.getByRole("button", { name: /ส่งอีเมลทดสอบ/ })).toBeVisible();
});

test("หน้า settings แสดงส่วนข้อมูลการติดต่อ สามารถแก้ไข และนำไปแสดงผลที่หน้า Portal Footer", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText(/ข้อมูลการติดต่อและที่อยู่/)).toBeVisible();
  await expect(page.locator("#s-contact-phone")).toBeVisible();
  await expect(page.locator("#s-contact-email")).toBeVisible();
  await expect(page.locator("#s-contact-address-th")).toBeVisible();

  // แก้ไขเบอร์และอีเมล
  const testPhone = "02-999-8888 ต่อ 999";
  const testEmail = "info-test@fms.ac.th";
  await page.fill("#s-contact-phone", testPhone);
  await page.fill("#s-contact-email", testEmail);
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกการตั้งค่าแล้ว/)).toBeVisible();

  // ตรวจสอบในหน้า Portal
  await page.goto("/portal");
  const footer = page.locator("footer");
  await expect(footer).toContainText(testPhone);
  await expect(footer).toContainText(testEmail);

  // คืนค่า
  await page.goto("/settings");
  await page.fill("#s-contact-phone", "02-123-4567 ต่อ 100-104");
  await page.fill("#s-contact-email", "contact@fms.ac.th");
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกการตั้งค่าแล้ว/)).toBeVisible();
});


