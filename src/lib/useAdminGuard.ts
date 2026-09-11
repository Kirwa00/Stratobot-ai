"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthState, type User } from "./auth";

/** Gates a client page to signed-in accounts with isAdmin set. Real (if
 *  simple) client-side access control — replaces the old admin page's
 *  claim of being "restricted to authorized administrators" with an
 *  actual check, instead of that text being pure decoration. */
export function useAdminGuard(): { checked: boolean; allowed: boolean; user: User | null } {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuthState();
    if (auth.isAuthenticated && auth.user?.isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(auth.user);
      setAllowed(true);
    } else {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { checked, allowed, user };
}
