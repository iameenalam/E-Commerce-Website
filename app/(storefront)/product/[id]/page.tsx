import { addItem } from "@/app/actions";
import { ShoppingBagButton } from "@/app/components/SubmitButtons";
import { FeaturedProducts } from "@/app/components/storefront/FeaturedProducts";
import { ImageSlider } from "@/app/components/storefront/ImageSlider";
import { getCollection } from "@/app/lib/db";

import { StarIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import type { ProductDoc } from "@/app/lib/interfaces";

async function getData(productId: string) {
  const productsCollection = await getCollection<ProductDoc>("products");
  const product = await productsCollection.findOne(
    { _id: productId },
    {
      projection: {
        _id: 1,
        price: 1,
        images: 1,
        description: 1,
        name: 1,
      },
    }
  );

  if (!product) {
    return notFound();
  }

  return {
    id: product._id,
    price: product.price,
    images: product.images,
    description: product.description,
    name: product.name,
  };
}

export default async function ProductIdRoute({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  const data = await getData(params.id);
  const addProducttoShoppingCart = addItem.bind(null, data.id);
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start lg:gap-x-24 py-6">
        <ImageSlider images={data.images} />
        <div className="flex flex-col justify-start">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
            {data.name}
          </h1>
          <p className="text-2xl mt-2 text-gray-900">${data.price}</p>
          <div className="mt-3 flex items-center gap-1">
            <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-sm md:text-base text-gray-700 mt-4">{data.description}</p>

          <form action={addProducttoShoppingCart} className="mt-4">
            <ShoppingBagButton />
          </form>
        </div>
      </div>

      <div className="mt-8 md:mt-16">
        <FeaturedProducts />
      </div>
    </>
  );
}
