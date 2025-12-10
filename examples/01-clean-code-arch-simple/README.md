# Clean Architecture Example: Order Service

A working example demonstrating Clean Architecture principles in TypeScript, built as a companion to the [Discovering Clean Architecture in Practice](../../docs/discovering-clean-architecture-in-practice/01-introduction.md) blog series.

This example implements a simple e-commerce order service with the ability to place and cancel orders, showcasing:

- **Domain layer**: Pure business logic with zero dependencies
- **Application layer**: Use-case orchestration and port definitions
- **Interface adapters layer**: HTTP routes, PostgreSQL repository, and composition root
- **Dependency inversion**: Dependencies point inward toward the domain

## Architecture Overview

```
src/
├── domain/                      # Innermost layer - pure business logic
│   └── orders/                  # Orders bounded context
│       ├── order.ts             # Order entity (aggregate root)
│       ├── order-id.ts          # OrderId value object
│       ├── order-item.ts        # OrderItem value object
│       ├── order-status.ts      # OrderStatus enum
│       └── errors/              # Domain-specific errors
│
├── application/                 # Use-case orchestration
│   └── orders/                  # Orders bounded context
│       ├── services/
│       │   └── order-service.ts # PlaceOrder, CancelOrder use cases
│       ├── ports/
│       │   └── order-repository.ts  # Repository interface (port)
│       ├── dtos/                # Data transfer objects
│       └── errors/              # Application-level errors
│
├── adapters/                    # Outermost layer - I/O and infrastructure
│   ├── database/
│   │   └── postgres-connection.ts  # Shared database connection pool
│   └── orders/                  # Orders bounded context
│       ├── repositories/
│       │   └── postgres-order-repository.ts  # PostgreSQL implementation (driven adapter)
│       ├── http/
│       │   └── order-routes.ts  # HTTP handlers (driving adapter)
│       └── errors/              # Infrastructure errors
│
├── composition-root.ts          # Dependency injection and wiring
└── index.ts                     # Application entry point
```

### Organisation by Bounded Context

Each architectural layer is organised by bounded context (in this case, "orders"). This structure:

- **Scales naturally**: Adding new contexts (e.g., `payments/`, `shipping/`) is straightforward
- **Maintains cohesion**: All order-related code in each layer is grouped together
- **Clarifies boundaries**: Each context's domain, application logic, and adapters are clearly separated
- **Supports modularity**: Contexts can evolve independently within their architectural constraints

## Key Design Principles

### Dependency Rule
- **Domain** imports: Nothing (zero dependencies)
- **Application** imports: Domain only
- **Adapters** imports: Application, Domain, and infrastructure libraries

### Immutability
Domain methods return new instances rather than mutating state:
```typescript
const cancelledOrder = order.cancel(); // Returns new Order instance
```

### Ports and Adapters
The application defines interfaces (ports) for infrastructure needs:
```typescript
// Port (in application layer)
interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: OrderId): Promise<Order | null>;
}

// Adapter (in adapters layer)
class PostgresOrderRepository implements OrderRepository { ... }
```

## Prerequisites

- **Node.js** 18+ and **pnpm** 10.15.1+
- **PostgreSQL** 17+ (or use Docker Compose)

## Setup

### 1. Install dependencies
```bash
pnpm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection details if needed
```

### 3. Start PostgreSQL database

**Option A: Using Docker Compose (recommended)**
```bash
docker compose up -d
```

**Option B: Using local PostgreSQL**
```bash
psql -U postgres -f schema.sql
```

### 4. Start the application
```bash
pnpm dev
```

The server will start on `http://localhost:3000`.

## API Examples

### Health check
```bash
curl http://localhost:3000/health
```

### Place an order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-001",
    "items": [
      {
        "productId": "prod-123",
        "productName": "Widget",
        "quantity": 2,
        "pricePerUnit": 19.99
      },
      {
        "productId": "prod-456",
        "productName": "Gadget",
        "quantity": 1,
        "pricePerUnit": 49.99
      }
    ]
  }'
```

Response:
```json
{
  "id": "order-001",
  "items": [
    {
      "productId": "prod-123",
      "productName": "Widget",
      "quantity": 2,
      "pricePerUnit": 19.99
    },
    {
      "productId": "prod-456",
      "productName": "Gadget",
      "quantity": 1,
      "pricePerUnit": 49.99
    }
  ],
  "status": "pending",
  "totalAmount": 89.97,
  "createdAt": "2025-12-09T10:30:00.000Z"
}
```

### Get an order
```bash
curl http://localhost:3000/orders/order-001
```

### Cancel an order
```bash
curl -X POST http://localhost:3000/orders/order-001/cancel
```

Response (success):
```json
{
  "id": "order-001",
  "items": [...],
  "status": "cancelled",
  "totalAmount": 89.97,
  "createdAt": "2025-12-09T10:30:00.000Z"
}
```

Error response (order already shipped):
```json
{
  "error": "Cannot cancel order order-001: order has already been shipped"
}
```

## Running Tests

The example includes tests demonstrating domain layer purity:

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run
```

Tests show:
- Domain logic can be tested without infrastructure mocks
- Immutability patterns (cancel returns new instance)
- Business rule enforcement (cannot cancel shipped orders)
- Invariant validation (orders must have items)

## Domain Business Rules

### Order Creation
- Must have at least one item
- Each item must have valid product ID, name, positive quantity, and non-negative price
- New orders start in `pending` status

### Order Cancellation
- Pending orders can be cancelled
- Shipped orders **cannot** be cancelled (business rule violation)
- Cancelling an already-cancelled order is idempotent

## Layer Responsibilities

### Domain Layer
**What it does:**
- Enforces business rules and invariants
- Defines entities and value objects
- Pure functions with no side effects

**What it doesn't do:**
- No database access
- No HTTP handling
- No external service calls
- No logging or infrastructure concerns

### Application Layer
**What it does:**
- Orchestrates domain objects to fulfill use cases
- Defines ports (interfaces) for infrastructure needs
- Application-level validation
- Coordinates transactions

**What it doesn't do:**
- No direct database or HTTP code
- No knowledge of concrete implementations
- No business rule logic (delegates to domain)

### Interface Adapters Layer
**What it does:**
- Implements ports defined by application
- HTTP request/response handling
- Database queries and persistence
- Error mapping and logging
- Composition root (dependency wiring)

**What it doesn't do:**
- No business rules
- No use-case orchestration logic

## Project Scripts

- `pnpm dev` - Start development server with auto-reload
- `pnpm start` - Run production server
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm lint` - Check code with Biome
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - Type-check without emitting files

## Clean Architecture Benefits Demonstrated

1. **Testability**: Domain layer tested without mocks or infrastructure
2. **Flexibility**: Swap PostgreSQL for another database by changing one file (composition root)
3. **Independence**: Business logic isolated from frameworks and databases
4. **Clarity**: Each layer has a single, clear responsibility
5. **Maintainability**: Changes to infrastructure don't affect domain logic

## Further Reading

- [Discovering Clean Architecture in Practice](../../docs/discovering-clean-architecture-in-practice/01-introduction.md) - Blog series companion to this example
- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - Robert C. Martin
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) - Alistair Cockburn
