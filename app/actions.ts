"use server";

import { destroySession, getAuthUser, isAdmin } from "./lib/auth";
import { redirect } from "next/navigation";
import { parseWithZod } from "@conform-to/zod";
import { bannerSchema, productSchema } from "./lib/zodSchemas";
import { getCollection } from "./lib/db";
import { revalidatePath } from "next/cache";
import { stripe } from "./lib/stripe";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import type { BannerDoc, Cart, ProductDoc } from "./lib/interfaces";

export async function createProduct(prevState: unknown, formData: FormData) {
  const user = await getAuthUser();

  if (!isAdmin(user)) {
    return redirect("/");
  }

  const submission = parseWithZod(formData, {
    schema: productSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const flattenUrls = submission.value.images.flatMap((urlString) =>
    urlString.split(",").map((url) => url.trim())
  );

  const productsCollection = await getCollection<ProductDoc>("products");
  await productsCollection.insertOne({
    _id: randomUUID(),
    name: submission.value.name,
    description: submission.value.description,
    status: submission.value.status,
    price: submission.value.price,
    images: flattenUrls,
    category: submission.value.category,
    isFeatured: submission.value.isFeatured === true ? true : false,
    createdAt: new Date(),
  });

  redirect("/dashboard/products");
}

export async function editProduct(prevState: any, formData: FormData) {
  const user = await getAuthUser();

  if (!isAdmin(user)) {
    return redirect("/");
  }

  const submission = parseWithZod(formData, {
    schema: productSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const flattenUrls = submission.value.images.flatMap((urlString) =>
    urlString.split(",").map((url) => url.trim())
  );

  const productId = formData.get("productId") as string;
  const productsCollection = await getCollection<ProductDoc>("products");
  await productsCollection.updateOne(
    { _id: productId },
    {
      $set: {
        name: submission.value.name,
        description: submission.value.description,
        category: submission.value.category,
        price: submission.value.price,
        isFeatured: submission.value.isFeatured === true ? true : false,
        status: submission.value.status,
        images: flattenUrls,
      },
    }
  );

  redirect("/dashboard/products");
}

export async function deleteProduct(formData: FormData) {
  const user = await getAuthUser();

  if (!isAdmin(user)) {
    return redirect("/");
  }

  const productsCollection = await getCollection<ProductDoc>("products");
  await productsCollection.deleteOne({
    _id: formData.get("productId") as string,
  });

  redirect("/dashboard/products");
}

export async function createBanner(prevState: any, formData: FormData) {
  const user = await getAuthUser();

  if (!isAdmin(user)) {
    return redirect("/");
  }

  const submission = parseWithZod(formData, {
    schema: bannerSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const bannersCollection = await getCollection<BannerDoc>("banners");
  await bannersCollection.insertOne({
    _id: randomUUID(),
    title: submission.value.title,
    imageString: submission.value.imageString,
    createdAt: new Date(),
  });

  redirect("/dashboard/banner");
}

export async function deleteBanner(formData: FormData) {
  const user = await getAuthUser();

  if (!isAdmin(user)) {
    return redirect("/");
  }

  const bannersCollection = await getCollection<BannerDoc>("banners");
  await bannersCollection.deleteOne({
    _id: formData.get("bannerId") as string,
  });

  redirect("/dashboard/banner");
}

export async function addItem(productId: string) {
  const user = await getAuthUser();

  if (!user) {
    return redirect("/");
  }

  const productsCollection = await getCollection<ProductDoc>("products");
  const selectedProduct = await productsCollection.findOne(
    { _id: productId },
    { projection: { _id: 1, name: 1, price: 1, images: 1 } }
  );

  if (!selectedProduct) {
    throw new Error("No product with this id");
  }
  let myCart = {} as Cart;
  const cartsCollection = await getCollection<Cart>("carts");
  const existingCart = await cartsCollection.findOne({ userId: user.id });

  if (!existingCart || !existingCart.items) {
    myCart = {
      userId: user.id,
      items: [
        {
          price: selectedProduct.price,
          id: selectedProduct._id,
          imageString: selectedProduct.images[0],
          name: selectedProduct.name,
          quantity: 1,
        },
      ],
      updatedAt: new Date(),
    };
  } else {
    let itemFound = false;

    myCart.items = existingCart.items.map((item) => {
      if (item.id === productId) {
        itemFound = true;
        item.quantity += 1;
      }

      return item;
    });

    if (!itemFound) {
      myCart.items.push({
        id: selectedProduct._id,
        imageString: selectedProduct.images[0],
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: 1,
      });
    }
    myCart.userId = user.id;
    myCart.updatedAt = new Date();
  }

  await cartsCollection.updateOne(
    { userId: user.id },
    {
      $set: myCart,
    },
    { upsert: true }
  );

  revalidatePath("/", "layout");
}

export async function delItem(formData: FormData) {
  const user = await getAuthUser();

  if (!user) {
    return redirect("/");
  }

  const productId = formData.get("productId");

  const cartsCollection = await getCollection<Cart>("carts");
  const cart = await cartsCollection.findOne({ userId: user.id });

  if (cart && cart.items) {
    const updateCart: Cart = {
      userId: user.id,
      items: cart.items.filter((item) => item.id !== productId),
      updatedAt: new Date(),
    };

    await cartsCollection.updateOne(
      { userId: user.id },
      { $set: updateCart },
      { upsert: true }
    );
  }

  revalidatePath("/bag");
}

export async function checkOut() {
  const user = await getAuthUser();

  if (!user) {
    return redirect("/");
  }

  const cartsCollection = await getCollection<Cart>("carts");
  const cart = await cartsCollection.findOne({ userId: user.id });

  if (cart && cart.items) {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.items.map((item) => ({
        price_data: {
          currency: "usd",
          unit_amount: item.price * 100,
          product_data: {
            name: item.name,
            images: [item.imageString],
          },
        },
        quantity: item.quantity,
      }));

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_BASE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      metadata: {
        userId: user.id,
      },
    });
    return redirect(session.url as string);
  }
}

export async function logout() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
