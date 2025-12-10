import { describe, expect, it } from "vitest";
import { CannotCancelShippedOrderError } from "../src/domain/orders/errors/cannot-cancel-shipped-order-error.js";
import { InvalidOrderError } from "../src/domain/orders/errors/invalid-order-error.js";
import { OrderId } from "../src/domain/orders/order-id.js";
import { OrderItem } from "../src/domain/orders/order-item.js";
import { OrderStatus } from "../src/domain/orders/order-status.js";
import { Order } from "../src/domain/orders/order.js";

describe("Domain Layer - Order", () => {
  describe("Order.create", () => {
    it("should create a pending order with valid items", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 2, 10.5)];

      const order = Order.create(orderId, items);

      expect(order.id).toBe(orderId);
      expect(order.items).toHaveLength(1);
      expect(order.status).toBe(OrderStatus.Pending);
      expect(order.totalAmount).toBe(21);
    });

    it("should reject order with no items", () => {
      const orderId = OrderId.create("order-123");

      expect(() => Order.create(orderId, [])).toThrow(InvalidOrderError);
    });
  });

  describe("Order.cancel", () => {
    it("should cancel a pending order", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 1, 10)];
      const order = Order.create(orderId, items);

      const cancelled = order.cancel();

      expect(cancelled.status).toBe(OrderStatus.Cancelled);
      expect(cancelled.id).toBe(order.id);
      expect(cancelled.items).toBe(order.items);
    });

    it("should reject cancellation of shipped order", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 1, 10)];
      const shippedOrder = Order.reconstitute(orderId, items, OrderStatus.Shipped, new Date());

      expect(() => shippedOrder.cancel()).toThrow(CannotCancelShippedOrderError);
    });

    it("should be idempotent for already cancelled orders", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 1, 10)];
      const order = Order.create(orderId, items);

      const cancelled1 = order.cancel();
      const cancelled2 = cancelled1.cancel();

      expect(cancelled2.status).toBe(OrderStatus.Cancelled);
      expect(cancelled2).toBe(cancelled1);
    });
  });

  describe("Domain immutability", () => {
    it("should return new instance when cancelling", () => {
      const orderId = OrderId.create("order-123");
      const items = [OrderItem.create("prod-1", "Widget", 1, 10)];
      const order = Order.create(orderId, items);

      const cancelled = order.cancel();

      expect(cancelled).not.toBe(order);
      expect(order.status).toBe(OrderStatus.Pending);
      expect(cancelled.status).toBe(OrderStatus.Cancelled);
    });
  });
});
