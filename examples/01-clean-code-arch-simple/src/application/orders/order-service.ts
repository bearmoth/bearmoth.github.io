import { Order, OrderId, OrderItem, type PricingStrategy } from "../../domain/orders";
import type { CancelOrderDTO, PlaceOrderDTO } from "./dtos";
import { type OrderResponseDTO, toOrderResponseDTO } from "./dtos/order-response-dto";
import { CustomerNotFoundError, OrderNotFoundError, OrderValidationError } from "./errors";
import type { CustomerValidator, OrderRepository } from "./ports";

/**
 * Application service responsible for orchestrating order-related use cases.
 *
 * `OrderService` coordinates high-level workflows such as placing, cancelling,
 * and retrieving orders. It performs application-level validation, delegates
 * cross-context checks, and invokes domain logic while remaining free of
 * infrastructure concerns.
 *
 * Responsibilities:
 * - Validate input DTOs for required fields and basic invariants.
 * - Ensure referenced customers exist via the `CustomerValidator` port.
 * - Translate DTOs into domain entities and value objects (`Order`, `OrderId`, `OrderItem`).
 * - Inject configuration (pricing strategy) into domain objects.
 * - Delegate persistence to the injected `OrderRepository` port.
 * - Surface meaningful application-level errors (e.g. `OrderValidationError`,
 *   `CustomerNotFoundError`, `OrderNotFoundError`) to calling layers.
 *
 * Collaborators:
 * - {@link OrderRepository}: Persistence port used to save and retrieve `Order` aggregates.
 * - {@link CustomerValidator}: Port used to verify that a customer exists before placing an order.
 * - {@link Order}: Domain aggregate representing an order and its invariants.
 * - {@link OrderId}: Domain value object encapsulating order identity.
 * - {@link OrderItem}: Domain entity/value object representing an item within an order.
 * - {@link PricingStrategy}: Configuration defining how order totals are calculated.
 */
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerValidator: CustomerValidator,
    private readonly pricingStrategy: PricingStrategy,
  ) {}

  /**
   * Places a new order in the system.
   *
   * This method performs application-level validation on the incoming {@link PlaceOrderDTO},
   * ensures the customer exists, maps the DTO to domain objects, and delegates persistence
   * to the injected order repository.
   *
   * Validation rules:
   * - `orderId` must be provided and non-empty.
   * - `customerId` must be provided and non-empty.
   * - `items` must contain at least one item.
   * - The customer identified by `customerId` must exist.
   *
   * @param dto - Data required to create a new order.
   * @throws {OrderValidationError}
   * Thrown if the DTO fails application-level validation (missing IDs or empty items list).
   * @throws {CustomerNotFoundError}
   * Thrown if the referenced customer does not exist.
   * @returns A promise that resolves to an {@link OrderResponseDTO} with calculated total.
   */
  async placeOrder(dto: PlaceOrderDTO): Promise<OrderResponseDTO> {
    // Application-level validation
    if (!dto.orderId || dto.orderId.trim().length === 0) {
      throw new OrderValidationError("Order ID is required");
    }

    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new OrderValidationError("Customer ID is required");
    }

    // Validate customer exists (cross-context interaction)
    const customerExists = await this.customerValidator.customerExists(dto.customerId);
    if (!customerExists) {
      throw new CustomerNotFoundError(dto.customerId);
    }

    // Create domain objects
    const orderId = OrderId.create(dto.orderId);
    const items = dto.items.map((item) =>
      OrderItem.create(item.productId, item.productName, item.quantity, item.pricePerUnit),
    );

    // Domain logic creates the order with invariants enforced
    const order = Order.create(orderId, dto.customerId, items, new Date());

    // Persist via port
    const savedOrder = await this.orderRepository.save(order);

    // Return DTO with calculated total
    return toOrderResponseDTO(savedOrder, this.calculateOrderTotal(savedOrder));
  }

  /**
   * Cancels an existing order.
   *
   * Performs application-level validation on the provided DTO, including
   * checking that an order ID is present and non-empty. It then attempts
   * to retrieve the corresponding order from the repository.
   *
   * If the order does not exist, an {@link OrderNotFoundError} is thrown.
   * If the order exists, domain-level cancellation rules are applied via
   * {@link Order#cancel}, and the updated order state is persisted.
   *
   * @param dto - Data required to cancel an order, including the order ID.
   * @returns An {@link OrderResponseDTO} with the updated order state and calculated total.
   *
   * @throws OrderValidationError If the provided order ID is missing or invalid.
   * @throws OrderNotFoundError If no order exists with the given ID.
   */
  async cancelOrder(dto: CancelOrderDTO): Promise<OrderResponseDTO> {
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
    const savedOrder = await this.orderRepository.save(cancelledOrder);

    // Return DTO with calculated total
    return toOrderResponseDTO(savedOrder, this.calculateOrderTotal(savedOrder));
  }

  /**
   * Retrieves an order by its unique identifier.
   *
   * Validates that the provided `orderId` is a non-empty string before attempting
   * to look up the order. If the `orderId` is empty, whitespace-only, or otherwise
   * invalid, an {@link OrderValidationError} is thrown.
   *
   * @param orderId - The unique identifier of the order to retrieve.
   * @returns A promise that resolves to an {@link OrderResponseDTO} if found,
   * or `null` if no order exists with the given identifier.
   * @throws OrderValidationError If `orderId` is missing, empty, or invalid.
   */
  async getOrderById(orderId: string): Promise<OrderResponseDTO | null> {
    if (!orderId || orderId.trim().length === 0) {
      throw new OrderValidationError("Order ID is required");
    }

    const id = OrderId.create(orderId);
    const order = await this.orderRepository.findById(id);

    if (!order) {
      return null;
    }

    return toOrderResponseDTO(order, this.calculateOrderTotal(order));
  }

  /**
   * Calculates the total amount for an order by applying the configured pricing strategy.
   * This is where the pricing strategy configuration is actually used.
   *
   * @param order - The order to calculate the total for.
   * @returns The total amount after applying pricing rules (discounts, promotions, etc.).
   */
  calculateOrderTotal(order: Order): number {
    return order.calculateTotal(this.pricingStrategy);
  }
}
