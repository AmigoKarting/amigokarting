"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const router = useRouter();
  const { employee, isLoading, setEmployee, setLoading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    async function loadEmployee() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setEmployee(null); return; }

      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      setEmployee(data);
    }

    loadEmployee();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadEmployee();
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setEmployee(null);
    router.push("/login");
  };

  return { employee, isLoading, logout };
}
