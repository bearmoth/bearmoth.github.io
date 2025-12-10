import { Hono } from "hono";
import { OrderNotFoundError, OrderValidationError, type OrderService } from "../../../application/orders";
import { CannotCancelShippedOrderError, InvalidOrderError } from "../../../domain/orders";

export function createOrderRoutes(orderService: OrderService): Hono {
  const app = new Hono();

  app.post("/orders", async (ctx) => {
    try {
      const body = await ctx.req.json();
      const order = await orderService.placeOrder(body);

      return ctx.json(
        {
          id: order.id.toString(),
          items: order.items.map((item) => item.toJSON()),
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt.toISOString(),
        },
        201,
      );
    } catch (error) {
      if (error instanceof OrderValidationError || error instanceof InvalidOrderError) {
        return ctx.json({ error: error.message }, 400);
      }
      console.error("Error placing order:", error);
      return ctx.json({ error: "Internal server error" }, 500);
    }
  });

  app.post("/orders/:id/cancel", async (ctx) => {
    try {
      const orderId = ctx.req.param("id");
      const order = await orderService.cancelOrder({ orderId });

      return ctx.json({
        id: order.id.toString(),
        items: order.items.map((item) => item.toJSON()),
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
      });
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
      console.error("Error cancelling order:", error);
      return ctx.json({ error: "Internal server error" }, 500);
    }
  });

  app.get("/orders/:id", async (ctx) => {
    try {
      const orderId = ctx.req.param("id");
      const order = await orderService.getOrderById(orderId);

      if (!order) {
        return ctx.json({ error: `Order ${orderId} not found` }, 404);
      }

      return ctx.json({
        id: order.id.toString(),
        items: order.items.map((item) => item.toJSON()),
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof OrderValidationError) {
        return ctx.json({ error: error.message }, 400);
      }
      console.error("Error fetching order:", error);
      return ctx.json({ error: "Internal server error" }, 500);
    }
  });

  return app;
}
