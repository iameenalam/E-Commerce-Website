import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { getAuthUser } from "@/app/lib/auth";
import { ShoppingBagIcon } from "lucide-react";
import { UserDropdown } from "./UserDropdown";
import { Button } from "@/components/ui/button";

import { Cart } from "@/app/lib/interfaces";
import { getCollection } from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";

export async function Navbar() {
  noStore();
  const user = await getAuthUser();

  let cart: Cart | null = null;
  if (user) {
    const cartsCollection = await getCollection<Cart>("carts");
    cart = await cartsCollection.findOne({ userId: user.id });
  }
  const total = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <nav className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
      {/* Left - Logo */}
      <div className="flex items-center z-10">
        <Link href="/">
          <img
            src="/logo.png"
            alt="Solezaar Logo"
            className="h-8 w-auto lg:h-10 mt-[-8px]"
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
              email={user.email}
              name={`${user.firstName} ${user.lastName}`.trim()}
            />
          </>
        ) : (
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login" className="cursor-pointer">
                Sign in
              </Link>
            </Button>
            <span className="h-5 w-px bg-gray-200 md:h-6" />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/signup" className="cursor-pointer">
                Create Account
              </Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
