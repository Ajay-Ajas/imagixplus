import nodemailer, { type Transporter } from "nodemailer";
import { env, hasMail } from "../config/env.js";

let transport: Transporter | null = null;
const get = () =>
  (transport ??= nodemailer.createTransport({
    host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure || env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000
  }));

export const mailConfigured = () => hasMail;

export async function sendContactMail(m: { name: string; email: string; subject: string; message: string }) {
  await get().sendMail({
    from: env.mailFrom || env.smtp.user,
    to: env.contactTo,
    replyTo: { name: m.name, address: m.email },
    subject: `[IMAGIX+ contact] ${m.subject}`,
    text: `New message from the IMAGIX+ website\n\nName: ${m.name}\nEmail: ${m.email}\nSubject: ${m.subject}\n\n${m.message}\n`
  });
}
