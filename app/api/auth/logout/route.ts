export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import { destroySession } from "@/app/lib/auth";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("Logout error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

