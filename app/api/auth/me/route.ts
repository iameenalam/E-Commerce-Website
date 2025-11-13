export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import { getAuthUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ user: null }, { status: 200 });
    return NextResponse.json({ user }, { status: 200 });
  } catch (e) {
    console.error("Me error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

