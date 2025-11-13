import { getCollection } from "@/app/lib/db";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderDoc, UserDoc } from "@/app/lib/interfaces";
import { unstable_noStore as noStore } from "next/cache";

async function getData() {
  const ordersCollection = await getCollection<OrderDoc>("orders");
  const orders = await ordersCollection
    .find({}, { sort: { createdAt: -1 }, limit: 7 })
    .toArray();

  const userIds = orders
    .map((order) => order.userId)
    .filter((id): id is string => !!id);

  const usersCollection = await getCollection<UserDoc>("users");
  const users =
    userIds.length > 0
      ? await usersCollection
          .find(
            { _id: { $in: Array.from(new Set(userIds)) } },
            { projection: { _id: 1, firstName: 1, profileImage: 1, email: 1 } }
          )
          .toArray()
      : [];

  const userMap = new Map(users.map((user) => [user._id, user]));

  return orders.map((order) => ({
    id: order._id,
    amount: order.amount,
    user: order.userId ? userMap.get(order.userId) ?? null : null,
  }));
}

export async function RecentSales() {
  noStore();
  const data = await getData();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent sales</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        {data.map((item) => (
          <div className="flex items-center gap-4" key={item.id}>
            <Avatar className="hidden sm:flex h-9 w-9">
              <AvatarFallback>
                {item.user?.firstName?.trim().charAt(0).toUpperCase() ?? "G"}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium">{item.user?.firstName ?? "Guest"}</p>
              <p className="text-sm text-muted-foreground">
                {item.user?.email ?? "N/A"}
              </p>
            </div>
            <p className="ml-auto font-medium">
              +${new Intl.NumberFormat("en-US").format(item.amount / 100)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}