import { NextResponse } from "next/server";
import { getPublicKey } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = await getPublicKey();
  return NextResponse.json({ key });
}
