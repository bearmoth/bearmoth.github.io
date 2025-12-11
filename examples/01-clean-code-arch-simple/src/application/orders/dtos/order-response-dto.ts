import type { Order } from "../../../domain/orders";

/**
 * Data Transfer Object for order responses.
 *
 * This DTO includes calculated fields like totalAmount that are
 * computed using the application's configured pricing strategy.
 */
export interface OrderResponseDTO {
  id: string;
  customerId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
  }>;
  status: string;
  subtotal: number;
  totalAmount: number;
  createdAt: string;
}

/**
 * Maps an Order domain entity to an OrderResponseDTO, applying the
 * pricing strategy calculation.
 */
export function toOrderResponseDTO(order: Order, totalAmount: number): OrderResponseDTO {
  return {
    id: order.id.toString(),
    customerId: order.customerId,
    items: order.items.map((item) => item.toJSON()),
    status: order.status,
    subtotal: order.subtotal,
    totalAmount,
    createdAt: order.createdAt.toISOString(),
  };
}
