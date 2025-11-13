import { EditForm } from "@/app/components/dashboard/EditForm";
import { getCollection } from "@/app/lib/db";
import type { ProductDoc } from "@/app/lib/interfaces";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

async function getData(productId: string) {
  const productsCollection = await getCollection<ProductDoc>("products");
  const product = await productsCollection.findOne({ _id: productId });

  if (!product) {
    return notFound();
  }

  return {
    id: product._id,
    name: product.name,
    description: product.description,
    status: product.status,
    price: product.price,
    images: product.images,
    category: product.category,
    isFeatured: product.isFeatured,
  };
}

export default async function EditRoute({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  const data = await getData(params.id);
  return <EditForm data={data} />;
}
