import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertInstallerToken, getInstallerLockPath, installerBootstrapSchema, isInstallerEnabled } from "@/server/install/installer-service";
import { installerPreflightSchema, panelPreflightChecks } from "@/server/install/panel-preflight";

function envFixture(values: Record<string, string | undefined> = {}) {
  return { NODE_ENV: "test", ...values } as unknown as NodeJS.ProcessEnv;
}

describe("PLAN-25 installer contract", () => {
  it("keeps the installer behind an explicit setup token and env flag", () => {
    expect(isInstallerEnabled(envFixture({ INSTALLER_ENABLED: "true" }))).toBe(true);
    expect(isInstallerEnabled(envFixture({ INSTALLER_ENABLED: "false" }))).toBe(false);
    expect(getInstallerLockPath(envFixture({ INSTALLER_LOCK_PATH: "/tmp/kmt-install.lock" }))).toBe("/tmp/kmt-install.lock");

    expect(() => assertInstallerToken("secret", envFixture({ INSTALLER_SETUP_TOKEN: "secret" }))).not.toThrow();
    expect(() => assertInstallerToken("wrong", envFixture({ INSTALLER_SETUP_TOKEN: "secret" }))).toThrow("Installer setup token");
    expect(() => assertInstallerToken("secret", envFixture())).toThrow("Installer setup token");
  });

  it("bootstraps first Super Admin without any TOTP fields", () => {
    const payload = installerBootstrapSchema.parse({
      office: {
        firmName: "KMT Legal",
        publicPhone: "",
        publicEmail: "office@example.com",
        primaryLocale: "ar"
      },
      admin: {
        name: "Super Admin",
        email: "admin@example.com",
        password: "LongEnoughPassword1",
        locale: "ar"
      }
    });

    expect(payload.admin.email).toBe("admin@example.com");
    expect(JSON.stringify(payload)).not.toContain("totp");
  });

  it("does not expose TOTP setup in the install wizard", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "features", "install", "install-wizard.tsx"), "utf8");

    expect(source).toContain("لا توجد خطوة TOTP في هذه النسخة");
    expect(source).toContain("خادم VPS عبر الطرفية");
    expect(source).toContain("aaPanel");
    expect(source).toContain("cPanel");
    expect(source).not.toContain('name="totp"');
    expect(source).not.toContain("/login/2fa");
  });
});

describe("PLAN-26 panel-aware installer contract", () => {
  it("accepts only supported hosting modes and defaults to terminal VPS", () => {
    expect(installerPreflightSchema.parse({}).hostingMode).toBe("terminal-vps");
    expect(installerPreflightSchema.parse({ hostingMode: "aapanel" }).hostingMode).toBe("aapanel");
    expect(installerPreflightSchema.parse({ hostingMode: "cpanel" }).hostingMode).toBe("cpanel");
    expect(() => installerPreflightSchema.parse({ hostingMode: "shared-hosting" })).toThrow();
  });

  it("checks cPanel hard requirements before bootstrap", () => {
    const checks = panelPreflightChecks(
      "cpanel",
      envFixture({
        APP_ORIGIN: "https://kmt.example.com",
        AUTH_SECRET: "x".repeat(48),
        DATABASE_URL: "mysql://bad",
        DB_SETUP_MODE: "manual",
        INSTALLER_SETUP_TOKEN: "token",
        PORT: "3000",
        SMTP_ENABLED: "false",
        STAFF_2FA_MODE: "disabled",
        STORAGE_DRIVER: "vps-filesystem",
        UPLOADS_DIR: "/home/account/public_html/uploads"
      }),
      { cwd: process.cwd(), nodeVersion: "20.19.0", npmAvailable: true }
    );

    expect(checks.find((item) => item.id === "db_setup_mode")?.ok).toBe(false);
    expect(checks.find((item) => item.id === "database_url_postgresql")?.ok).toBe(false);
    expect(checks.find((item) => item.id === "uploads_dir_private")?.ok).toBe(false);
    expect(checks.find((item) => item.id === "cpanel_node_app")?.ok).toBe(false);
    expect(checks.find((item) => item.id === "cpanel_command_runner")?.ok).toBe(false);
  });

  it("keeps panel-assisted install script free of root-only service commands", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "deploy", "install", "panel-install.sh"), "utf8");

    expect(source).toContain("--panel=aapanel|cpanel");
    expect(source).toContain("DB_SETUP_MODE");
    expect(source).toContain("existing");
    expect(source).toContain("auto");
    expect(source).toContain("may not appear in the panel UI");
    expect(source).not.toMatch(/\bapt-get\b|\bsystemctl\b|\bcertbot\b|\/etc\/nginx/);
  });
});
