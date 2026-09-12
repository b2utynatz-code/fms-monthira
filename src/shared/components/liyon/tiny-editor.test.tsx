import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TinyEditor } from "./tiny-editor";

describe("TinyEditor", () => {
  it("renders with placeholder and toolbar buttons", () => {
    const onChange = vi.fn();
    render(<TinyEditor value="" onChange={onChange} placeholder="พิมพ์ข้อความ..." />);

    expect(screen.getByText("พิมพ์ข้อความ...")).toBeTruthy();
    expect(screen.getByText("Tiny Editor")).toBeTruthy();
    expect(screen.getByTitle("ตัวหนา (Bold) Ctrl+B")).toBeTruthy();
    expect(screen.getByTitle("ตัวเอียง (Italic) Ctrl+I")).toBeTruthy();
    expect(screen.getByTitle("ขีดเส้นใต้ (Underline) Ctrl+U")).toBeTruthy();
  });

  it("switches to HTML mode and displays textarea", () => {
    const onChange = vi.fn();
    render(<TinyEditor value="<p>Hello world</p>" onChange={onChange} />);

    const htmlToggle = screen.getByTitle("สลับไปดู/แก้ไขโค้ด HTML");
    fireEvent.click(htmlToggle);

    const textarea = screen.getByPlaceholderText("<p>ระบุโค้ด HTML ที่นี่...</p>");
    expect(textarea).toBeTruthy();
    expect(screen.getByText("โหมด: HTML Source")).toBeTruthy();

    fireEvent.change(textarea, { target: { value: "<h2>New heading</h2>" } });
    expect(onChange).toHaveBeenCalledWith("<h2>New heading</h2>");
  });

  it("displays character and word count correctly", () => {
    const onChange = vi.fn();
    render(<TinyEditor value="<p>คณะวิทยาการจัดการ มหาวิทยาลัย</p>" onChange={onChange} />);

    expect(screen.getByText(/ตัวอักษร/)).toBeTruthy();
    expect(screen.getByText(/คำ/)).toBeTruthy();
  });
});
