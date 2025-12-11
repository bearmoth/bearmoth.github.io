import { Hono } from "hono";
import type { CustomerService } from "../../../application/customer";
import type { Logger } from "../../../application/ports";

export function createCustomerRoutes(customerService: CustomerService, logger: Logger): Hono {
  const app = new Hono();

  app.post("/customers", async (ctx) => {
    try {
      const body = await ctx.req.json();
      const customer = await customerService.registerCustomer({
        name: body.name,
        email: body.email,
      });

      // Manual field serialization in the adapter layer keeps domain entities pure.
      // Serialization is a presentation concern, not a domain concern.
      return ctx.json(
        {
          id: customer.id.toString(),
          name: customer.name.toString(),
          email: customer.email.toString(),
        },
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        return ctx.json({ error: error.message }, 400);
      }
      logger.error("Error registering customer", error);
      return ctx.json({ error: "Internal server error" }, 500);
    }
  });

  app.get("/customers/:id", async (ctx) => {
    try {
      const customerId = ctx.req.param("id");
      const customer = await customerService.getCustomer({ id: customerId });

      if (!customer) {
        return ctx.json({ error: `Customer ${customerId} not found` }, 404);
      }

      return ctx.json({
        id: customer.id.toString(),
        name: customer.name.toString(),
        email: customer.email.toString(),
      });
    } catch (error) {
      logger.error("Error fetching customer", error);
      return ctx.json({ error: "Internal server error" }, 500);
    }
  });

  return app;
}
