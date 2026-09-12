"use client";
import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, Image as ImageIcon, Mail, ExternalLink, Eye, EyeOff, Send, MapPin, Phone, Clock, Sparkles, Bot, CheckCircle2, Globe, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiyonCard, LiyonField, PalettePicker } from "@/shared/components/liyon";
import { useT } from "@/shared/lib/i18n/client";
import type { PaletteId } from "@/shared/lib/palette";
import type { TenantSettings } from "@/features/identity";
import { updateSettingsAction, uploadLogoAction, testSmtpAction, testGeminiAction } from "@/features/identity/actions";
import { LogoStudioDialog } from "./logo-studio-dialog";
import { OrgStatementDialog } from "./org-statement-dialog";

export function SettingsForm({ initial }: { initial: TenantSettings }) {
  const t = useT();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nameTh: initial.nameTh,
    nameEn: initial.nameEn,
    logoUrl: initial.logoUrl ?? "",
    palette: initial.palette as PaletteId,
    smtp: {
      enabled: initial.smtp?.enabled ?? false,
      service: (initial.smtp?.service ?? "gmail") as "gmail" | "custom",
      host: initial.smtp?.host || "smtp.gmail.com",
      port: initial.smtp?.port || 587,
      secure: initial.smtp?.secure ?? false,
      user: initial.smtp?.user || "",
      pass: "",
      fromName: initial.smtp?.fromName || "",
      fromEmail: initial.smtp?.fromEmail || "",
    },
    contact: {
      phone: initial.contact?.phone ?? "02-123-4567 ต่อ 100-104",
      email: initial.contact?.email ?? "contact@fms.ac.th",
      addressTh: initial.contact?.addressTh ?? "คณะวิทยาการจัดการ 123 ถนนมหาวิทยาลัย แขวงในเมือง เขตเมือง กรุงเทพฯ 10000",
      addressEn: initial.contact?.addressEn ?? "Faculty of Management Sciences, 123 University Avenue, Bangkok 10000",
      hoursTh: initial.contact?.hoursTh ?? "จันทร์ – ศุกร์: 08:30 – 16:30 น.",
      hoursEn: initial.contact?.hoursEn ?? "Mon – Fri: 08:30 – 16:30",
      facebook: initial.contact?.facebook ?? "",
      line: initial.contact?.line ?? "",
      website: initial.contact?.website ?? "",
    },
    gemini: {
      enabled: initial.gemini?.enabled ?? true,
      apiKey: "",
      model: initial.gemini?.model || "gemini-2.5-flash",
    },
    statement: {
      sloganTh: initial.statement?.sloganTh || "",
      sloganEn: initial.statement?.sloganEn || "",
      visionTh: initial.statement?.visionTh || "",
      visionEn: initial.statement?.visionEn || "",
      missionTh: initial.statement?.missionTh || "",
      missionEn: initial.statement?.missionEn || "",
      valuesTh: initial.statement?.valuesTh || "",
      valuesEn: initial.statement?.valuesEn || "",
    },
  });
  const [logoStudioOpen, setLogoStudioOpen] = useState(false);
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);
  const hasExistingPass = Boolean(initial.smtp?.hasPass);
  const [showPass, setShowPass] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  const hasExistingGeminiKey = Boolean(initial.gemini?.hasApiKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("settings.logoHint"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("settings.logoHint"));
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadLogoAction(fd);
      if (res.ok) {
        setForm((prev) => ({ ...prev, logoUrl: res.data.url }));
        toast.success(t("common.save"));
      } else {
        toast.error(res.error.message || t("common.error"));
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleTestEmail() {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error(t("settings.smtpTestRecipientPh"));
      return;
    }
    if (!form.smtp.user) {
      toast.error(t("settings.smtpGmailAddressPh"));
      return;
    }
    if (!form.smtp.pass && !hasExistingPass) {
      toast.error(t("settings.smtpMissingPassword"));
      return;
    }

    setTesting(true);
    try {
      const res = await testSmtpAction({
        toEmail: testEmail,
        smtp: {
          host: form.smtp.host,
          port: form.smtp.port,
          secure: form.smtp.secure,
          user: form.smtp.user,
          pass: form.smtp.pass,
          fromName: form.smtp.fromName,
          fromEmail: form.smtp.fromEmail,
        },
      });
      if (res.ok) {
        toast.success(t("settings.smtpTestSuccess"));
      } else {
        toast.error(res.error.message || t("settings.smtpTestFailed", { error: "Unknown error" }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(t("settings.smtpTestFailed", { error: msg }));
    } finally {
      setTesting(false);
    }
  }

  async function handleTestGemini() {
    if (!form.gemini.apiKey && !hasExistingGeminiKey) {
      toast.error(t("settings.geminiMissingKey"));
      return;
    }

    setTestingGemini(true);
    try {
      const res = await testGeminiAction({
        apiKey: form.gemini.apiKey,
        model: form.gemini.model,
      });
      if (res.ok) {
        toast.success(t("settings.geminiTestSuccess"));
      } else {
        toast.error(res.error.message || t("common.error"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || t("common.error"));
    } finally {
      setTestingGemini(false);
    }
  }

  function save() {
    start(async () => {
      const r = await updateSettingsAction(form);
      if (!r.ok) {
        setErrors(r.error.fieldErrors ?? {});
        if (!r.error.fieldErrors) toast.error(t(`error.${r.error.code}`));
        return;
      }
      setErrors({});
      toast.success(t("settings.saveOk"));
      router.refresh();
    });
  }

  return (
    <>
      <header className="ph"><h1>{t("settings.title")}</h1></header>
      <div className="set-cards">
        <LiyonCard>
          <h2>{t("settings.orgTitle")}</h2>
          <div className="fields">
            <LiyonField label={t("settings.nameTh")} htmlFor="s-name-th" error={errors.nameTh?.[0]}><input id="s-name-th" value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} /></LiyonField>
            <LiyonField label={t("settings.nameEn")} htmlFor="s-name-en" error={errors.nameEn?.[0]}><input id="s-name-en" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></LiyonField>
            <LiyonField label={t("settings.logoUrl")} htmlFor="s-logo" hint={t("common.optional")} error={errors.logoUrl?.[0]}>
              <div className="space-y-3">
                <div className="logo-up">
                  <div className="prev">
                    {form.logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={form.logoUrl} alt="Logo" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLogoStudioOpen(true)}
                        className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5 font-medium shadow-xs"
                      >
                        <Crop className="h-4 w-4" />
                        <span>{t("settings.changeLogoBtn")}</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="gap-1.5 text-xs text-muted-foreground"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>{t("settings.uploading")}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" />
                            <span>{t("settings.uploadLogo")}</span>
                          </>
                        )}
                      </Button>
                      {form.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm({ ...form, logoUrl: "" })}
                          className="text-muted-foreground hover:text-destructive text-xs h-8"
                        >
                          {t("settings.removeLogo")}
                        </Button>
                      )}
                    </div>

                    {/* ปุ่มแก้ไขข้อความองค์กรแบบมาตรฐานโลก (อยู่ด้านล่างของปุ่มอัปโหลดภาพ) */}
                    <div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setStatementDialogOpen(true)}
                        className="gap-1.5 text-xs bg-muted/80 hover:bg-muted font-medium border border-border/70"
                      >
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        <span>{t("settings.editStatementBtn")}</span>
                      </Button>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {t("settings.logoHint")}
                    </span>
                  </div>
                </div>
                <input
                  id="s-logo"
                  type="text"
                  placeholder="https://... หรือ /uploads/..."
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                />
              </div>
            </LiyonField>
          </div>
        </LiyonCard>

        {/* SMTP Gmail Configuration Card */}
        <LiyonCard>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h2 className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <span>{t("settings.smtpTitle")}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("settings.smtpDesc")}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none bg-muted/50 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted transition-colors">
              <input
                id="s-smtp-enabled"
                type="checkbox"
                checked={form.smtp.enabled}
                onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, enabled: e.target.checked } })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-semibold">{t("settings.smtpEnabled")}</span>
            </label>
          </div>

          <div className="fields">
            {/* Guide notice */}
            <div className="rounded-lg border border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30 p-3 text-xs text-sky-900 dark:text-sky-200 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>คำแนะนำการใช้งาน Google App Password</span>
              </div>
              <p className="leading-relaxed text-sky-800 dark:text-sky-300">
                {t("settings.smtpAppPasswordHint")}
              </p>
              <div>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100 underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t("settings.smtpAppPasswordLink")}
                </a>
              </div>
            </div>

            {/* Gmail User */}
            <LiyonField label={t("settings.smtpGmailAddress")} htmlFor="s-smtp-user" error={errors["smtp.user"]?.[0]}>
              <input
                id="s-smtp-user"
                type="email"
                placeholder={t("settings.smtpGmailAddressPh")}
                value={form.smtp.user}
                onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, user: e.target.value } })}
              />
            </LiyonField>

            {/* App Password */}
            <LiyonField
              label={t("settings.smtpAppPassword")}
              htmlFor="s-smtp-pass"
              hint={hasExistingPass ? t("settings.smtpAppPasswordHasExisting") : undefined}
              error={errors["smtp.pass"]?.[0]}
            >
              <div className="relative flex items-center">
                <input
                  id="s-smtp-pass"
                  type={showPass ? "text" : "password"}
                  placeholder={hasExistingPass ? "••••••••••••••••" : t("settings.smtpAppPasswordPh")}
                  value={form.smtp.pass}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, pass: e.target.value } })}
                  className="pr-10 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPass ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </LiyonField>

            {/* Sender Name & Sender Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.smtpFromName")} htmlFor="s-smtp-from-name" hint={t("common.optional")}>
                <input
                  id="s-smtp-from-name"
                  type="text"
                  placeholder={t("settings.smtpFromNamePh")}
                  value={form.smtp.fromName}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, fromName: e.target.value } })}
                />
              </LiyonField>

              <LiyonField label={t("settings.smtpFromEmail")} htmlFor="s-smtp-from-email" hint={t("common.optional")}>
                <input
                  id="s-smtp-from-email"
                  type="email"
                  placeholder={t("settings.smtpFromEmailPh")}
                  value={form.smtp.fromEmail}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, fromEmail: e.target.value } })}
                />
              </LiyonField>
            </div>

            {/* Host & Port */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.smtpHost")} htmlFor="s-smtp-host">
                <input
                  id="s-smtp-host"
                  type="text"
                  value={form.smtp.host}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, host: e.target.value } })}
                />
              </LiyonField>

              <LiyonField label={t("settings.smtpPort")} htmlFor="s-smtp-port">
                <input
                  id="s-smtp-port"
                  type="number"
                  value={form.smtp.port}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, port: Number(e.target.value) } })}
                />
              </LiyonField>
            </div>

            {/* Test Connection Section */}
            <div className="pt-3 border-t space-y-2.5">
              <div>
                <h3 className="text-sm font-semibold">{t("settings.smtpTestTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("settings.smtpTestDesc")}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="s-smtp-test-email"
                  type="email"
                  placeholder={t("settings.smtpTestRecipientPh")}
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTestEmail}
                  disabled={testing}
                  className="gap-1.5 shrink-0"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("settings.smtpTesting")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{t("settings.smtpTestBtn")}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </LiyonCard>

        {/* Google Gemini AI Configuration Card */}
        <LiyonCard>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h2 className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>{t("settings.geminiTitle")}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("settings.geminiDesc")}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none bg-muted/50 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted transition-colors">
              <input
                id="s-gemini-enabled"
                type="checkbox"
                checked={form.gemini.enabled}
                onChange={(e) => setForm({ ...form, gemini: { ...form.gemini, enabled: e.target.checked } })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-semibold">{t("settings.geminiEnabled")}</span>
            </label>
          </div>

          <div className="fields">
            {/* Guide notice */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/30 p-3 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>คำแนะนำการเชื่อมต่อ Google Gemini API</span>
              </div>
              <p className="leading-relaxed text-indigo-800 dark:text-indigo-300">
                {t("settings.geminiApiKeyHint")}
              </p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <span>{t("settings.geminiApiKeyLink")}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* API Key Input */}
            <LiyonField
              label={t("settings.geminiApiKey")}
              htmlFor="s-gemini-api-key"
              hint={hasExistingGeminiKey ? t("settings.geminiApiKeyHasExisting") : undefined}
            >
              <div className="relative flex items-center">
                <input
                  id="s-gemini-api-key"
                  type={showGeminiKey ? "text" : "password"}
                  placeholder={hasExistingGeminiKey ? "••••••••••••••••••••••••••••••••" : t("settings.geminiApiKeyPh")}
                  value={form.gemini.apiKey}
                  onChange={(e) => setForm({ ...form, gemini: { ...form.gemini, apiKey: e.target.value } })}
                  className="pr-10 w-full font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showGeminiKey ? "Hide API key" : "Show API key"}
                >
                  {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </LiyonField>

            {/* Model Selection */}
            <LiyonField label={t("settings.geminiModel")} htmlFor="s-gemini-model">
              <select
                id="s-gemini-model"
                value={form.gemini.model}
                onChange={(e) => setForm({ ...form, gemini: { ...form.gemini, model: e.target.value } })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (เร็วและแม่นยำสูง - แนะนำ)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (มาตรฐาน)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (งานซับซ้อนและวิเคราะห์เชิงลึก)</option>
              </select>
            </LiyonField>

            {/* Test Gemini Connection */}
            <div className="pt-2 border-t space-y-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>{t("settings.geminiTestTitle")}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("settings.geminiTestDesc")}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestGemini}
                  disabled={testingGemini || (!form.gemini.apiKey && !hasExistingGeminiKey)}
                  className="gap-1.5"
                >
                  {testingGemini ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("settings.geminiTesting")}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>{t("settings.geminiTestBtn")}</span>
                    </>
                  )}
                </Button>
                {hasExistingGeminiKey && !form.gemini.apiKey && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>API Key บันทึกในระบบแล้ว</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </LiyonCard>

        {/* Contact Information & Portal Location Card */}
        <LiyonCard>
          <div className="pb-3 border-b">
            <h2 className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{t("settings.contactTitle")}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("settings.contactDesc")}</p>
          </div>

          <div className="fields">
            {/* Phone and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.contactPhone")} htmlFor="s-contact-phone" error={errors["contact.phone"]?.[0]}>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="s-contact-phone"
                    type="text"
                    placeholder={t("settings.contactPhonePh")}
                    value={form.contact.phone}
                    onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })}
                    className="pl-9 w-full"
                  />
                </div>
              </LiyonField>

              <LiyonField label={t("settings.contactEmail")} htmlFor="s-contact-email" error={errors["contact.email"]?.[0]}>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="s-contact-email"
                    type="email"
                    placeholder={t("settings.contactEmailPh")}
                    value={form.contact.email}
                    onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })}
                    className="pl-9 w-full"
                  />
                </div>
              </LiyonField>
            </div>

            {/* Address TH & EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.contactAddressTh")} htmlFor="s-contact-address-th" error={errors["contact.addressTh"]?.[0]}>
                <textarea
                  id="s-contact-address-th"
                  rows={2}
                  placeholder={t("settings.contactAddressThPh")}
                  value={form.contact.addressTh}
                  onChange={(e) => setForm({ ...form, contact: { ...form.contact, addressTh: e.target.value } })}
                  className="w-full rounded-md border p-2 text-sm bg-background"
                />
              </LiyonField>

              <LiyonField label={t("settings.contactAddressEn")} htmlFor="s-contact-address-en" error={errors["contact.addressEn"]?.[0]}>
                <textarea
                  id="s-contact-address-en"
                  rows={2}
                  placeholder={t("settings.contactAddressEnPh")}
                  value={form.contact.addressEn}
                  onChange={(e) => setForm({ ...form, contact: { ...form.contact, addressEn: e.target.value } })}
                  className="w-full rounded-md border p-2 text-sm bg-background"
                />
              </LiyonField>
            </div>

            {/* Hours TH & EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.contactHoursTh")} htmlFor="s-contact-hours-th" error={errors["contact.hoursTh"]?.[0]}>
                <div className="relative flex items-center">
                  <Clock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="s-contact-hours-th"
                    type="text"
                    placeholder={t("settings.contactHoursThPh")}
                    value={form.contact.hoursTh}
                    onChange={(e) => setForm({ ...form, contact: { ...form.contact, hoursTh: e.target.value } })}
                    className="pl-9 w-full"
                  />
                </div>
              </LiyonField>

              <LiyonField label={t("settings.contactHoursEn")} htmlFor="s-contact-hours-en" error={errors["contact.hoursEn"]?.[0]}>
                <div className="relative flex items-center">
                  <Clock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="s-contact-hours-en"
                    type="text"
                    placeholder={t("settings.contactHoursEnPh")}
                    value={form.contact.hoursEn}
                    onChange={(e) => setForm({ ...form, contact: { ...form.contact, hoursEn: e.target.value } })}
                    className="pl-9 w-full"
                  />
                </div>
              </LiyonField>
            </div>

            {/* Social Media Links */}
            <div className="pt-2 border-t space-y-3">
              <h3 className="text-sm font-semibold">{t("settings.contactSocialTitle")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <LiyonField label={t("settings.contactFacebook")} htmlFor="s-contact-fb" hint={t("common.optional")}>
                  <input
                    id="s-contact-fb"
                    type="url"
                    placeholder={t("settings.contactFacebookPh")}
                    value={form.contact.facebook}
                    onChange={(e) => setForm({ ...form, contact: { ...form.contact, facebook: e.target.value } })}
                  />
                </LiyonField>

                <LiyonField label={t("settings.contactLine")} htmlFor="s-contact-line" hint={t("common.optional")}>
                  <input
                    id="s-contact-line"
                    type="text"
                    placeholder={t("settings.contactLinePh")}
                    value={form.contact.line}
                    onChange={(e) => setForm({ ...form, contact: { ...form.contact, line: e.target.value } })}
                  />
                </LiyonField>

                <LiyonField label={t("settings.contactWebsite")} htmlFor="s-contact-web" hint={t("common.optional")}>
                  <input
                    id="s-contact-web"
                    type="url"
                    placeholder={t("settings.contactWebsitePh")}
                    value={form.contact.website}
                    onChange={(e) => setForm({ ...form, contact: { ...form.contact, website: e.target.value } })}
                  />
                </LiyonField>
              </div>
            </div>
          </div>
        </LiyonCard>

        {/* World-Standard Organization Statements Card */}
        <LiyonCard>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h2 className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <span>{t("settings.statementCardTitle")}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("settings.statementCardDesc")}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatementDialogOpen(true)}
              className="gap-1.5 shrink-0 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Globe className="h-4 w-4" />
              <span>{t("settings.editStatementBtn")}</span>
            </Button>
          </div>

          <div className="fields">
            {/* Slogan TH & EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.statementSloganTh")} htmlFor="s-statement-slogan-th" hint={t("common.optional")}>
                <input
                  id="s-statement-slogan-th"
                  type="text"
                  placeholder={t("settings.statementSloganThPh")}
                  value={form.statement.sloganTh}
                  onChange={(e) => setForm({ ...form, statement: { ...form.statement, sloganTh: e.target.value } })}
                />
              </LiyonField>
              <LiyonField label={t("settings.statementSloganEn")} htmlFor="s-statement-slogan-en" hint={t("common.optional")}>
                <input
                  id="s-statement-slogan-en"
                  type="text"
                  placeholder={t("settings.statementSloganEnPh")}
                  value={form.statement.sloganEn}
                  onChange={(e) => setForm({ ...form, statement: { ...form.statement, sloganEn: e.target.value } })}
                />
              </LiyonField>
            </div>

            {/* Vision TH & EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.statementVisionTh")} htmlFor="s-statement-vision-th" hint={t("common.optional")}>
                <textarea
                  id="s-statement-vision-th"
                  rows={2}
                  placeholder={t("settings.statementVisionThPh")}
                  value={form.statement.visionTh}
                  onChange={(e) => setForm({ ...form, statement: { ...form.statement, visionTh: e.target.value } })}
                  className="w-full rounded-md border p-2 text-sm bg-background"
                />
              </LiyonField>
              <LiyonField label={t("settings.statementVisionEn")} htmlFor="s-statement-vision-en" hint={t("common.optional")}>
                <textarea
                  id="s-statement-vision-en"
                  rows={2}
                  placeholder={t("settings.statementVisionEnPh")}
                  value={form.statement.visionEn}
                  onChange={(e) => setForm({ ...form, statement: { ...form.statement, visionEn: e.target.value } })}
                  className="w-full rounded-md border p-2 text-sm bg-background"
                />
              </LiyonField>
            </div>

            {/* Mission TH & EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.statementMissionTh")} htmlFor="s-statement-mission-th" hint={t("common.optional")}>
                <textarea
                  id="s-statement-mission-th"
                  rows={3}
                  placeholder={t("settings.statementMissionThPh")}
                  value={form.statement.missionTh}
                  onChange={(e) => setForm({ ...form, statement: { ...form.statement, missionTh: e.target.value } })}
                  className="w-full rounded-md border p-2 text-sm bg-background"
                />
              </LiyonField>
              <LiyonField label={t("settings.statementMissionEn")} htmlFor="s-statement-mission-en" hint={t("common.optional")}>
                <textarea
                  id="s-statement-mission-en"
                  rows={3}
                  placeholder={t("settings.statementMissionEnPh")}
                  value={form.statement.missionEn}
                  onChange={(e) => setForm({ ...form, statement: { ...form.statement, missionEn: e.target.value } })}
                  className="w-full rounded-md border p-2 text-sm bg-background"
                />
              </LiyonField>
            </div>

            {/* Core Values TH & EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LiyonField label={t("settings.statementValuesTh")} htmlFor="s-statement-values-th" hint={t("common.optional")}>
                <textarea
                  id="s-statement-values-th"
                  rows={2}
                  placeholder={t("settings.statementValuesThPh")}
                  value={form.statement.valuesTh}
                  onChange={(e) => setForm({ ...form, statement: { ...form.statement, valuesTh: e.target.value } })}
                  className="w-full rounded-md border p-2 text-sm bg-background"
                />
              </LiyonField>
              <LiyonField label={t("settings.statementValuesEn")} htmlFor="s-statement-values-en" hint={t("common.optional")}>
                <textarea
                  id="s-statement-values-en"
                  rows={2}
                  placeholder={t("settings.statementValuesEnPh")}
                  value={form.statement.valuesEn}
                  onChange={(e) => setForm({ ...form, statement: { ...form.statement, valuesEn: e.target.value } })}
                  className="w-full rounded-md border p-2 text-sm bg-background"
                />
              </LiyonField>
            </div>
          </div>
        </LiyonCard>

        <LiyonCard>
          <h2>{t("settings.brandTitle")}</h2>
          <p>{t("settings.brandDesc")}</p>
          <PalettePicker value={form.palette} onChange={(p) => setForm({ ...form, palette: p })} label={t("settings.paletteLabel")} />
          {form.palette === "coral" && <p className="warn" role="note">{t("settings.coralWarn")}</p>}
        </LiyonCard>

        <div className="savebar"><Button type="button" onClick={save} disabled={pending}>{t("common.save")}</Button></div>
      </div>

      <LogoStudioDialog
        open={logoStudioOpen}
        onOpenChange={setLogoStudioOpen}
        currentLogoUrl={form.logoUrl}
        onSuccess={(newLogoUrl) => {
          setForm((prev) => ({ ...prev, logoUrl: newLogoUrl }));
        }}
      />

      <OrgStatementDialog
        open={statementDialogOpen}
        onOpenChange={setStatementDialogOpen}
        initial={form.statement}
        onSave={(updated) => {
          setForm((prev) => ({ ...prev, statement: updated }));
        }}
        hasGeminiKey={hasExistingGeminiKey || Boolean(form.gemini.apiKey)}
      />
    </>
  );
}

