# SupplyHub API Documentation

SupplyHub is a full-stack ERP and CRM application for managing customers, products, inventory, stock movements, sales challans and invoices.

## Base URL

```text
http://localhost:5000
```

## Authentication

SupplyHub uses JWT-based authentication.

First, login using:

```http
POST /auth/login
```

Example request:

```json
{
  "email": "iamadmin@supplyhub.com",
  "password": "Admin@123"
}
```

After successful login, the API returns a JWT token.

For protected endpoints, send the token using:

```text
Authorization: Bearer <token>
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Authenticate user and receive JWT token |

---

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Get business dashboard information |

---

### Customers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/customers` | Get all customers |
| POST | `/customers` | Create a new customer |
| GET | `/customers/:id` | Get customer details |
| PUT | `/customers/:id` | Update customer |
| POST | `/customers/:id/follow-ups` | Add customer follow-up |
| GET | `/customers/:id/follow-ups` | Get customer follow-ups |

---

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get product details |
| POST | `/products` | Create a product |
| PUT | `/products/:id` | Update a product |
| GET | `/products/alerts/low-stock` | Get low-stock products |

---

### Inventory / Stock

| Method | Endpoint | Description |
|---|---|---|
| POST | `/stock/:id` | Create stock movement |
| GET | `/stock/:id` | Get stock information for a product |

---

### Stock Movement History

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stock-movements` | Get stock movement history |

---

### Challans

| Method | Endpoint | Description |
|---|---|---|
| GET | `/challans` | Get all delivery challans |
| GET | `/challans/:id` | Get challan details |
| POST | `/challans` | Create a new challan |
| PUT | `/challans/:id/confirm` | Confirm a challan |

When a challan is confirmed, the application validates the available stock and processes the corresponding stock movement.

---

### Invoices

| Method | Endpoint | Description |
|---|---|---|
| GET | `/invoices` | Get all invoices |
| GET | `/invoices/:id` | Get invoice details |
| POST | `/invoices/from-challan/:challanId` | Create an invoice from a confirmed challan |

---

### System Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check whether the SupplyHub API is running |
| GET | `/db-test` | Check database connectivity |

Example response from `/`:

```json
{
  "message": "SupplyHub API is running"
}
```

---

## Role-Based Access

The application supports the following roles:

| Role | Description |
|---|---|
| Admin | Full system access |
| Sales | Customer and sales/challan operations |
| Warehouse | Product and inventory operations |
| Accounts | Billing and invoice operations |

Protected operations use JWT authentication and role-based authorization where applicable.

---

## Main Business Flow

```text
Login
  ↓
Authentication
  ↓
Dashboard
  ↓
Customers / Products
  ↓
Inventory
  ↓
Create Sales Challan
  ↓
Save as Draft
  ↓
Confirm Challan
  ↓
Validate Stock
  ↓
Deduct Stock
  ↓
Stock OUT Movement
  ↓
Generate Invoice
```

---

## Backend API Structure

```text
backend/
└── src/
    ├── controllers/
    │   ├── challanController.ts
    │   ├── customerController.ts
    │   ├── dashboardController.ts
    │   ├── invoiceController.ts
    │   ├── productController.ts
    │   ├── stockController.ts
    │   └── stockMovementController.ts
    │
    ├── middleware/
    │   ├── authMiddleware.ts
    │   └── roleMiddleware.ts
    │
    ├── routes/
    │   ├── authRoutes.ts
    │   ├── challanRoutes.ts
    │   ├── customerRoutes.ts
    │   ├── dashboardRoutes.ts
    │   ├── invoiceRoutes.ts
    │   ├── productRoutes.ts
    │   ├── stockMovementRoutes.ts
    │   ├── stockRoutes.ts
    │   └── testRoutes.ts
    │
    └── index.ts
```

## Technology

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Neon Database
- JWT
- bcrypt

## Notes

The API is currently configured for local development.

Backend:

```text
http://localhost:5000
```

Frontend:

```text
http://localhost:5173
```

For production deployment, the local URLs should be replaced with the deployed API and frontend URLs.

---

## Author

**Santhosh Reddy**

GitHub: https://github.com/santhoshreddy28/supplyhub
