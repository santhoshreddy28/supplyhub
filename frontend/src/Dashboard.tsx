import { useEffect, useState } from "react";

interface DashboardStats {
  total_products: number;
  total_stock: number;
  low_stock_products: number;
  out_of_stock_products: number;
  inventory_value: string | number;
  total_customers: number;
}

interface RecentMovement {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity_changed: number;
  movement_type: "IN" | "OUT";
  reason: string | null;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  min_stock_alert: number;
  location: string | null;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentMovements: RecentMovement[];
  lowStockProducts: LowStockProduct[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function Dashboard() {
  const [data, setData] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const token =
    localStorage.getItem("token");

  /*
   * CURRENT USER
   */

  const storedUser =
    localStorage.getItem("user");

  let user: User | null = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }

  /*
   * ROLE
   */

  const role =
    user?.role?.trim().toLowerCase();

  const isAdmin =
    role === "admin";

  const isAccounts =
    role === "accounts";

  const isSales =
    role === "sales";

  const isWarehouse =
    role === "warehouse";

  /*
   * DASHBOARD API
   */

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "Authentication token not found"
        );
      }

      const response =
        await fetch(
          "http://localhost:5000/dashboard",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load dashboard"
        );
      }

      setData(result);

    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  /*
   * NAVIGATION
   */

  const navigate = (path: string) => {
    window.history.pushState(
      {},
      "",
      path
    );

    window.dispatchEvent(
      new PopStateEvent("popstate")
    );
  };

  /*
   * LOADING
   */

  if (loading) {
    return (
      <div className="dashboard-loading">

        <div className="dashboard-loader">

          <div className="loader-spinner"></div>

          <p>
            Loading dashboard...
          </p>

        </div>

      </div>
    );
  }

  /*
   * ERROR
   */

  if (error) {
    return (
      <div className="dashboard-error-page">

        <div className="dashboard-error-card">

          <div className="error-icon">
            !
          </div>

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            className="dashboard-refresh"
            onClick={fetchDashboard}
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  if (!data) {
    return null;
  }

  const {
    stats,
    recentMovements,
    lowStockProducts
  } = data;

  /*
   * ROLE-SPECIFIC TEXT
   */

  let dashboardTitle =
    "Dashboard";

  let dashboardDescription =
    "SupplyHub business overview";

  if (isAccounts) {
    dashboardDescription =
      "Customer and business overview";
  }

  if (isSales) {
    dashboardDescription =
      "Customer and business overview";
  }

  if (isWarehouse) {
    dashboardDescription =
      "Inventory and stock overview";
  }

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-header">

        <div>

          <h1>
            {dashboardTitle}
          </h1>

          <p>
            {dashboardDescription}
          </p>

        </div>

        <button
          className="dashboard-refresh"
          onClick={fetchDashboard}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>

      {/* STATISTICS */}

      <div className="dashboard-cards">

        {/* ADMIN / WAREHOUSE */}

        {(isAdmin ||
          isWarehouse) && (

          <>

            {/* TOTAL PRODUCTS */}

            <div className="dashboard-card">

              <div className="dashboard-card-top">

                <span className="dashboard-card-label">
                  Total Products
                </span>

                <span className="dashboard-card-icon">
                  ▦
                </span>

              </div>

              <strong>
                {stats.total_products}
              </strong>

              <span className="dashboard-card-description">
                Products in inventory
              </span>

            </div>

            {/* TOTAL STOCK */}

            <div className="dashboard-card">

              <div className="dashboard-card-top">

                <span className="dashboard-card-label">
                  Total Stock
                </span>

                <span className="dashboard-card-icon">
                  ↕
                </span>

              </div>

              <strong>
                {stats.total_stock}
              </strong>

              <span className="dashboard-card-description">
                Units currently available
              </span>

            </div>

            {/* LOW STOCK */}

            <div className="dashboard-card warning-card">

              <div className="dashboard-card-top">

                <span className="dashboard-card-label">
                  Low Stock
                </span>

                <span className="dashboard-card-icon warning-icon">
                  !
                </span>

              </div>

              <strong>
                {stats.low_stock_products}
              </strong>

              <span className="dashboard-card-description">
                Products need attention
              </span>

            </div>

            {/* OUT OF STOCK */}

            <div className="dashboard-card danger-card">

              <div className="dashboard-card-top">

                <span className="dashboard-card-label">
                  Out of Stock
                </span>

                <span className="dashboard-card-icon danger-icon">
                  ×
                </span>

              </div>

              <strong>
                {stats.out_of_stock_products}
              </strong>

              <span className="dashboard-card-description">
                Products unavailable
              </span>

            </div>

          </>

        )}

        {/* CUSTOMER CARD */}

        {(isAdmin ||
          isAccounts ||
          isSales) && (

          <div className="dashboard-card">

            <div className="dashboard-card-top">

              <span className="dashboard-card-label">
                Total Customers
              </span>

              <span className="dashboard-card-icon">
                ◉
              </span>

            </div>

            <strong>
              {stats.total_customers}
            </strong>

            <span className="dashboard-card-description">
              CRM customers
            </span>

          </div>

        )}

        {/* INVENTORY VALUE */}

        {isAdmin && (

          <div className="dashboard-card value-card">

            <div className="dashboard-card-top">

              <span className="dashboard-card-label">
                Inventory Value
              </span>

              <span className="dashboard-card-icon value-icon">
                ₹
              </span>

            </div>

            <strong>
              ₹
              {Number(
                stats.inventory_value
              ).toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2
                }
              )}
            </strong>

            <span className="dashboard-card-description">
              Current inventory valuation
            </span>

          </div>

        )}

      </div>

      {/* LOWER CONTENT */}

      <div className="dashboard-grid">

        {/* RECENT MOVEMENTS */}

        {(isAdmin ||
          isWarehouse) && (

          <section className="dashboard-section">

            <div className="section-header">

              <div>

                <h2>
                  Recent Stock Movements
                </h2>

                <p>
                  Latest inventory activity
                </p>

              </div>

              <span className="section-count">
                {recentMovements.length} recent
              </span>

            </div>

            {recentMovements.length ===
            0 ? (

              <div className="empty-dashboard">

                <div className="empty-icon">
                  ↕
                </div>

                <h3>
                  No stock movements
                </h3>

                <p>
                  Stock activity will appear
                  here.
                </p>

              </div>

            ) : (

              <div className="dashboard-table-container">

                <table className="dashboard-table">

                  <thead>

                    <tr>

                      <th>
                        Product
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        Quantity
                      </th>

                      <th>
                        Reason
                      </th>

                      <th>
                        Date
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {recentMovements.map(
                      (movement) => (

                        <tr
                          key={
                            movement.id
                          }
                        >

                          <td>

                            <div className="movement-product">

                              <strong>
                                {
                                  movement.product_name
                                }
                              </strong>

                              <small>
                                {movement.sku}
                              </small>

                            </div>

                          </td>

                          <td>

                            <span
                              className={`movement-badge ${
                                movement.movement_type ===
                                "IN"
                                  ? "movement-in"
                                  : "movement-out"
                              }`}
                            >

                              <span className="movement-dot"></span>

                              {
                                movement.movement_type
                              }

                            </span>

                          </td>

                          <td>

                            <span
                              className={
                                movement.movement_type ===
                                "IN"
                                  ? "quantity-in"
                                  : "quantity-out"
                              }
                            >

                              {movement.movement_type ===
                              "IN"
                                ? "+"
                                : "-"}

                              {Math.abs(
                                Number(
                                  movement.quantity_changed
                                )
                              )}

                            </span>

                          </td>

                          <td>

                            <span className="movement-reason">
                              {movement.reason ||
                                "-"}
                            </span>

                          </td>

                          <td>

                            <span className="movement-date">
                              {new Date(
                                movement.created_at
                              ).toLocaleString()}
                            </span>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        )}

        {/* LOW STOCK */}

        {(isAdmin ||
          isWarehouse) && (

          <section className="dashboard-section">

            <div className="section-header">

              <div>

                <h2>
                  Low Stock Products
                </h2>

                <p>
                  Products requiring attention
                </p>

              </div>

              <span className="section-count">
                {lowStockProducts.length}
              </span>

            </div>

            {lowStockProducts.length ===
            0 ? (

              <div className="empty-dashboard success-empty">

                <div className="success-icon">
                  ✓
                </div>

                <h3>
                  Stock levels are healthy
                </h3>

                <p>
                  All products have sufficient
                  stock.
                </p>

              </div>

            ) : (

              <div className="low-stock-list">

                {lowStockProducts.map(
                  (product) => (

                    <button
                      type="button"
                      className="low-stock-item"
                      key={product.id}
                      onClick={() =>
                        navigate("/stock")
                      }
                    >

                      <div className="low-stock-product">

                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {product.sku}
                        </span>

                        {product.location && (
                          <small>
                            {product.location}
                          </small>
                        )}

                      </div>

                      <div className="low-stock-values">

                        <strong>
                          {
                            product.current_stock
                          }
                        </strong>

                        <span>
                          Min:{" "}
                          {
                            product.min_stock_alert
                          }
                        </span>

                      </div>

                      <span className="low-stock-arrow">
                        →
                      </span>

                    </button>

                  )
                )}

              </div>

            )}

          </section>

        )}

        {/* ACCOUNTS / SALES CUSTOMER AREA */}

        {(isAccounts ||
          isSales) && (

          <section className="dashboard-section">

            <div className="section-header">

              <div>

                <h2>
                  Customer Overview
                </h2>

                <p>
                  Customer information available
                  to your role
                </p>

              </div>

              <span className="section-count">
                {stats.total_customers}
              </span>

            </div>

            <div className="empty-dashboard">

              <div className="empty-icon">
                ◉
              </div>

              <h3>
                {stats.total_customers} Customers
              </h3>

              <p>
                Use the Customers section to
                view and manage customer
                information.
              </p>

            </div>

          </section>

        )}

      </div>

    </div>
  );
}

export default Dashboard;