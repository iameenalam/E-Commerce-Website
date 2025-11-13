import { randomUUID } from "crypto";
import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { getCollection } from "@/app/lib/db";
import type { OrderDoc } from "@/app/lib/interfaces";
import { clearCartForUser } from "@/app/lib/auth";
import { stripe } from "@/app/lib/stripe";

export async function recordCheckoutSession(
  session: Stripe.Checkout.Session
) {
  const ordersCollection = await getCollection<OrderDoc>("orders");
  const now = new Date();

  const result = await ordersCollection.updateOne(
    { stripeSessionId: session.id },
    {
      $setOnInsert: {
        _id: randomUUID(),
        createdAt: now,
        stripeSessionId: session.id,
      },
      $set: {
        amount: session.amount_total ?? 0,
        status: session.payment_status ?? session.status ?? "pending",
        userId: session.metadata?.userId ?? undefined,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  const isNewOrder = result.upsertedCount > 0;

  if (session.metadata?.userId) {
    await clearCartForUser(session.metadata.userId);
    revalidatePath("/bag");
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");

  return isNewOrder;
}

export async function finalizeCheckout(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (
      session.payment_status !== "paid" &&
      session.status !== "complete"
    ) {
      return false;
    }

    await recordCheckoutSession(session);
    return true;
  } catch (error) {
    console.error("Failed to finalize Stripe checkout", error);
    return false;
  }
}

