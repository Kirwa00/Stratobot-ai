"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthState } from "@/lib/auth";

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
  const authState = getAuthState();

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
          <Link href="/" className="font-display font-bold tracking-tight text-lg text-chalk">
            StratoBot
          </Link>
        )}
        {title && back && (
          <h1 className="font-medium text-[15px] truncate text-chalk">{title}</h1>
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
