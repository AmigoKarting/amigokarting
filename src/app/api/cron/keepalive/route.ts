import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { count } = await supabaseAdmin
      .from("employees")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      status: "alive",
      employees: count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}