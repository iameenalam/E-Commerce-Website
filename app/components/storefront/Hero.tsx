
import { getCollection } from "@/app/lib/db";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import type { BannerDoc } from "@/app/lib/interfaces";

async function getData() {
  const bannersCollection = await getCollection<BannerDoc>("banners");
  const data = await bannersCollection
    .find({}, { sort: { createdAt: -1 } })
    .toArray();
  return data.map((banner) => ({
    id: banner._id,
    imageString: banner.imageString,
  }));
}

export async function Hero() {
  const data = await getData();

  return (
    <Carousel>
      <CarouselContent>
        {data.map((item) => (
          <CarouselItem key={item.id}>
            <div className="relative h-[60vh] lg:h-[80vh]">
              <Image
                alt="Banner Image"
                src={item.imageString}
                fill
                className="object-cover w-full h-full rounded-xl"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="ml-16" />
      <CarouselNext className="mr-16" />
    </Carousel>
  );
}
