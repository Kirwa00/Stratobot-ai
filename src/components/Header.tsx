"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthState, type AuthState } from "@/lib/auth";

const LOGGED_OUT: AuthState = { user: null, isAuthenticated: false, isLoading: false };

export function Header({
  title,
  back,
  onSettings,
  showUserMenu = false,
}: {
  title?: string;
  back?: boolean;
  onSettings?: () => void;
  showUserMenu?: boolean;
}) {
  const router = useRouter();
  // Reading localStorage during render would mismatch the server-rendered
  // (window-less) markup, so start logged-out and pick up the real state
  // client-side only, same pattern as the speech-recognition feature
  // detection on the home page.
  const [authState, setAuthState] = useState<AuthState>(LOGGED_OUT);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthState(getAuthState());
  }, []);

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-outline shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {back ? (
          <button
            aria-label="Back"
            onClick={() => router.back()}
            className="material-symbols-outlined -ml-1 p-1 rounded-md hover:bg-slate-high"
          >
            arrow_back
          </button>
        ) : (
          <Link href="/app" className="font-display font-bold tracking-tight text-lg text-chalk">
            StratoBot
          </Link>
        )}
        {title && back && (
          // Nav-bar label, not the page's heading — each page renders its
          // own <h1> for its actual content further down.
          <p className="font-medium text-[15px] truncate text-chalk">{title}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {showUserMenu && authState.isAuthenticated && authState.user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-chalk/50 hidden sm:block">
              {authState.user.name}
            </span>
            <div className="w-8 h-8 rounded-full bg-signal flex items-center justify-center text-white text-xs font-medium">
              {authState.user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {!back && (
          <Link
            href="/feedback"
            aria-label="Send feedback"
            title="Send feedback"
            className="material-symbols-outlined p-1 rounded-md hover:bg-slate-high text-chalk/70"
          >
            chat_bubble
          </Link>
        )}

        {/* Account entry point on top-level pages only — this is the one
            place in the app that actually links to /login and /admin;
            without it both pages were reachable only by typing the URL. */}
        {!back &&
          (authState.isAuthenticated && authState.user?.isAdmin ? (
            <Link
              href="/admin"
              aria-label="Admin dashboard"
              title={authState.user.email}
              className="material-symbols-outlined p-1 rounded-md hover:bg-slate-high text-chalk/70"
            >
              admin_panel_settings
            </Link>
          ) : !authState.isAuthenticated ? (
            <Link
              href="/login"
              aria-label="Sign in"
              className="material-symbols-outlined p-1 rounded-md hover:bg-slate-high text-chalk/70"
            >
              person
            </Link>
          ) : null)}

        {onSettings ? (
          <button
            aria-label="Settings"
            onClick={onSettings}
            className="material-symbols-outlined p-1 rounded-md hover:bg-slate-high"
          >
            settings
          </button>
        ) : (
          !showUserMenu && <span className="w-7" />
        )}
      </div>
    </header>
  );
}
