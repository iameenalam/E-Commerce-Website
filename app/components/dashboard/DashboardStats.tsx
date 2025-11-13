import { getCollection } from "@/app/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, PartyPopper, ShoppingBag, User2 } from "lucide-react";
import type { OrderDoc, ProductDoc, UserDoc } from "@/app/lib/interfaces";
import { unstable_noStore as noStore } from "next/cache";

async function getData() {
  const [usersCollection, productsCollection, ordersCollection] =
    await Promise.all([
      getCollection<UserDoc>("users"),
      getCollection<ProductDoc>("products"),
      getCollection<OrderDoc>("orders"),
    ]);

  const [userCount, productCount, orderStats] = await Promise.all([
    usersCollection.countDocuments(),
    productsCollection.countDocuments(),
    ordersCollection
      .aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalOrders: { $sum: 1 },
          },
        },
      ])
      .toArray(),
  ]);

  const totals = orderStats[0] ?? { totalAmount: 0, totalOrders: 0 };

  return {
    userCount,
    productCount,
    totalAmount: totals.totalAmount,
    orderCount: totals.totalOrders,
  };
}

export async function DashboardStats() {
  noStore();
  const { userCount, productCount, orderCount, totalAmount } = await getData();
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${new Intl.NumberFormat("en-US").format(totalAmount / 100)}
          </p>
          <p className="text-xs text-muted-foreground">Gross sales to date</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Total Sales</CardTitle>
          <ShoppingBag className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">+{orderCount}</p>
          <p className="text-xs text-muted-foreground">
            Total Sales on Solezaar
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Total Products</CardTitle>
          <PartyPopper className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{productCount}</p>
          <p className="text-xs text-muted-foreground">
            Total Products created
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Total Users</CardTitle>
          <User2 className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{userCount}</p>
          <p className="text-xs text-muted-foreground">Total Users Signed Up</p>
        </CardContent>
      </Card>
    </div>
  );
}
