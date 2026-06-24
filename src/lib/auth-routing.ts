export const staffRoleNames = ["Lawyer", "Office Admin", "Marketing Staff", "Super Admin"] as const;

export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  return !path.startsWith("/api/");
}

export function sanitizeNextPath(path: string | null | undefined, fallback = "/"): string {
  return isSafeInternalPath(path) ? path : fallback;
}

export function isStaffRoleName(roleName: string): boolean {
  return staffRoleNames.includes(roleName as (typeof staffRoleNames)[number]);
}

export function defaultSignedInPath(roleName: string): string {
  if (roleName === "Client") {
    return "/portal";
  }

  if (isStaffRoleName(roleName)) {
    return "/admin";
  }

  return "/";
}

export function canRoleOpenPath(roleName: string, path: string): boolean {
  if (!isSafeInternalPath(path)) {
    return false;
  }

  if (path === "/" || path.startsWith("/login")) {
    return true;
  }

  if (roleName === "Client") {
    return path === "/portal" || path.startsWith("/portal/");
  }

  if (isStaffRoleName(roleName)) {
    return path === "/admin" || path.startsWith("/admin/");
  }

  return false;
}

export function signedInRedirectPath(roleName: string, requestedPath: string | null | undefined): string {
  const fallback = defaultSignedInPath(roleName);
  const next = sanitizeNextPath(requestedPath, fallback);
  if (next === "/" || next.startsWith("/login")) {
    return fallback;
  }

  return canRoleOpenPath(roleName, next) ? next : fallback;
}

export function isProtectedAppPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/portal" || pathname.startsWith("/portal/");
}

export function loginUrlForProtectedPath(origin: string, pathname: string, search = ""): URL {
  const nextPath = `${pathname}${search}`;
  const url = new URL("/login", origin);
  url.searchParams.set("next", sanitizeNextPath(nextPath, "/"));
  return url;
}
