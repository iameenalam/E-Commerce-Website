export type ProductStatus = "draft" | "published" | "archived";
export type Category = "men" | "women" | "kids";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageString: string;
};

export type Cart = {
  userId: string;
  items: CartItem[];
  updatedAt?: Date;
};

export type UserDoc = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  passwordSalt?: string;
  passwordHash?: string;
  createdAt: Date;
};

export type ProductDoc = {
  _id: string;
  name: string;
  description: string;
  status: ProductStatus;
  price: number;
  images: string[];
  category: Category;
  isFeatured: boolean;
  createdAt: Date;
};

export type BannerDoc = {
  _id: string;
  title: string;
  imageString: string;
  createdAt: Date;
};

export type OrderDoc = {
  _id: string;
  status: string;
  amount: number;
  userId?: string;
  createdAt: Date;
  updatedAt?: Date;
  stripeSessionId?: string;
};

export type SessionDoc = {
  token: string;
  userId: string;
  expiresAt: Date;
};