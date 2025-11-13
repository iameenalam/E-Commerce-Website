export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import { getCollection } from "@/app/lib/db";
import { createSession, verifyPassword, ensureAdminUser, getAdminEmail, getAdminPassword } from "@/app/lib/auth";
import type { UserDoc } from "@/app/lib/interfaces";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Admin login via env
    const adminEmail = getAdminEmail();
    const adminPassword = getAdminPassword();
    if (email === adminEmail && adminPassword) {
      if (password !== adminPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      const adminUser = await ensureAdminUser();
      await createSession(adminUser.id);
      return NextResponse.json({ user: adminUser }, { status: 200 });
    }

    // Normal user login
    try {
      const usersCollection = await getCollection<UserDoc>("users");
      const user = await usersCollection.findOne(
        { email },
        {
          projection: {
            _id: 1,
            email: 1,
            firstName: 1,
            lastName: 1,
            profileImage: 1,
            passwordSalt: 1,
            passwordHash: 1,
          },
        }
      );

      if (!user || !user.passwordSalt || !user.passwordHash) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
      if (!ok) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const userId = user._id;
      await createSession(userId);
      const sanitized = {
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
      };
      return NextResponse.json({ user: sanitized }, { status: 200 });
    } catch (err: any) {
      throw err;
    }
  } catch (e) {
    console.error("Login error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

