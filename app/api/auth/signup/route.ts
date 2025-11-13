export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import { getCollection } from "@/app/lib/db";
import { createSession, hashPassword, getAdminEmail } from "@/app/lib/auth";
import type { UserDoc } from "@/app/lib/interfaces";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName = "", lastName = "" } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Reserve admin email; admin must login using env password
    const adminEmail = getAdminEmail();
    if (email === adminEmail) {
      return NextResponse.json({ error: "This email is reserved for the admin." }, { status: 400 });
    }

    const usersCollection = await getCollection<UserDoc>("users");

    const existing = await usersCollection.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const { salt, hash } = await hashPassword(password);

    try {
      const newUser: UserDoc = {
        _id: randomUUID(),
        email,
        firstName,
        lastName,
        profileImage: `https://avatar.vercel.sh/${encodeURIComponent(firstName || email)}`,
        passwordSalt: salt,
        passwordHash: hash,
        createdAt: new Date(),
      };
      await usersCollection.insertOne(newUser);

      const userResponse = {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        profileImage: newUser.profileImage,
      };

      await createSession(newUser._id);
      return NextResponse.json({ user: userResponse }, { status: 201 });
    } catch (err: any) {
      const msg = String(err?.message || err);
      throw err;
    }

  } catch (e) {
    console.error("Signup error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

