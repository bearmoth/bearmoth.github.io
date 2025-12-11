import { describe, expect, it } from "vitest";
import { CannotCancelShippedOrderError } from "../src/domain/orders/errors/cannot-cancel-shipped-order-error.js";
import { InvalidOrderError } from "../src/domain/orders/errors/invalid-order-error.js";
import { OrderId } from "../src/domain/orders/order-id.js";
import { OrderItem } from "../src/domain/orders/order-item.js";
import { OrderStatus } from "../src/domain/orders/order-status.js";
import { Order } from "../src/domain/orders/order.js";
import { BulkDiscountPricing, StandardPricing } from "../src/domain/orders/pricing-strategy.js";

describe("Domain Layer - Order", () => {
  const standardPricing = new StandardPricing();

  describe("Order.create", () => {
    it("should create a pending order with valid items", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 2, 10.5)];
      const createdAt = new Date("2025-01-01T10:00:00Z");

      const order = Order.create(orderId, "customer-1", items, createdAt);

      expect(order.id).toBe(orderId);
      expect(order.customerId).toBe("customer-1");
      expect(order.items).toHaveLength(1);
      expect(order.status).toBe(OrderStatus.Pending);
      expect(order.subtotal).toBe(21);
      expect(order.calculateTotal(standardPricing)).toBe(21);
      expect(order.createdAt).toBe(createdAt);
    });

    it("should reject order with no items", () => {
      const orderId = OrderId.create("order-123");
      const createdAt = new Date();

      expect(() => Order.create(orderId, "customer-1", [], createdAt)).toThrow(InvalidOrderError);
    });
  });

  describe("Order.cancel", () => {
    it("should cancel a pending order", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 1, 10)];
      const createdAt = new Date();
      const order = Order.create(orderId, "customer-1", items, createdAt);

      const cancelled = order.cancel();

      expect(cancelled.status).toBe(OrderStatus.Cancelled);
      expect(cancelled.id).toBe(order.id);
      expect(cancelled.customerId).toBe(order.customerId);
      expect(cancelled.items).toBe(order.items);
    });

    it("should reject cancellation of shipped order", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 1, 10)];
      const shippedOrder = Order.reconstitute(
        orderId,
        "customer-1",
        items,
        OrderStatus.Shipped,
        new Date(),
      );

      expect(() => shippedOrder.cancel()).toThrow(CannotCancelShippedOrderError);
    });

    it("should be idempotent for already cancelled orders", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 1, 10)];
      const createdAt = new Date();
      const order = Order.create(orderId, "customer-1", items, createdAt);

      const cancelled1 = order.cancel();
      const cancelled2 = cancelled1.cancel();

      expect(cancelled2.status).toBe(OrderStatus.Cancelled);
      expect(cancelled2).toBe(cancelled1);
    });
  });

  describe("Pricing strategies", () => {
    it("should apply standard pricing (no discount)", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 2, 50)];
      const createdAt = new Date();
      const order = Order.create(orderId, "customer-1", items, createdAt);

      expect(order.subtotal).toBe(100);
      expect(order.calculateTotal(new StandardPricing())).toBe(100);
    });

    it("should apply bulk discount when threshold is met", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 5, 50)]; // subtotal: 250
      const bulkPricing = new BulkDiscountPricing(200, 10); // 10% off orders over 200
      const createdAt = new Date();
      const order = Order.create(orderId, "customer-1", items, createdAt);

      expect(order.subtotal).toBe(250);
      expect(order.calculateTotal(bulkPricing)).toBe(225); // 10% discount applied
    });

    it("should not apply bulk discount when threshold is not met", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 2, 50)]; // subtotal: 100
      const bulkPricing = new BulkDiscountPricing(200, 10); // 10% off orders over 200
      const createdAt = new Date();
      const order = Order.create(orderId, "customer-1", items, createdAt);

      expect(order.subtotal).toBe(100);
      expect(order.calculateTotal(bulkPricing)).toBe(100); // No discount, below threshold
    });
  });

  describe("Domain immutability", () => {
    it("should return new instance when cancelling", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 1, 10)];
      const order = Order.create(orderId, "customer-1", items);

      const cancelled = order.cancel();

      expect(cancelled).not.toBe(order);
      expect(order.status).toBe(OrderStatus.Pending);
      expect(cancelled.status).toBe(OrderStatus.Cancelled);
    });
  });
});
