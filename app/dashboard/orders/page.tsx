import { getCollection } from "@/app/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { unstable_noStore as noStore } from "next/cache";
import type { OrderDoc, UserDoc } from "@/app/lib/interfaces";

async function getData() {
  const ordersCollection = await getCollection<OrderDoc>("orders");
  const orders = await ordersCollection
    .find({}, { sort: { createdAt: -1 } })
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
            { projection: { _id: 1, firstName: 1, email: 1, profileImage: 1 } }
          )
          .toArray()
      : [];
  const userMap = new Map(users.map((user) => [user._id, user]));

  return orders.map((order) => ({
    id: order._id,
    amount: order.amount,
    status: order.status,
    createdAt: order.createdAt,
    User: order.userId ? userMap.get(order.userId) ?? null : null,
  }));
}

export default async function OrdersPage() {
  noStore();
  const data = await getData();
  return (
    <Card>
      <CardHeader className="px-7">
        <CardTitle>Orders</CardTitle>
        <CardDescription>Recent orders from your store!</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-medium">{item.User?.firstName}</p>
                  <p className="hidden md:flex text-sm text-muted-foreground">
                    {item.User?.email}
                  </p>
                </TableCell>
                <TableCell>Order</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  {item.createdAt
                    ? new Intl.DateTimeFormat("en-US").format(item.createdAt)
                    : "Unknown"}
                </TableCell>
                <TableCell className="text-right">
                  ${new Intl.NumberFormat("en-US").format(item.amount / 100)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}