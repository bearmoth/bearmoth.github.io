import type { Pool } from "pg";
import type { OrderRepository } from "../../../application/orders";
import { Order, OrderId, OrderItem, parseOrderStatus } from "../../../domain/orders";
import { RepositoryError } from "../errors";

interface OrderRow {
  id: string;
  items: string;
  status: string;
  created_at: Date;
}

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<Order> {
    try {
      const itemsJson = JSON.stringify(order.items.map((item) => item.toJSON()));

      await this.pool.query(
        `INSERT INTO orders (id, items, status, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           items = EXCLUDED.items,
           status = EXCLUDED.status`,
        [order.id.toString(), itemsJson, order.status, order.createdAt],
      );

      return order;
    } catch (error) {
      throw new RepositoryError(`Failed to save order ${order.id.toString()}`, error);
    }
  }

  async findById(id: OrderId): Promise<Order | null> {
    try {
      const result = await this.pool.query<OrderRow>(
        "SELECT id, items, status, created_at FROM orders WHERE id = $1",
        [id.toString()],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      if (!row) {
        return null;
      }

      return this.mapRowToOrder(row);
    } catch (error) {
      throw new RepositoryError(`Failed to find order ${id.toString()}`, error);
    }
  }

  private mapRowToOrder(row: OrderRow): Order {
    const orderId = OrderId.create(row.id);

    const itemsData = JSON.parse(row.items) as {
      productId: string;
      productName: string;
      quantity: number;
      pricePerUnit: number;
    }[];

    const items = itemsData.map((item) =>
      OrderItem.create(item.productId, item.productName, item.quantity, item.pricePerUnit),
    );

    const status = parseOrderStatus(row.status);
    const createdAt = new Date(row.created_at);

    return Order.reconstitute(orderId, items, status, createdAt);
  }
}
