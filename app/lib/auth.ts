import { cookies } from "next/headers";
import { randomBytes, randomUUID, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getCollection } from "@/app/lib/db";
import type { Cart, SessionDoc, UserDoc } from "@/app/lib/interfaces";

const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>;

const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: string;
};

const authProjection = {
  _id: 1,
  email: 1,
  firstName: 1,
  lastName: 1,
  profileImage: 1,
} as const;

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "";
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export function isAdmin(user: { email: string } | null | undefined): boolean {
  const adminEmail = getAdminEmail();
  return !!user && user.email === adminEmail;
}

async function users() {
  return getCollection<UserDoc>("users");
}

async function sessions() {
  return getCollection<SessionDoc>("sessions");
}

async function carts() {
  return getCollection<Cart>("carts");
}

export async function ensureAdminUser(): Promise<AuthUser> {
  const adminEmail = getAdminEmail();
  const collection = await users();
  const existing = await collection.findOne({ email: adminEmail }, { projection: authProjection });
  if (existing) {
    return {
      id: existing._id,
      email: existing.email,
      firstName: existing.firstName,
      lastName: existing.lastName,
      profileImage: existing.profileImage,
    };
  }
  const adminUser: UserDoc = {
    _id: randomUUID(),
    email: adminEmail,
    firstName: "Admin",
    lastName: "",
    profileImage: `https://avatar.vercel.sh/${encodeURIComponent(adminEmail)}`,
    createdAt: new Date(),
  };
  await collection.insertOne(adminUser);
  return {
    id: adminUser._id,
    email: adminUser.email,
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
    profileImage: adminUser.profileImage,
  };
}

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return { salt, hash: derivedKey.toString("hex") };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const derivedKey = await scrypt(password, salt, 64);
  const dk = Buffer.from(derivedKey.toString("hex"), "hex");
  const eh = Buffer.from(expectedHash, "hex");
  if (dk.length !== eh.length) return false;
  return timingSafeEqual(dk, eh);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const collection = await sessions();
  await collection.updateOne(
    { token },
    { $set: { token, userId, expiresAt } },
    { upsert: true }
  );
  const cookieStore = cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return token;
}

export async function destroySession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const collection = await sessions();
    await collection.deleteOne({ token });
  }
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const collection = await sessions();
  const session = await collection.findOne({ token });
  if (!session) return null;
  if (session.expiresAt && session.expiresAt < new Date()) {
    await collection.deleteOne({ token });
    return null;
  }
  const userCollection = await users();
  const user = await userCollection.findOne(
    { _id: session.userId },
    { projection: authProjection }
  );
  if (!user) return null;
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: user.profileImage,
  };
}

export async function clearCartForUser(userId: string) {
  const collection = await carts();
  await collection.deleteOne({ userId });
}
