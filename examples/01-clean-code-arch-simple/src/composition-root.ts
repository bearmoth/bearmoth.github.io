import { Hono } from "hono";
import type { Pool } from "pg";
import { CustomerServiceAdapter, PostgresOrderRepository, createOrderRoutes } from "./adapters";
import { PostgresCustomerRepository, createCustomerRoutes } from "./adapters/customer";
import { OrderService } from "./application";
import { CustomerService } from "./application/customer";

/**
 * Composition Root
 *
 * This is the single place where we wire together:
 * - Infrastructure dependencies (database pool)
 * - Adapters (repository implementations)
 * - Application services
 * - HTTP routes
 *
 * Dependencies flow inward: adapters depend on application, application depends on domain.
 * The composition root knows about everything and assembles the complete application.
 */
export function createApp(databasePool: Pool): Hono {
  // Infrastructure → Adapters (Customer context)
  const customerRepository = new PostgresCustomerRepository(databasePool);

  // Adapters → Application (Customer context)
  const customerService = new CustomerService(customerRepository);

  // Infrastructure → Adapters (Order context)
  const orderRepository = new PostgresOrderRepository(databasePool);
  const customerServiceAdapter = new CustomerServiceAdapter(customerService);

  // Adapters → Application (Order context)
  const orderService = new OrderService(orderRepository, customerServiceAdapter);

  // Application → HTTP routes (driving adapters)
  const customerRoutes = createCustomerRoutes(customerService);
  const orderRoutes = createOrderRoutes(orderService);

  // Assemble HTTP application
  const app = new Hono();

  app.get("/health", (ctx) => ctx.json({ status: "ok" }));
  app.route("/", customerRoutes);
  app.route("/", orderRoutes);

  return app;
}
