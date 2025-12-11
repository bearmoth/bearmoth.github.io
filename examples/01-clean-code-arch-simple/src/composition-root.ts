import { Hono } from "hono";
import type { Pool } from "pg";
import { CustomerServiceAdapter, PostgresOrderRepository, createOrderRoutes } from "./adapters";
import { PostgresCustomerRepository, createCustomerRoutes } from "./adapters/customer";
import { ConsoleLogger } from "./adapters/logging";
import { OrderService } from "./application";
import { CustomerService } from "./application/customer";
import { BulkDiscountPricing, type PricingStrategy, StandardPricing } from "./domain/orders";

/**
 * Configuration options for the application.
 */
export interface AppConfig {
  /**
   * Pricing strategy to use for order calculations.
   * If not provided, defaults to StandardPricing (no discounts).
   */
  pricingStrategy?: PricingStrategy;
}

/**
 * Composition Root
 *
 * This is the single place where we wire together:
 * - Infrastructure dependencies (database pool)
 * - Configuration (pricing strategy, rate limits, business rules)
 * - Adapters (repository implementations)
 * - Application services
 * - HTTP routes
 *
 * Dependencies flow inward: adapters depend on application, application depends on domain.
 * Configuration flows inward: composition root → application → domain.
 * The composition root knows about everything and assembles the complete application.
 */
export function createApp(databasePool: Pool, config: AppConfig = {}): Hono {
  // Configuration: select pricing strategy
  // This could be driven by environment variables, feature flags, or runtime configuration
  const pricingStrategy = config.pricingStrategy ?? new StandardPricing();

  // Infrastructure: create logger
  const logger = new ConsoleLogger();

  // Infrastructure → Adapters (Customer context)
  const customerRepository = new PostgresCustomerRepository(databasePool);

  // Adapters → Application (Customer context)
  const customerService = new CustomerService(customerRepository);

  // Infrastructure → Adapters (Order context)
  const orderRepository = new PostgresOrderRepository(databasePool);
  const customerServiceAdapter = new CustomerServiceAdapter(customerService);

  // Adapters → Application (Order context)
  // Configuration is injected into application services, which pass it to domain objects
  const orderService = new OrderService(orderRepository, customerServiceAdapter, pricingStrategy);

  // Application → HTTP routes (driving adapters)
  const customerRoutes = createCustomerRoutes(customerService, logger);
  const orderRoutes = createOrderRoutes(orderService, logger);

  // Assemble HTTP application
  const app = new Hono();

  app.get("/health", (ctx) => ctx.json({ status: "ok" }));
  app.route("/", customerRoutes);
  app.route("/", orderRoutes);

  return app;
}

/**
 * Helper function to create app with bulk discount pricing.
 * Example of how different pricing strategies can be easily swapped at the composition root.
 */
export function createAppWithBulkDiscount(
  databasePool: Pool,
  thresholdAmount: number,
  discountPercentage: number,
): Hono {
  return createApp(databasePool, {
    pricingStrategy: new BulkDiscountPricing(thresholdAmount, discountPercentage),
  });
}
