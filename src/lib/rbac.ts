import type { RoleName } from "@/lib/db/schema";

export const OWNER_PATHS = ["/dashboard", "/tbq-amal"];
export const ADMIN_PATHS = ["/admin", "/connector"];
export const SHARED_PATHS = ["/pengguna", "/profil"];

export function homePathForRole(role: RoleName): string {
  return role === "owner" ? "/dashboard" : "/admin";
}

export function canAccessPath(role: RoleName, pathname: string): boolean {
  if (pathname === "/dilarang") {
    return true;
  }
  if (SHARED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (role === "owner") {
    if (ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return false;
    }
    return true;
  }
  if (OWNER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  if (pathname.startsWith("/api/dashboard")) {
    return false;
  }
  return true;
}

export function navItems(role: RoleName) {
  if (role === "owner") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/tbq-amal", label: "TBQ Amal" },
      { href: "/pengguna", label: "Pengurusan Pengguna" },
      { href: "/profil", label: "Profil" },
    ];
  }
  return [
    { href: "/admin", label: "Panel Admin" },
    { href: "/pengguna", label: "Pengurusan Pengguna" },
    { href: "/connector", label: "Tetapan Connector" },
    { href: "/profil", label: "Profil" },
  ];
}
