import type { Order, OrderId } from "../../../domain/orders";

export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: OrderId): Promise<Order | null>;
}
