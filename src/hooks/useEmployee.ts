"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Employee } from "@/types/employee";

export function useEmployee(employeeId: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();
      setEmployee(data);
      setLoading(false);
    }
    if (employeeId) load();
  }, [employeeId]);

  async function updateEmployee(updates: Partial<Employee>) {
    const { data, error } = await supabase
      .from("employees")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", employeeId)
      .select()
      .single();
    if (data) setEmployee(data);
    return { data, error };
  }

  return { employee, loading, updateEmployee };
}
