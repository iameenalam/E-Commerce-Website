import { ProductCard } from "@/app/components/storefront/ProductCard";
import { getCollection } from "@/app/lib/db";
import type { ProductDoc } from "@/app/lib/interfaces";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

type ProductSummary = {
  id: string;
  name: string;
  images: string[];
  price: number;
  description: string;
};

async function fetchProducts(filter: Partial<ProductDoc>): Promise<ProductSummary[]> {
  const productsCollection = await getCollection<ProductDoc>("products");
  const products = await productsCollection
    .find(
      filter,
      {
        sort: { createdAt: -1 },
        projection: {
          _id: 1,
          name: 1,
          images: 1,
          price: 1,
          description: 1,
        },
      }
    )
    .toArray();

  return products.map((product) => ({
    id: product._id,
    name: product.name,
    images: product.images,
    price: product.price,
    description: product.description,
  }));
}

async function getData(productCategory: string) {
  const baseFilter = { status: "published" as const };

  switch (productCategory) {
    case "all": {
      const data = await fetchProducts(baseFilter);
      return {
        title: "All Products",
        data,
      };
    }
    case "men": {
      const data = await fetchProducts({ ...baseFilter, category: "men" });
      return {
        title: "Products for Men",
        data,
      };
    }
    case "women": {
      const data = await fetchProducts({ ...baseFilter, category: "women" });
      return {
        title: "Products for Women",
        data,
      };
    }
    case "kids": {
      const data = await fetchProducts({ ...baseFilter, category: "kids" });
      return {
        title: "Products for Kids",
        data,
      };
    }
    default: {
      return notFound();
    }
  }
}

export default async function CategoriesPage({
  params,
}: {
  params: { name: string };
}) {
  noStore();
  const result = await getData(params.name);
  const data = Array.isArray(result?.data) ? result.data : [];
  const title = result?.title ?? "";
  return (
    <section>
      <h1 className="font-semibold text-3xl my-5">{title}</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.map((item) => (
          <ProductCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
