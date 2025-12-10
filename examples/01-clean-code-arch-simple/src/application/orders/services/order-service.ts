import { Order, OrderId, OrderItem } from "../../../domain/orders";
import type { CancelOrderDTO, PlaceOrderDTO } from "../dtos";
import { OrderNotFoundError, OrderValidationError } from "../errors";
import type { OrderRepository } from "../ports";

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    // Application-level validation
    if (!dto.orderId || dto.orderId.trim().length === 0) {
      throw new OrderValidationError("Order ID is required");
    }

    if (!dto.items || dto.items.length === 0) {
      throw new OrderValidationError("Order must have at least one item");
    }

    // Create domain objects
    const orderId = OrderId.create(dto.orderId);
    const items = dto.items.map((item) =>
      OrderItem.create(item.productId, item.productName, item.quantity, item.pricePerUnit),
    );

    // Domain logic creates the order with invariants enforced
    const order = Order.create(orderId, items);

    // Persist via port
    return await this.orderRepository.save(order);
  }

  async cancelOrder(dto: CancelOrderDTO): Promise<Order> {
    // Application-level validation
    if (!dto.orderId || dto.orderId.trim().length === 0) {
      throw new OrderValidationError("Order ID is required");
    }

    const orderId = OrderId.create(dto.orderId);

    // Retrieve order
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(dto.orderId);
    }

    // Domain logic handles cancellation rules
    const cancelledOrder = order.cancel();

    // Persist updated state
    return await this.orderRepository.save(cancelledOrder);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    if (!orderId || orderId.trim().length === 0) {
      throw new OrderValidationError("Order ID is required");
    }

    const id = OrderId.create(orderId);
    return await this.orderRepository.findById(id);
  }
}
