import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

export const orderService = {
  async listForUser(userId: string, role: "buyer" | "seller", page = 1, limit = 20) {
    const where: Prisma.OrderWhereInput = role === "buyer" ? { buyerId: userId } : { sellerId: userId };
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: { id: true, title: true, imageUrl: true, deliveryType: true },
          },
          productKey: { select: { id: true } }, // D-16: never expose keyValue
        },
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total, page, limit };
  },

  async getById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: { select: { id: true, title: true, imageUrl: true, deliveryType: true } },
        productKey: { select: { id: true } },
      },
    });
  },

  async getByIdForUser(orderId: string, userId: string) {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        product: {
          select: { id: true, title: true, imageUrl: true, deliveryType: true, sellerId: true },
        },
        productKey: { select: { id: true } }, // keyValue excluded — use /key endpoint (D-16)
      },
    });
  },

  async updateStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({ where: { id: orderId }, data: { status } });
  },
};
