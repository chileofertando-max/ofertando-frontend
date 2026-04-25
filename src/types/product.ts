export interface ProductImage {
  sourceUrl: string;
  altText: string;
}

export interface ProductPrice {
  price: string;
  regularPrice: string;
}

export interface Product {
  id: string;
  databaseId?: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  regularPrice: string;
  image: ProductImage;
  galleryImages: { nodes: ProductImage[] };
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK";
  featured: boolean;
  productCategories: { nodes: { name: string; slug: string }[] };
}

export interface Category {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  image: ProductImage;
  count: number;
  parentId?: number | null;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}
