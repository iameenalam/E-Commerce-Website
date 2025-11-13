import { getCollection } from "@/app/lib/db";
import { LoadingProductCard, ProductCard } from "./ProductCard";
import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import type { ProductDoc } from "@/app/lib/interfaces";

async function getData() {
  const productsCollection = await getCollection<ProductDoc>("products");
  const data = await productsCollection
    .find(
      { status: "published", isFeatured: true },
      {
        sort: { createdAt: -1 },
        projection: {
          _id: 1,
          name: 1,
          description: 1,
          images: 1,
          price: 1,
        },
        limit: 3,
      }
    )
    .toArray();

  return data.map((product) => ({
    id: product._id,
    name: product.name,
    description: product.description,
    images: product.images,
    price: product.price,
  }));
}

export function FeaturedProducts() {
  return (
    <>
      <h2 className="text-2xl font-extrabold tracking-tight">Featured Items</h2>
      <Suspense fallback={<LoadingRows />}>
        <LoadFeaturedproducts />
      </Suspense>
    </>
  );
}

async function LoadFeaturedproducts() {
  noStore();
  const data = await getData();

  return (
    <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {data.map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <LoadingProductCard />
      <LoadingProductCard />
      <LoadingProductCard />
    </div>
  );
}