"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Client layout chrome for the Discord shell. On desktop (md+) the sidebar and member
 * list are static columns; on mobile they become off-canvas drawers toggled by the
 * mobile top bar, with a backdrop. The always-visible server rail is passed in as `rail`.
 */
export function ShellChrome({
  rail,
  sidebar,
  right,
  children,
}: {
  rail: React.ReactNode;
  sidebar?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  // Reset drawers when the route changes — the render-time reset pattern
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setLeftOpen(false);
    setRightOpen(false);
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-bg text-foreground">
      {rail}

      {/* Left contextual sidebar: static on desktop, drawer on mobile */}
      {sidebar && (
        <aside
          className={`fixed inset-y-0 left-[72px] z-40 w-60 transform flex-col bg-surface transition-transform duration-200 md:static md:z-auto md:flex md:translate-x-0 ${
            leftOpen ? "flex translate-x-0" : "-translate-x-[110%]"
          }`}
        >
          {sidebar}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with drawer toggles */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-line bg-panel px-3 md:hidden">
          {sidebar ? (
            <button
              aria-label="Open channels"
              onClick={() => setLeftOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-hover hover:text-bright"
            >
              ☰
            </button>
          ) : (
            <span className="w-8" />
          )}
          <span className="text-sm font-bold text-bright">🌙 Nightfall</span>
          {right ? (
            <button
              aria-label="Open members"
              onClick={() => setRightOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-hover hover:text-bright"
            >
              👥
            </button>
          ) : (
            <span className="w-8" />
          )}
        </div>

        <main className="flex min-h-0 flex-1 flex-col bg-panel">{children}</main>
      </div>

      {/* Right member list: static on desktop, drawer on mobile */}
      {right && (
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-56 transform flex-col bg-surface transition-transform duration-200 lg:static lg:z-auto lg:flex lg:translate-x-0 ${
            rightOpen ? "flex translate-x-0" : "translate-x-[110%] lg:translate-x-0"
          }`}
        >
          {right}
        </aside>
      )}

      {/* Backdrop for mobile drawers */}
      {(leftOpen || rightOpen) && (
        <button
          aria-label="Close menu"
          onClick={() => {
            setLeftOpen(false);
            setRightOpen(false);
          }}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
    </div>
  );
}
