import { Hono } from "hono";
import {
  CustomerNotFoundError,
  OrderNotFoundError,
  type OrderService,
  OrderValidationError,
} from "../../../application/orders";
import type { Logger } from "../../../application/ports";
import { CannotCancelShippedOrderError, InvalidOrderError } from "../../../domain/orders";
export function createOrderRoutes(orderService: OrderService, logger: Logger): Hono {
  const app = new Hono();

  app.post("/orders", async (ctx) => {
    try {
      const body = await ctx.req.json();
      const orderResponse = await orderService.placeOrder(body);

      return ctx.json(orderResponse, 201);
    } catch (error) {
      if (error instanceof OrderValidationError || error instanceof InvalidOrderError) {
        return ctx.json({ error: error.message }, 400);
      }

      if (error instanceof CustomerNotFoundError) {
        return ctx.json({ error: error.message }, 400);
      }

      logger.error("Error placing order", error);
      return ctx.json({ error: "Internal server error" }, 500);
    }
  });

  app.post("/orders/:id/cancel", async (ctx) => {
    try {
      const orderId = ctx.req.param("id");
      const orderResponse = await orderService.cancelOrder({ orderId });

      return ctx.json(orderResponse);
    } catch (error) {
      if (error instanceof OrderValidationError) {
        return ctx.json({ error: error.message }, 400);
      }

      if (error instanceof OrderNotFoundError) {
        return ctx.json({ error: error.message }, 404);
      }

      if (error instanceof CannotCancelShippedOrderError) {
        return ctx.json({ error: error.message }, 409);
      }

      logger.error("Error cancelling order", error);
      return ctx.json({ error: "Internal server error" }, 500);
    }
  });

  app.get("/orders/:id", async (ctx) => {
    try {
      const orderId = ctx.req.param("id");
      const orderResponse = await orderService.getOrderById(orderId);

      if (!orderResponse) {
        return ctx.json({ error: `Order ${orderId} not found` }, 404);
      }

      return ctx.json(orderResponse);
    } catch (error) {
      if (error instanceof OrderValidationError) {
        return ctx.json({ error: error.message }, 400);
      }

      logger.error("Error fetching order", error);
      return ctx.json({ error: "Internal server error" }, 500);
    }
  });

  return app;
}
