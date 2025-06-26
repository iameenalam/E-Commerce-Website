import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ShoppingBagIcon } from "lucide-react";
import { UserDropdown } from "./UserDropdown";
import { Button } from "@/components/ui/button";
import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { Cart } from "@/app/lib/interfaces";
import { redis } from "@/app/lib/redis";

export async function Navbar() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const cart: Cart | null = await redis.get(`cart-${user?.id}`);
  const total = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <nav className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
      {/* Left - Logo */}
      <div className="flex items-center z-10">
        <Link href="/">
          <img
            src="/logo.png"
            alt="Solezaar Logo"
            className="h-10 w-auto lg:h-14"
          />
        </Link>
      </div>

      {/* Center - Navbar Links */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <NavbarLinks />
      </div>

      {/* Right - Cart and User/Auth */}
      <div className="flex items-center z-10">
        {user ? (
          <>
            <Link href="/bag" className="group p-2 flex items-center mr-2">
              <ShoppingBagIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-500 sm:h-6 sm:w-6" />
              <span className="ml-2 text-xs font-medium text-gray-700 group-hover:text-gray-800 sm:text-sm">
                {total}
              </span>
            </Link>

            <UserDropdown
              email={user.email as string}
              name={user.given_name as string}
              userImage={
                user.picture ?? `https://avatar.vercel.sh/${user.given_name}`
              }
            />
          </>
        ) : (
          <div className="flex items-center md:space-x-2">
            <Button variant="ghost" asChild>
              <LoginLink>Sign in</LoginLink>
            </Button>
            <span className="hidden md:block h-6 w-px bg-gray-200"></span>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <RegisterLink>Create Account</RegisterLink>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
