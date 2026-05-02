import { prisma } from "@/lib/prisma";
import { ProductStatus, DeliveryType, Prisma } from "@prisma/client";

export interface ProductFilters {
  q?: string;
  category?: string;
  platform?: string;
  deliveryType?: DeliveryType;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  page?: number;
  limit?: number;
}

function buildBaseWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const { q, category, platform, deliveryType, minPrice, maxPrice, sellerId } = filters;
  return {
    status: ProductStatus.ACTIVE,
    ...(sellerId && { sellerId }),
    ...(category && { category: { slug: category } }),
    ...(platform && { platform }),
    ...(deliveryType && { deliveryType }),
    ...(q && { title: { path: ["en"], string_contains: q } }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
  };
}

const productInclude = {
  category: true,
  seller: { select: { id: true, name: true, avatar: true } },
  _count: {
    select: {
      keys: { where: { isUsed: false } },
    },
  },
} as const;

function withAvailableKeys<T extends { _count: { keys: number } }>(p: T) {
  return { ...p, availableKeys: p._count.keys };
}

export const productService = {
  async list(filters: ProductFilters) {
    const { page = 1, limit = 12 } = filters;
    const where: Prisma.ProductWhereInput = {
      ...buildBaseWhere(filters),
      isFeatured: false,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: productInclude,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(withAvailableKeys),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async featuredList(filters: Omit<ProductFilters, "page" | "limit" | "isFeatured">) {
    const where: Prisma.ProductWhereInput = {
      ...buildBaseWhere(filters),
      isFeatured: true,
    };
    const featured = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: productInclude,
    });
    return featured.map(withAvailableKeys);
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) return null;
    return withAvailableKeys(product);
  },

  async create(data: {
    title: Prisma.InputJsonValue;
    description: Prisma.InputJsonValue;
    price: number;
    imageUrl?: string;
    categoryId?: string;
    sellerId: string;
    platform?: string;
    deliveryType: DeliveryType;
  }) {
    return prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        sellerId: data.sellerId,
        platform: data.platform,
        deliveryType: data.deliveryType,
        status: ProductStatus.ACTIVE,
      },
    });
  },

  async update(
    id: string,
    sellerId: string,
    data: Partial<{
      title: Prisma.InputJsonValue;
      description: Prisma.InputJsonValue;
      price: number;
      imageUrl: string | null;
      categoryId: string | null;
      platform: string | null;
      deliveryType: DeliveryType;
      status: ProductStatus;
    }>
  ) {
    return prisma.product.updateMany({
      where: { id, sellerId },
      data: data as Prisma.ProductUpdateManyMutationInput,
    });
  },

  async softDelete(id: string, sellerId: string) {
    return prisma.product.updateMany({
      where: { id, sellerId },
      data: { status: ProductStatus.INACTIVE },
    });
  },
};
