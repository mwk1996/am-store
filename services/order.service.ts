import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// Full order service with buyer/seller relations implemented in Phase 3
// Phase 2: guest order model only (no buyerId/sellerId on Order)
export const orderService = {
  async listForUser(_userId: string, _role: "buyer" | "seller", _page = 1, _limit = 20) {
    return { items: [], total: 0, page: 1, limit: 20 };
  },

  async getById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: { select: { id: true, title: true, imageUrl: true, deliveryType: true } },
        productKey: { select: { id: true } }, // keyValue never exposed (SEC-03)
      },
    });
  },

  async getByIdForUser(orderId: string, _userId: string) {
    // Guest order model — no userId ownership check until Phase 3
    return orderService.getById(orderId);
  },

  async updateStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({ where: { id: orderId }, data: { status } });
  },
};
