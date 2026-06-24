import { execFileSync } from "node:child_process";
import path from "node:path";
import { z } from "zod";

export const hostingModeSchema = z.enum(["terminal-vps", "aapanel", "cpanel"]);

export const installerPreflightSchema = z.object({
  hostingMode: hostingModeSchema.default("terminal-vps")
});

export type HostingMode = z.infer<typeof hostingModeSchema>;

export type PanelPreflightCheck = {
  id: string;
  ok: boolean;
  label: string;
};

type RuntimeInfo = {
  nodeVersion?: string;
  npmAvailable?: boolean;
  cwd?: string;
};

export function panelPreflightChecks(
  hostingMode: HostingMode,
  env: NodeJS.ProcessEnv = process.env,
  runtime: RuntimeInfo = {}
): PanelPreflightCheck[] {
  const nodeVersion = runtime.nodeVersion ?? process.versions.node;
  const cwd = runtime.cwd ?? process.cwd();
  const uploadsDir = env.UPLOADS_DIR?.trim() ?? "";
  const databaseUrl = env.DATABASE_URL?.trim() ?? "";
  const appOrigin = env.APP_ORIGIN?.trim() ?? "";
  const dbSetupMode = env.DB_SETUP_MODE?.trim() || "existing";

  const checks: PanelPreflightCheck[] = [
    check("hosting_mode_supported", true, `Hosting mode selected: ${hostingMode}`),
    check("db_setup_mode", dbSetupMode === "existing" || dbSetupMode === "auto", `Database setup mode: ${dbSetupMode}`),
    check("node_version", nodeMajor(nodeVersion) >= 20, `Node.js >= 20 is installed. Current: ${nodeVersion}`),
    check("npm_available", runtime.npmAvailable ?? commandAvailable("npm"), "npm is available for install/build commands."),
    check("database_url_postgresql", isPostgresUrl(databaseUrl), "DATABASE_URL points to PostgreSQL."),
    check("app_origin", /^https?:\/\//.test(appOrigin), "APP_ORIGIN is configured with http/https."),
    check("auth_secret", (env.AUTH_SECRET?.trim().length ?? 0) >= 32, "AUTH_SECRET is configured with at least 32 characters."),
    check("uploads_dir_configured", uploadsDir.length > 0, "UPLOADS_DIR is configured."),
    check("uploads_dir_private", isPrivateUploadPath(uploadsDir, cwd), "UPLOADS_DIR is outside public webroot/public_html."),
    check("storage_driver", env.STORAGE_DRIVER === "vps-filesystem", "STORAGE_DRIVER=vps-filesystem."),
    check("smtp_disabled", env.SMTP_ENABLED !== "true", "SMTP_ENABLED is false/disabled."),
    check("staff_2fa_disabled", env.STAFF_2FA_MODE !== "totp", "STAFF_2FA_MODE is disabled."),
    check("installer_token", Boolean(env.INSTALLER_SETUP_TOKEN?.trim()), "INSTALLER_SETUP_TOKEN is configured.")
  ];

  if (hostingMode === "terminal-vps") {
    checks.push(check("terminal_vps_mode", true, "Terminal VPS mode uses the root/sudo installer path."));
  }

  if (hostingMode === "aapanel") {
    checks.push(
      check("panel_port", Boolean(env.PORT || env.APP_PORT || env.KMT_PORT), "aaPanel mode has a configured Node app port."),
      check("panel_reverse_proxy", env.PANEL_REVERSE_PROXY_READY === "true", "aaPanel reverse proxy has been confirmed.")
    );
  }

  if (hostingMode === "cpanel") {
    checks.push(
      check("panel_port", Boolean(env.PORT || env.APP_PORT || env.KMT_PORT), "cPanel mode has a configured Node app port."),
      check("cpanel_node_app", env.CPANEL_NODE_APP_READY === "true", "cPanel Node.js App has been confirmed."),
      check("cpanel_command_runner", env.CPANEL_COMMAND_RUNNER_READY === "true", "cPanel SSH/Terminal or command runner has been confirmed."),
      check("cpanel_private_uploads", !uploadsDir.toLowerCase().replace(/\\/g, "/").includes("/public_html/"), "cPanel uploads are outside public_html.")
    );
  }

  return checks;
}

export function isPrivateUploadPath(uploadPath: string, cwd = process.cwd()) {
  if (!uploadPath.trim()) {
    return false;
  }

  const normalized = path.resolve(uploadPath).replace(/\\/g, "/").toLowerCase();
  const publicDir = path.resolve(cwd, "public").replace(/\\/g, "/").toLowerCase();

  if (normalized === publicDir || normalized.startsWith(`${publicDir}/`)) {
    return false;
  }

  return !normalized.includes("/public_html/") && !normalized.endsWith("/public_html");
}

function isPostgresUrl(value: string) {
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}

function nodeMajor(version: string) {
  return Number(version.split(".")[0] ?? 0);
}

function commandAvailable(command: string) {
  try {
    execFileSync(command, ["--version"], { stdio: "ignore", timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

function check(id: string, ok: boolean, label: string): PanelPreflightCheck {
  return { id, ok, label };
}
