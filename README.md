# 🚀 SupplyHub — ERP & CRM Management System

> A full-stack ERP & CRM platform designed for wholesale and distribution businesses to manage customers, products, inventory, stock movements, sales challans, and invoices through a secure role-based business workflow.

<p align="center">

**React • TypeScript • Node.js • Express.js • PostgreSQL • JWT**

</p>


---

# 🔑 Demo Credentials

The following accounts are provided for evaluation and demonstration of the role-based access control system.

| Role             | Email                        | Password                  |
| ---------------- | ---------------------------- | ------------------------- |
| 👑 **Admin**     | `iamadmin@supplyflow.com`    | `Admin@123`               |
| 📦 **Warehouse** | `iamwarehouse@supplyhub.com` | `Warehouse@123` |
| 💼 **Sales**     | `iamsales@supplyhub.com`     | `Sales@123`     |
| 👤 **Customer**  | `iamcustomer@supplyhub.com`  | `Customer@123`  |

### Role Access

**Admin**

* Full system access
* User and business management
* Access to all major modules

**Warehouse**

* Product management
* Inventory management
* Stock IN / OUT
* Stock movement history

**Sales**

* Customer management
* Sales operations
* Delivery challans

**Customer**

* Customer-specific permitted functionality
---

# 📌 Overview

**SupplyHub** is a full-stack ERP & CRM web application designed to centralize important business operations for wholesale and distribution companies.

The system connects:

* Customer management
* Product management
* Inventory management
* Stock movements
* Sales challans
* Invoice management
* Role-based authentication

into a single platform.

Instead of managing each operation separately, SupplyHub connects the complete workflow from **customer and sales operations to inventory deduction and invoicing**.

### Core Business Flow

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
Stock OUT Movement
   ↓
Invoice
```

---

# ✨ Key Features

## 🔐 Authentication & Authorization

* JWT-based authentication
* Secure password hashing using bcrypt
* Protected API routes
* Role-based access control
* Role-specific permissions
* Authenticated business operations

---

## 👥 Customer Management

* Create customers
* View customer information
* Search customers
* Maintain customer records
* Connect customers with sales operations

---

## 📦 Product Management

* Create and manage products
* SKU management
* Product categories
* Product pricing
* Stock quantity tracking
* Minimum stock level configuration

---

## 📊 Inventory Management

* Real-time stock visibility
* Stock IN operations
* Stock OUT operations
* Low-stock tracking
* Out-of-stock tracking
* Inventory value monitoring
* Stock movement history

---

## 🚚 Sales Challan Management

Sales users can:

* Create delivery challans
* Add customers
* Add products
* Save challans as drafts
* Confirm deliveries
* Validate available inventory
* Automatically update inventory after confirmation

---

## 🧾 Invoice Management

* Manage invoices generated from sales transactions
* View invoice information
* Connect invoices with completed sales workflows

---

## 📈 Dashboard

The dashboard provides a centralized business overview including:

* Total products
* Customer information
* Inventory status
* Inventory value
* Recent stock movements
* Low-stock information
* Out-of-stock information

---

# 👤 Role-Based Access Control

SupplyHub separates business responsibilities using role-based authorization.

| Role             | Primary Responsibilities                |
| ---------------- | --------------------------------------- |
| 👑 **Admin**     | Full system access                      |
| 💼 **Sales**     | Customers and sales challans            |
| 📦 **Warehouse** | Products, inventory and stock movements |
| 👤 **Customer**  | Customer-specific permitted operations  |

This ensures users can access only the functionality relevant to their assigned role.

---

# 🔄 Complete Business Workflow

```text
                    ┌───────────────┐
                    │     Login     │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Authentication │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Role Checking │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │   Dashboard   │
                    └───────┬───────┘
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
       ┌──────────────┐            ┌──────────────┐
       │  Customers   │            │   Products   │
       └──────┬───────┘            └──────┬───────┘
              │                           │
              └─────────────┬─────────────┘
                            ↓
                    ┌───────────────┐
                    │ Sales / Order │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │    Challan    │
                    │     Draft     │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │Confirm Challan│
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Stock Check   │
                    └───────┬───────┘
                            ↓
                  ┌─────────┴─────────┐
                  │ Stock Available?  │
                  └─────────┬─────────┘
                            ↓
                    ┌───────────────┐
                    │ Deduct Stock  │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Stock OUT     │
                    │   Movement    │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │    Invoice    │
                    └───────────────┘
```

---

# 📦 Inventory Logic

Inventory consistency is one of the central business rules of SupplyHub.

## Stock IN

When inventory is added:

```text
Previous Stock
      +
Added Quantity
      =
Updated Stock
```

A corresponding **Stock IN movement** is recorded.

---

## Stock OUT

When inventory is removed:

```text
Previous Stock
      -
Removed Quantity
      =
Updated Stock
```

A corresponding **Stock OUT movement** is recorded.

---

## Challan Confirmation

When a sales challan is confirmed:

1. The system identifies the requested products.
2. Available inventory is checked.
3. Requested quantity is compared with current stock.
4. The transaction is rejected when sufficient stock is unavailable.
5. Inventory is deducted after successful validation.
6. A Stock OUT movement is recorded.
7. The workflow proceeds toward invoicing.

This prevents inventory from becoming negative.

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────────┐
│              FRONTEND                   │
│                                         │
│        React + TypeScript + Vite        │
│                                         │
│ Dashboard | Customers | Products        │
│ Inventory | Challans | Invoices         │
└────────────────────┬────────────────────┘
                     │
                     │ REST API
                     ↓
┌─────────────────────────────────────────┐
│               BACKEND                   │
│                                         │
│      Node.js + Express + TypeScript     │
│                                         │
│ Routes                                  │
│    ↓                                    │
│ Middleware                              │
│    ↓                                    │
│ Controllers                             │
│    ↓                                    │
│ Database Operations                     │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│                DATABASE                 │
│                                         │
│         PostgreSQL / Neon               │
│                                         │
│ Users | Customers | Products            │
│ Inventory | Stock Movements             │
│ Challans | Invoices                     │
└─────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* **React**
* **TypeScript**
* **Vite**
* **CSS**

## Backend

* **Node.js**
* **Express.js**
* **TypeScript**
* **JWT**
* **bcrypt**
* **CORS**
* **dotenv**

## Database

* **PostgreSQL**
* **Neon Database**

## Architecture

* RESTful APIs
* Role-Based Access Control
* Layered backend structure
* Environment-based configuration
* Client-server architecture

---

# 📁 Project Structure

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
├── API_DOCUMENTATION.md
├── .gitignore
└── README.md
```

---

# 🔌 REST API

The backend is organized into separate REST API modules.

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

Detailed API information is available in:

**`API_DOCUMENTATION.md`**

---

# 🔒 Security

SupplyHub implements multiple security mechanisms:

* JWT-based authentication
* bcrypt password hashing
* Protected API endpoints
* Role-based authorization
* Environment variables for sensitive configuration
* Database credentials kept outside source code
* `.env` excluded from version control
* CORS configuration

---

# 🧩 Application Modules

## 🔐 Authentication

Users authenticate using their registered email and password.

After successful authentication, the backend generates a JWT token that is used to access protected resources.

---

## 📊 Dashboard

Provides a centralized overview of:

* Products
* Customers
* Current stock
* Inventory value
* Recent stock movements
* Low-stock products

---

## 👥 Customers

Allows authorized users to:

* Add customers
* View customers
* Search customers
* Maintain customer records

---

## 📦 Products

Allows authorized users to manage:

* Products
* SKU
* Category
* Price
* Stock quantity
* Minimum stock level

---

## 📊 Inventory

Provides visibility into:

* Current inventory
* Low-stock products
* Out-of-stock products
* Inventory levels

---

## 📈 Stock History

Tracks:

* Stock IN
* Stock OUT
* Quantity
* Reason
* Timestamp

---

## 🚚 Challans

Sales users can:

* Create delivery challans
* Add customers
* Add products
* Save drafts
* Confirm deliveries
* Validate inventory
* Automatically update stock

---

## 🧾 Invoices

The invoice module manages invoices associated with completed sales transactions.

---

# 🎥 Project Demonstration

A complete walkthrough of SupplyHub is available in the project demo video.
---
# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* PostgreSQL database or Neon Database account
* Git

---

## 1. Clone Repository

```bash
git clone https://github.com/santhoshreddy28/supplyhub.git

cd supplyhub
```

---

# 2. Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file inside the `backend` directory:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=5000
```

Start the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

---

# 3. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# ⚙️ Environment Variables

The backend uses environment variables for sensitive configuration.

| Variable       | Description                           |
| -------------- | ------------------------------------- |
| `DATABASE_URL` | PostgreSQL database connection string |
| `JWT_SECRET`   | Secret used for JWT authentication    |
| `PORT`         | Backend server port                   |

### Important

Never commit:

```text
.env
```

or real credentials/secrets to GitHub.

---

# 🧪 Testing the Application

For evaluation, the recommended testing order is:

### Step 1 — Login

Use one of the demo accounts above.

### Step 2 — Explore Role Permissions

Compare what different roles can access.

### Step 3 — Explore Products

Create/view products and review stock information.

### Step 4 — Explore Inventory

Check current stock and stock movement history.

### Step 5 — Create a Challan

Create a sales challan using a customer and available products.

### Step 6 — Confirm Challan

Confirm the challan and observe the inventory validation.

### Step 7 — Verify Stock

Check that the relevant stock quantity has been deducted.

### Step 8 — Check Stock Movement

Verify that the corresponding Stock OUT movement has been recorded.

### Step 9 — Check Invoice

Review the invoice generated from the completed sales workflow.

---

# 🎯 Project Objectives

SupplyHub was developed to solve a practical business problem:

> **How can a wholesale/distribution business manage customers, products, inventory, deliveries, and billing through one centralized system?**

The project focuses on:

* Centralized business operations
* Secure authentication
* Role-based access
* Inventory consistency
* Connected business workflows
* REST API architecture
* Relational database management

---

# 💡 Key Technical Highlights

* Full-stack TypeScript application
* React frontend
* Node.js backend
* Express REST APIs
* PostgreSQL relational database
* Neon database integration
* JWT authentication
* bcrypt password hashing
* Role-based authorization
* Inventory validation
* Automatic stock deduction
* Stock movement tracking
* Challan lifecycle management
* Invoice workflow
* Modular backend architecture
* Environment-based configuration

---

# 📈 Future Improvements

Planned improvements include:

* Invoice PDF export
* Advanced dashboard analytics
* Improved business reporting
* Pagination for large datasets
* Detailed audit logs
* Automated low-stock notifications
* Enhanced reporting dashboards
* Automated testing
* CI/CD pipeline
* Production monitoring

---

# 👨‍💻 Author

## Santhosh Reddy

**B.Tech — Computer Science Engineering**

### Areas of Interest

* Full-Stack Development
* Backend Engineering
* Software Engineering
* Cybersecurity

### GitHub

https://github.com/santhoshreddy28

### SupplyHub Repository

https://github.com/santhoshreddy28/supplyhub

---

# ⭐ Project Highlights

SupplyHub demonstrates practical implementation of:

```text
Authentication
      +
Authorization
      +
REST APIs
      +
PostgreSQL
      +
Inventory Management
      +
Business Logic
      +
Role-Based Access
      +
ERP / CRM Workflow
```

The project is designed to demonstrate how a real-world business workflow can be implemented as a complete full-stack application.

---

# 📄 License

This project was developed as a full-stack ERP & CRM application project.
