/* eslint-disable react/no-unescaped-entities */

import { checkOut, delItem } from "@/app/actions";
import { ChceckoutButton, DeleteItem } from "@/app/components/SubmitButtons";
import { Cart } from "@/app/lib/interfaces";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/app/lib/auth";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCollection } from "@/app/lib/db";

export default async function BagRoute() {
  noStore();
  const user = await getAuthUser();

  if (!user) {
    redirect("/");
  }

  const cartsCollection = await getCollection<Cart>("carts");
  const cart = await cartsCollection.findOne({ userId: user.id });

  let totalPrice = 0;

  cart?.items.forEach((item) => {
    totalPrice += item.price * item.quantity;
  });

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <div className="max-w-2xl mx-auto mt-10 min-h-[55vh]">
      {isCartEmpty ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center mt-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>

          <h2 className="mt-6 text-xl font-semibold">
            You don't have any products in your Bag
          </h2>
          <p className="mb-8 mt-2 text-center text-sm leading-6 text-muted-foreground max-w-sm mx-auto">
            You currently don't have any products in your shopping bag. Please
            add some so that you can see them right here.
          </p>

          <Button asChild>
            <Link href="/">Shop Now!</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-y-10">
          {cart?.items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 relative">
                <Image
                  className="rounded-md object-cover"
                  fill
                  src={item.imageString}
                  alt="Product image"
                />
              </div>
              <div className="ml-2 sm:ml-5 flex justify-between w-full font-medium">
                <p className="text-sm sm:text-base">{item.name}</p>
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-center gap-x-2 text-sm sm:text-base">
                    <p>{item.quantity} x</p>
                    <p>${item.price}</p>
                  </div>

                  <form action={delItem} className="text-end">
                    <input type="hidden" name="productId" value={item.id} />
                    <DeleteItem />
                  </form>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-10">
            <div className="flex items-center justify-between font-medium">
              <p className="text-sm sm:text-base">Subtotal:</p>
              <p className="text-sm sm:text-base">${new Intl.NumberFormat("en-US").format(totalPrice)}</p>
            </div>

            <form action={checkOut}>
              <ChceckoutButton />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
