"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cable,
  SlidersHorizontal,
  PanelsTopLeft,
  FolderOpen,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useDevice } from "@/lib/device/store";
const navigation = [
  { href: "/studio", label: "Studio", icon: PanelsTopLeft },
  { href: "/device", label: "Device lab", icon: Cable },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useDevice((s) => s.status);
  const mode = useDevice((s) => s.mode);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/device" className="brand">
          <span className="brand-mark">
            <Sparkles size={24} />
          </span>
          <span>
            Tama Paradise<small>STUDIO</small>
          </span>
        </Link>
        <div className="nav-caption">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              className={pathname === href ? "nav-link active" : "nav-link"}
            >
              <Icon size={19} />
              {label}
              {pathname === href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">A LITTLE WORLD, MADE BY YOU</span>
          <p>
            Big ideas.
            <br />
            Tiny pixels.
          </p>
          <span>Start small. Make it yours.</span>
          <div className="pixel-flower" aria-hidden="true">
            ✿
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="version-dot" /> v0.1 · Foundation
          <ArrowUpRight size={14} />
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span>
            Workspace{" "}
            <span className="breadcrumb">
              / {navigation.find((n) => n.href === pathname)?.label ?? "Studio"}
            </span>
          </span>
          <Link href="/device" className="connection-pill">
            <span
              className={
                status === "connected" ? "status-dot online" : "status-dot"
              }
            />
            {status === "connected"
              ? mode === "mock"
                ? "Mock connected"
                : "Serial connected"
              : "Device disconnected"}
          </Link>
        </header>
        <main>{children}</main>
        <footer className="page-footer">
          <span>Made for tiny possibilities.</span>
          <span>
            Independent community project · Preview tools ≠ device compatibility
          </span>
        </footer>
      </div>
    </div>
  );
}
