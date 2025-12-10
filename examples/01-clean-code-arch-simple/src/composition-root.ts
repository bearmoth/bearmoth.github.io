import { Hono } from "hono";
import type { Pool } from "pg";
import { PostgresOrderRepository, createOrderRoutes } from "./adapters";
import { OrderService } from "./application";

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
  // Infrastructure → Adapters
  const orderRepository = new PostgresOrderRepository(databasePool);

  // Adapters → Application
  const orderService = new OrderService(orderRepository);

  // Application → HTTP routes (driving adapters)
  const orderRoutes = createOrderRoutes(orderService);

  // Assemble HTTP application
  const app = new Hono();

  app.get("/health", (ctx) => ctx.json({ status: "ok" }));
  app.route("/", orderRoutes);

  return app;
}
