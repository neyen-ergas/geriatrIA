"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <Button variant="ghost" onClick={logout} className="h-9 px-3 text-sm">
      Salir
    </Button>
  );
}
