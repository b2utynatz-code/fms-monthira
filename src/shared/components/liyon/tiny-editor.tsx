"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Minus,
  RemoveFormatting,
  Undo,
  Redo,
  Code2,
  Eye,
  Check,
  X,
} from "lucide-react";

export interface TinyEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  className?: string;
}

export function TinyEditor({
  value,
  onChange,
  placeholder = "พิมพ์เนื้อหาที่นี่...",
  minHeight = "220px",
  disabled = false,
  className = "",
}: TinyEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(value);
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // Link Dialog / Popover State
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);

  // Image Dialog State
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // Sync external value to contentEditable div
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastHtmlRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
      lastHtmlRef.current = value || "";
    }
  }, [value]);

  // Initial set
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
      lastHtmlRef.current = value;
    }
  }, [value]);

  // Emit changes on user typing
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    // Normalize empty div
    const cleanHtml = html === "<p><br></p>" || html === "<br>" ? "" : html;
    lastHtmlRef.current = cleanHtml;
    onChange(cleanHtml);
  }, [onChange]);

  const executeCommand = useCallback(
    (command: string, val: string | undefined = undefined) => {
      if (disabled || isHtmlMode) return;
      if (editorRef.current) {
        editorRef.current.focus();
      }
      document.execCommand(command, false, val);
      handleInput();
    },
    [disabled, isHtmlMode, handleInput]
  );

  // Formatting actions
  const handleFormatBlock = (tag: string) => {
    executeCommand("formatBlock", tag);
  };

  const handleOpenLinkDialog = () => {
    if (disabled || isHtmlMode) return;
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : "";
    setLinkText(selectedText);
    setLinkUrl("");
    setLinkNewTab(true);
    setShowLinkDialog(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      setShowLinkDialog(false);
      return;
    }
    if (editorRef.current) {
      editorRef.current.focus();
    }
    let validUrl = linkUrl.trim();
    if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://") && !validUrl.startsWith("/")) {
      validUrl = "https://" + validUrl;
    }

    if (linkText) {
      const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
      const linkHtml = `<a href="${validUrl}"${targetAttr} class="text-primary underline font-medium">${linkText}</a>`;
      executeCommand("insertHTML", linkHtml);
    } else {
      executeCommand("createLink", validUrl);
    }
    setShowLinkDialog(false);
  };

  const handleApplyImage = () => {
    if (!imageUrl.trim()) {
      setShowImageDialog(false);
      return;
    }
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const imgHtml = `<img src="${imageUrl.trim()}" alt="${imageAlt.trim() || "image"}" class="max-w-full h-auto rounded-lg my-3 border shadow-xs" />`;
    executeCommand("insertHTML", imgHtml);
    setImageUrl("");
    setImageAlt("");
    setShowImageDialog(false);
  };

  // Switch between WYSIWYG and HTML Source Code
  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to Visual
      if (editorRef.current) {
        editorRef.current.innerHTML = value || "";
        lastHtmlRef.current = value || "";
      }
      setIsHtmlMode(false);
    } else {
      // Switching from Visual to HTML
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        onChange(html);
        lastHtmlRef.current = html;
      }
      setIsHtmlMode(true);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        executeCommand("bold");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        executeCommand("italic");
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        executeCommand("underline");
      }
    }
  };

  // Text stats
  const plainText = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const charCount = plainText.length;
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  return (
    <div className={`rounded-lg border bg-background shadow-xs overflow-hidden transition-all ${className}`}>
      {/* Tiny Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-muted/40 border-b select-none text-muted-foreground">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
          <button
            type="button"
            title="เลิกทำ (Undo) Ctrl+Z"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("undo")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="ทำซ้ำ (Redo) Ctrl+Y"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("redo")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/60">
          <button
            type="button"
            title="หัวข้อขนาดใหญ่ (H2)"
            disabled={disabled || isHtmlMode}
            onClick={() => handleFormatBlock("<h2>")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors font-bold text-xs flex items-center gap-0.5"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="หัวข้อขนาดย่อย (H3)"
            disabled={disabled || isHtmlMode}
            onClick={() => handleFormatBlock("<h3>")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors font-bold text-xs flex items-center gap-0.5"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="หัวข้อย่อยระดับ 3 (H4)"
            disabled={disabled || isHtmlMode}
            onClick={() => handleFormatBlock("<h4>")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors font-bold text-xs flex items-center gap-0.5"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="ย่อหน้าปกติ (Paragraph)"
            disabled={disabled || isHtmlMode}
            onClick={() => handleFormatBlock("<p>")}
            className="px-1.5 py-1 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors font-semibold text-[11px]"
          >
            P
          </button>
        </div>

        {/* Inline formatting */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/60">
          <button
            type="button"
            title="ตัวหนา (Bold) Ctrl+B"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("bold")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="ตัวเอียง (Italic) Ctrl+I"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("italic")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="ขีดเส้นใต้ (Underline) Ctrl+U"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("underline")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="ขีดฆ่า (Strikethrough)"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("strikeThrough")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/60">
          <button
            type="button"
            title="จัดชิดซ้าย"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("justifyLeft")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="จัดกึ่งกลาง"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("justifyCenter")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="จัดชิดขวา"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("justifyRight")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="จัดเต็มแนวขอบ"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("justifyFull")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Lists & Quote */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/60">
          <button
            type="button"
            title="รายการแบบจุด (Bullet list)"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("insertUnorderedList")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="รายการแบบตัวเลข (Numbered list)"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("insertOrderedList")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="กล่องข้อความอ้างอิง (Blockquote)"
            disabled={disabled || isHtmlMode}
            onClick={() => handleFormatBlock("<blockquote>")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Media & Links */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/60">
          <button
            type="button"
            title="แทรกลิงก์ (Link)"
            disabled={disabled || isHtmlMode}
            onClick={handleOpenLinkDialog}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="แทรกรูปภาพจาก URL"
            disabled={disabled || isHtmlMode}
            onClick={() => setShowImageDialog(true)}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="เส้นคั่นแนวนอน (Horizontal rule)"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("insertHorizontalRule")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="โค้ดตัวอย่าง"
            disabled={disabled || isHtmlMode}
            onClick={() => handleFormatBlock("<pre>")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Clear Format */}
        <div className="flex items-center gap-0.5 px-1">
          <button
            type="button"
            title="ล้างการจัดรูปแบบทั้งหมด"
            disabled={disabled || isHtmlMode}
            onClick={() => executeCommand("removeFormat")}
            className="p-1.5 rounded-md hover:bg-muted hover:text-destructive disabled:opacity-40 transition-colors"
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Switch mode to HTML Source */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggleHtmlMode}
            className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
              isHtmlMode
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={isHtmlMode ? "สลับไปโหมดแสดงผล (Visual)" : "สลับไปดู/แก้ไขโค้ด HTML"}
          >
            {isHtmlMode ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Visual</span>
              </>
            ) : (
              <>
                <Code2 className="h-3.5 w-3.5" />
                <span>HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Link Input Dialog Banner */}
      {showLinkDialog && (
        <div className="bg-sky-50 dark:bg-sky-950/50 p-2.5 border-b border-sky-200 dark:border-sky-800/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-sky-900 dark:text-sky-200">แทรกลิงก์:</span>
          <input
            type="text"
            placeholder="ข้อความที่แสดง (Text)"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            className="rounded border bg-background px-2 py-1 text-xs w-36"
          />
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="rounded border bg-background px-2 py-1 text-xs flex-1 min-w-[160px]"
            autoFocus
          />
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={linkNewTab}
              onChange={(e) => setLinkNewTab(e.target.checked)}
              className="h-3.5 w-3.5 rounded"
            />
            <span>เปิดแท็บใหม่</span>
          </label>
          <button
            type="button"
            onClick={handleApplyLink}
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-2.5 text-xs gap-1"
          >
            <Check className="h-3 w-3" />
            <span>แทรก</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLinkDialog(false)}
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors hover:bg-muted hover:text-foreground h-7 px-2 text-xs"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Image Input Dialog Banner */}
      {showImageDialog && (
        <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2.5 border-b border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200">แทรกภาพ:</span>
          <input
            type="url"
            placeholder="URL รูปภาพ (https://...)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="rounded border bg-background px-2 py-1 text-xs flex-1 min-w-[180px]"
            autoFocus
          />
          <input
            type="text"
            placeholder="คำอธิบายรูปภาพ (Alt text)"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            className="rounded border bg-background px-2 py-1 text-xs w-44"
          />
          <button
            type="button"
            onClick={handleApplyImage}
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-2.5 text-xs gap-1"
          >
            <Check className="h-3 w-3" />
            <span>แทรกรูปภาพ</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImageDialog(false)}
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors hover:bg-muted hover:text-foreground h-7 px-2 text-xs"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="relative">
        {isHtmlMode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="<p>ระบุโค้ด HTML ที่นี่...</p>"
            style={{ minHeight }}
            className="w-full p-3 font-mono text-xs bg-muted/20 focus:outline-none resize-y border-none"
          />
        ) : (
          <>
            <div
              ref={editorRef}
              contentEditable={!disabled}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              style={{ minHeight }}
              className="p-3.5 focus:outline-none text-sm leading-relaxed prose dark:prose-invert max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_img]:max-h-72 [&_img]:object-cover"
              aria-label={placeholder}
            />
            {(!value || value === "<p><br></p>" || value === "<br>") && (
              <div className="absolute top-3.5 left-3.5 text-sm text-muted-foreground/50 pointer-events-none select-none">
                {placeholder}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tiny Editor Footer Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-t text-[11px] text-muted-foreground select-none">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground/80">Tiny Editor</span>
          <span>•</span>
          <span>โหมด: {isHtmlMode ? "HTML Source" : "Visual WYSIWYG"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{charCount} ตัวอักษร</span>
          <span>•</span>
          <span>{wordCount} คำ</span>
        </div>
      </div>
    </div>
  );
}
