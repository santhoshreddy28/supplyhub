# SupplyHub

SupplyHub is a full-stack ERP and CRM web application designed for wholesale and distribution businesses.

It provides a centralized platform to manage customers, products, inventory, stock movements, sales challans, and invoices.

## Features

- User authentication with JWT
- Role-based access control
- Admin, Sales, Warehouse, and Accounts roles
- Dashboard with business overview
- Customer management
- Product management
- Inventory management
- Stock IN and OUT movements
- Stock movement history
- Low-stock and out-of-stock tracking
- Sales challan creation
- Draft and confirmed challans
- Automatic stock deduction after challan confirmation
- Invoice management
- Customer and product search
- REST API based backend
- PostgreSQL database integration

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- CSS

### Backend

- Node.js
- Express.js
- TypeScript
- JWT
- bcrypt
- CORS
- dotenv

### Database

- PostgreSQL
- Neon Database

## Project Structure

```text
supplyhub/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── index.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   ├── Layout.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Customers.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

## Main Business Flow

```text
User Login
    ↓
Role Authentication
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
Validate Available Stock
    ↓
Deduct Stock
    ↓
Create Stock OUT Movement
    ↓
Generate Invoice
```

## User Roles

| Role | Responsibilities |
|------|------------------|
| Admin | Full system access |
| Sales | Customers and sales challans |
| Warehouse | Products, inventory and stock movements |
| Accounts | Invoice and billing operations |

## Inventory Logic

When stock is added, an IN movement is recorded and the product stock increases.

When stock is removed, an OUT movement is recorded and the product stock decreases.

When a sales challan is confirmed, the system checks the available stock before deducting the requested quantity.

The system prevents stock from becoming negative.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/santhoshreddy28/supplyhub.git
cd supplyhub
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend directory:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=5000
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

## Authentication

Users log in using their registered email and password.

After successful authentication, the backend generates a JWT token which is used to access protected API endpoints.

Role-based authorization controls access to different business operations.

## API Modules

The backend is organized into separate REST API modules:

```text
/auth
/products
/customers
/stock
/stock-movements
/dashboard
/challans
/invoices
```

## Security

- Passwords are stored using bcrypt hashing.
- JWT is used for authentication.
- Protected API routes require authentication.
- Role-based authorization is applied to restricted operations.
- Environment variables are used for database credentials and secrets.
- `.env` files are excluded from Git.

## Application Modules

### Authentication

Secure login with JWT-based authentication and role-based access.

### Dashboard

Provides an overview of products, stock, customers, inventory value and recent stock movements.

### Customers

Manage customer information, search customers and maintain customer records.

### Products

Create and manage products including SKU, category, price, stock and minimum stock levels.

### Inventory

Monitor current stock, low-stock products and out-of-stock products.

### Stock History

Track stock IN and OUT movements with quantities, reasons and timestamps.

### Challans

Create draft delivery challans, add customers and products, confirm deliveries and automatically update inventory.

### Invoices

Manage invoices generated from sales transactions and view invoice information.

## Business Workflow

```text
Customer
   ↓
Sales Order
   ↓
Delivery Challan
   ↓
Stock Validation
   ↓
Inventory Deduction
   ↓
Stock Movement
   ↓
Invoice
```

## Screenshots

The application includes interfaces for:

- Login
- Dashboard
- Customers
- Products
- Inventory
- Stock History
- Challans
- Invoices

## Future Improvements

- Invoice PDF export
- Advanced dashboard analytics
- Improved reporting
- Pagination for large datasets
- More detailed audit logs
- Automated low-stock notifications
- Cloud deployment

## Author

**Santhosh Reddy**

GitHub: https://github.com/santhoshreddy28

## License

This project was developed as a full-stack ERP and CRM application project.
