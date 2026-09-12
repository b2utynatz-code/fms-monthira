import "server-only";
import nodemailer from "nodemailer";
import { env, smtpConfigured } from "./env";
import { logger } from "./logger";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  smtp?: SmtpConfig | null;
}

/** ไม่มี SMTP (ทั้ง tenant และ env) → เขียนลง log ระดับ info แล้วคืน delivered:false — ระบบต้องไม่ล้มเพราะส่งอีเมลไม่ได้ */
export async function sendMail(input: MailInput): Promise<{ delivered: boolean }> {
  let host = input.smtp?.host;
  let port = input.smtp?.port ?? 587;
  let secure = input.smtp?.secure ?? (port === 465);
  let user = input.smtp?.user;
  let pass = input.smtp?.pass;
  let from = input.smtp?.from;

  if (!host) {
    if (!smtpConfigured()) {
      logger.info("mail (no SMTP, logged only)", { to: input.to, subject: input.subject, text: input.text });
      return { delivered: false };
    }
    const e = env();
    host = e.SMTP_HOST;
    port = e.SMTP_PORT;
    secure = e.SMTP_PORT === 465;
    user = e.SMTP_USER;
    pass = e.SMTP_PASS;
    from = e.SMTP_FROM;
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass ? pass.replace(/\s+/g, "") : "" } : undefined,
    });
    await transport.sendMail({
      from: from || (user ? `"${user}" <${user}>` : "FMS System <no-reply@localhost>"),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { delivered: true };
  } catch (err) {
    logger.error("mail send failed", { to: input.to, err: err instanceof Error ? err.message : String(err) });
    return { delivered: false };
  }
}

