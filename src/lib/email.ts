import "server-only";
import net from "node:net";
import tls from "node:tls";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";

export type SmtpProvider = "gmail" | "microsoft365" | "custom";

export type SmtpSettingsView = {
  provider: SmtpProvider | null;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  fromName: string;
  passwordConfigured: boolean;
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function required(value: string, label: string): string {
  if (!value) throw new Error(`${label} manquant pour l'envoi d'e-mails.`);
  return value;
}

function providerDefaults(provider: SmtpProvider) {
  switch (provider) {
    case "gmail":
      return { host: "smtp.gmail.com", port: 587, secure: false };
    case "microsoft365":
      return { host: "smtp.office365.com", port: 587, secure: false };
    default:
      return { host: "", port: 587, secure: false };
  }
}

export function getSmtpProviderDefaults(provider: SmtpProvider) {
  return providerDefaults(provider);
}

async function smtpConfig() {
  const stored = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: {
      smtpProvider: true,
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUser: true,
      smtpPasswordEncrypted: true,
      smtpFromEmail: true,
      smtpFromName: true,
    },
  });

  if (stored?.smtpHost && stored.smtpUser && stored.smtpPasswordEncrypted) {
    return {
      host: required(stored.smtpHost, "Serveur SMTP"),
      port: stored.smtpPort && stored.smtpPort > 0 ? stored.smtpPort : 587,
      secure: stored.smtpSecure,
      user: required(stored.smtpUser, "Compte SMTP"),
      password: decryptSecret(stored.smtpPasswordEncrypted),
      fromEmail: stored.smtpFromEmail?.trim() || stored.smtpUser,
      fromName: stored.smtpFromName?.trim() || "InfraRed Optic-Store",
    };
  }

  // Backward compatibility: an existing deployment may still have SMTP_* in
  // .env. Dashboard settings take precedence as soon as they are complete.
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const password = env("SMTP_PASSWORD");
  if (!host || !user || !password) {
    throw new Error("Aucun serveur SMTP n'est configuré. Configurez-le dans Admin → Paramètres → E-mails.");
  }
  const port = Number(env("SMTP_PORT") || "587");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port SMTP invalide.");
  return {
    host,
    port,
    secure: /^(1|true|yes)$/i.test(env("SMTP_SECURE") || "false"),
    user,
    password,
    fromEmail: env("SMTP_FROM_EMAIL") || user,
    fromName: env("SMTP_FROM_NAME") || "InfraRed Optic-Store",
  };
}

export async function getSmtpSettingsView(): Promise<SmtpSettingsView> {
  const stored = await prisma.storeSettings.findUnique({ where: { singletonKey: "main" }, select: {
      smtpProvider: true,
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUser: true,
      smtpPasswordEncrypted: true,
      smtpFromEmail: true,
      smtpFromName: true,
    },
  });
  const storedProvider = stored?.smtpProvider === "gmail" || stored?.smtpProvider === "microsoft365" || stored?.smtpProvider === "custom"
    ? stored.smtpProvider
    : null;
  if (storedProvider) {
    const defaults = providerDefaults(storedProvider);
    return {
      provider: storedProvider,
      host: stored?.smtpHost ?? defaults.host,
      port: stored?.smtpPort ?? defaults.port,
      secure: stored?.smtpSecure ?? defaults.secure,
      user: stored?.smtpUser ?? "",
      fromEmail: stored?.smtpFromEmail ?? stored?.smtpUser ?? "",
      fromName: stored?.smtpFromName ?? "InfraRed Optic-Store",
      passwordConfigured: Boolean(stored?.smtpPasswordEncrypted),
    };
  }

  const envHost = env("SMTP_HOST");
  const envUser = env("SMTP_USER");
  const envPort = Number(env("SMTP_PORT") || "587");
  return {
    provider: envHost ? "custom" : null,
    host: envHost,
    port: Number.isInteger(envPort) && envPort > 0 && envPort <= 65535 ? envPort : 587,
    secure: /^(1|true|yes)$/i.test(env("SMTP_SECURE") || "false"),
    user: envUser,
    fromEmail: env("SMTP_FROM_EMAIL") || envUser,
    fromName: env("SMTP_FROM_NAME") || "InfraRed Optic-Store",
    passwordConfigured: Boolean(env("SMTP_PASSWORD")),
  };
}

function encodeHeader(value: string) {
  return /[^\x20-\x7e]/.test(value)
    ? `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
    : value;
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

class SMTPConnection {
  private socket: net.Socket | tls.TLSSocket;
  private buffer = "";
  private waiters: Array<(line: string) => void> = [];

  private readonly onDataBound = (chunk: Buffer | string) => this.onData(String(chunk));
  private readonly onErrorBound = () => this.flushPendingError();
  private readonly onCloseBound = () => this.flushPendingError();

  private constructor(socket: net.Socket | tls.TLSSocket) {
    this.socket = socket;
    this.attach(socket);
  }

  private attach(socket: net.Socket | tls.TLSSocket) {
    socket.setEncoding("utf8");
    socket.setTimeout(20_000);
    socket.on("data", this.onDataBound);
    socket.on("error", this.onErrorBound);
    socket.on("close", this.onCloseBound);
    socket.on("timeout", this.onTimeoutBound);
  }

  private detach(socket: net.Socket | tls.TLSSocket) {
    socket.off("data", this.onDataBound);
    socket.off("error", this.onErrorBound);
    socket.off("close", this.onCloseBound);
    socket.off("timeout", this.onTimeoutBound);
  }

  private readonly onTimeoutBound = () => this.flushPendingError("451 SMTP timeout.");

  private onData(chunk: string) {
    this.buffer += chunk;
    for (;;) {
      const idx = this.buffer.indexOf("\r\n");
      if (idx < 0) break;
      const line = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 2);
      this.waiters.shift()?.(line);
    }
  }

  private flushPendingError(message = "550 Connection fermée.") {
    while (this.waiters.length) this.waiters.shift()!(message);
  }

  static async open(host: string, port: number, secure: boolean) {
    const socket = secure
      ? tls.connect({ host, port, servername: host, rejectUnauthorized: true })
      : net.connect({ host, port });

    await new Promise<void>((resolve, reject) => {
      const event = secure ? "secureConnect" : "connect";
      const cleanup = () => {
        socket.off(event, onConnect);
        socket.off("error", onError);
      };
      const onConnect = () => { cleanup(); resolve(); };
      const onError = (error: Error) => { cleanup(); reject(error); };
      socket.once(event, onConnect);
      socket.once("error", onError);
    });

    const connection = new SMTPConnection(socket);
    await connection.readResponse();
    return connection;
  }

  private async readLine() {
    return new Promise<string>((resolve) => this.waiters.push(resolve));
  }

  private async readResponse() {
    let response = await this.readLine();
    while (/^\d{3}-/.test(response)) response = await this.readLine();
    const code = Number(response.slice(0, 3));
    if (!Number.isInteger(code) || code >= 400) throw new Error(`SMTP ${response}`);
    return response;
  }

  async command(command: string) {
    this.socket.write(`${command}\r\n`);
    return this.readResponse();
  }

  async startTLS(host: string) {
    const plain = this.socket as net.Socket;
    this.detach(plain);
    const tlsSocket = tls.connect({ socket: plain, servername: host, rejectUnauthorized: true });
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        tlsSocket.off("secureConnect", onSecure);
        tlsSocket.off("error", onError);
      };
      const onSecure = () => { cleanup(); resolve(); };
      const onError = (error: Error) => { cleanup(); reject(error); };
      tlsSocket.once("secureConnect", onSecure);
      tlsSocket.once("error", onError);
    });
    this.socket = tlsSocket;
    this.attach(tlsSocket);
  }

  close() {
    this.detach(this.socket);
    try { this.socket.end(); } catch {}
  }
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const config = await smtpConfig();
  const connection = await SMTPConnection.open(config.host, config.port, config.secure);
  try {
    const ehlo = env("SMTP_EHLO") || config.fromEmail.split("@")[1] || "localhost";
    await connection.command(`EHLO ${ehlo}`);

    if (!config.secure && config.port !== 25) {
      await connection.command("STARTTLS");
      await connection.startTLS(config.host);
      await connection.command(`EHLO ${ehlo}`);
    }

    try {
      await connection.command("AUTH LOGIN");
      await connection.command(Buffer.from(config.user, "utf8").toString("base64"));
      await connection.command(Buffer.from(config.password, "utf8").toString("base64"));
    } catch {
      const credentials = Buffer.from(`\u0000${config.user}\u0000${config.password}`, "utf8").toString("base64");
      await connection.command(`AUTH PLAIN ${credentials}`);
    }
    await connection.command(`MAIL FROM:<${config.fromEmail}>`);
    await connection.command(`RCPT TO:<${to}>`);
    await connection.command("DATA");

    const message = [
      `From: ${encodeHeader(config.fromName)} <${config.fromEmail}>`,
      `To: <${to}>`,
      `Subject: ${encodeHeader(subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      wrapBase64(html),
      "",
      ".",
    ].join("\r\n");

    await connection.command(message);
    await connection.command("QUIT").catch(() => undefined);
  } finally {
    connection.close();
  }
}
