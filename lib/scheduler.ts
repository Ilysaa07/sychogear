import { prisma } from "./prisma";
import { paymentService } from "@/services/payment.service";

/**
 * Scheduler helper to handle recurring tasks like order expiration.
 * In a traditional Node.js environment, this could be used with node-cron.
 * In a Vercel environment, this logic should be hit via a Cron Job endpoint.
 */
export const orderScheduler = {
  async processExpiredOrders() {
    console.log("[Scheduler] Checking for expired orders...");
    
    try {
      const now = new Date();
      
      const expiredOrders = await prisma.order.findMany({
        where: {
          status: "UNPAID",
          expiredAt: { lte: now },
        },
        select: { invoiceNumber: true },
      });

      console.log(`[Scheduler] Found ${expiredOrders.length} expired orders.`);

      for (const order of expiredOrders) {
        try {
          await paymentService.expireOrder(order.invoiceNumber);
          console.log(`[Scheduler] Succesfully expired ${order.invoiceNumber}`);
        } catch (err) {
          console.error(`[Scheduler] Failed to expire ${order.invoiceNumber}:`, err);
        }
      }
      
      return expiredOrders.length;
    } catch (error) {
      console.error("[Scheduler] Error processing expired orders:", error);
      throw error;
    }
  }
};
