import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardStats } from "../components/dashboard/DashboardStats";
import { RecentSales } from "../components/dashboard/RecentSales";
import { Chart } from "../components/dashboard/Chart";
import { getCollection } from "../lib/db";
import { unstable_noStore as noStore } from "next/cache";
import type { OrderDoc } from "../lib/interfaces";

async function getData() {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const ordersCollection = await getCollection<OrderDoc>("orders");
  const data = await ordersCollection
    .find(
      { createdAt: { $gte: sevenDaysAgo } },
      {
        sort: { createdAt: 1 },
        projection: { amount: 1, createdAt: 1 },
      }
    )
    .toArray();

  return data.map((item) => ({
    date: item.createdAt
      ? new Intl.DateTimeFormat("en-US").format(item.createdAt)
      : "",
    revenue: item.amount / 100,
  }));
}

export default async function Dashboard() {
  noStore();
  const data = await getData();
  return (
    <>
      <DashboardStats />

      <div className="grid gap-4 md:gp-8 lg:grid-cols-2 xl:grid-cols-3 mt-10">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Recent transactions from the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart data={data} />
          </CardContent>
        </Card>

        <RecentSales />
      </div>
    </>
  );
}