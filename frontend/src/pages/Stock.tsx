import { useEffect, useMemo, useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unit_price: string | number;
  current_stock: number;
  min_stock_alert: number;
  location: string | null;
}

interface StockMovement {
  id: string;
  product_id: string;
  quantity_changed: number;
  movement_type: "IN" | "OUT";
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

interface MovementResponse {
  product: Product;
  movements: StockMovement[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const Stock = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [movements, setMovements] =
    useState<StockMovement[]>([]);

  const [showStockModal, setShowStockModal] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [movementType, setMovementType] =
    useState<"IN" | "OUT">("IN");

  const [quantity, setQuantity] = useState("");

  const [reason, setReason] = useState("");

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const token = localStorage.getItem("token");

  /*
   * CURRENT USER
   */

  const storedUser = localStorage.getItem("user");

  let user: User | null = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }

  /*
   * ROLE PERMISSION
   */

  const role = user?.role?.trim().toLowerCase();

  const canManageStock =
    role === "admin" ||
    role === "warehouse";

  /*
   * FETCH PRODUCTS
   */

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "Authentication token not found"
        );
      }

      const response = await fetch(
        "http://localhost:5000/products?limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch products"
        );
      }

      setProducts(result.data || []);
    } catch (error) {
      console.error(
        "Fetch products error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /*
   * SUCCESS MESSAGE
   */

  const showSuccess = (text: string) => {
    setSuccessMessage(text);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);
  };

  /*
   * OPEN STOCK MODAL
   */

  const openStockModal = (
    product: Product
  ) => {
    if (!canManageStock) {
      return;
    }

    setShowHistory(false);
    setHistoryLoading(false);
    setMovements([]);

    setSelectedProduct(product);

    setMovementType("IN");
    setQuantity("");
    setReason("");
    setMessage("");

    setShowStockModal(true);
  };

  /*
   * CLOSE STOCK MODAL
   */

  const closeStockModal = () => {
    if (saving) {
      return;
    }

    setShowStockModal(false);
    setSelectedProduct(null);
    setQuantity("");
    setReason("");
    setMessage("");
  };

  /*
   * STOCK MOVEMENT
   */

  const handleStockMovement = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!canManageStock) {
      return;
    }

    if (!selectedProduct) {
      return;
    }

    const numericQuantity = Number(quantity);

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setMessage(
        "Quantity must be a positive integer"
      );

      return;
    }

    if (
      movementType === "OUT" &&
      numericQuantity >
        selectedProduct.current_stock
    ) {
      setMessage(
        `Cannot remove more than the current stock (${selectedProduct.current_stock})`
      );

      return;
    }

    try {
      setSaving(true);
      setMessage("");

      if (!token) {
        throw new Error(
          "Authentication token not found"
        );
      }

      const response = await fetch(
        `http://localhost:5000/stock/${selectedProduct.id}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            quantity: numericQuantity,

            movement_type:
              movementType,

            reason:
              reason.trim() || null
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update stock"
        );
      }

      const productName =
        selectedProduct.name;

      const movementLabel =
        movementType === "IN"
          ? `+${numericQuantity}`
          : `-${numericQuantity}`;

      setShowStockModal(false);
      setSelectedProduct(null);
      setQuantity("");
      setReason("");
      setMessage("");

      await fetchProducts();

      showSuccess(
        `${productName} ${movementLabel} units`
      );
    } catch (error) {
      console.error(
        "Stock movement error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update stock"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * OPEN HISTORY
   */

  const openHistory = async (
    product: Product
  ) => {
    setShowStockModal(false);
    setShowHistory(true);

    setSelectedProduct(product);
    setMovements([]);

    setHistoryLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error(
          "Authentication token not found"
        );
      }

      const response = await fetch(
        `http://localhost:5000/stock/${product.id}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const result =
        (await response.json()) as
          MovementResponse & {
            message?: string;
          };

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch stock history"
        );
      }

      setMovements(
        result.movements || []
      );
    } catch (error) {
      console.error(
        "Stock history error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch stock history"
      );

      setMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  /*
   * CLOSE HISTORY
   */

  const closeHistory = () => {
    setShowHistory(false);
    setHistoryLoading(false);
    setSelectedProduct(null);
    setMovements([]);
  };

  /*
   * STOCK STATUS
   */

  const getStockStatus = (
    product: Product
  ) => {
    if (product.current_stock === 0) {
      return {
        label: "Out of Stock",
        className: "stock-danger"
      };
    }

    if (
      product.current_stock <=
      product.min_stock_alert
    ) {
      return {
        label: "Low Stock",
        className: "stock-warning"
      };
    }

    return {
      label: "In Stock",
      className: "stock-success"
    };
  };

  /*
   * SEARCH
   */

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter(
      (product) =>
        [
          product.name,
          product.sku,
          product.category || "",
          product.location || ""
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
    );
  }, [products, search]);

  /*
   * SUMMARY
   */

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (sum, product) =>
        sum +
        Number(
          product.current_stock || 0
        ),
      0
    );

  const lowStockCount =
    products.filter(
      (product) =>
        product.current_stock > 0 &&
        product.current_stock <=
          product.min_stock_alert
    ).length;

  const outOfStockCount =
    products.filter(
      (product) =>
        product.current_stock === 0
    ).length;

  return (
    <div className="stock-page">

      {/* SUCCESS TOAST */}

      {successMessage && (
        <div className="stock-success-toast">
          <span className="stock-toast-icon">
            ✓
          </span>

          <div>
            <strong>
              Stock updated successfully
            </strong>

            <span>
              {successMessage}
            </span>
          </div>
        </div>
      )}

      {/* HEADER */}

      <div className="stock-header">

        <div>
          <div className="stock-eyebrow">
            INVENTORY MANAGEMENT
          </div>

          <h1>
            Inventory
          </h1>

          <p>
            Monitor stock levels, update
            inventory and review movement
            history.
          </p>
        </div>

        <button
          type="button"
          className="stock-refresh-button"
          onClick={fetchProducts}
          disabled={loading}
        >
          <span
            className={
              loading
                ? "refresh-spinning"
                : ""
            }
          >
            ↻
          </span>

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="error-message stock-error">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="stock-summary-grid">

        <div className="stock-summary-card">

          <div className="stock-summary-icon">
            ▦
          </div>

          <div>
            <span>
              Total Products
            </span>

            <strong>
              {totalProducts}
            </strong>
          </div>

        </div>

        <div className="stock-summary-card">

          <div className="stock-summary-icon stock-icon-blue">
            ↕
          </div>

          <div>
            <span>
              Total Units
            </span>

            <strong>
              {totalStock}
            </strong>
          </div>

        </div>

        <div className="stock-summary-card">

          <div className="stock-summary-icon stock-icon-yellow">
            !
          </div>

          <div>
            <span>
              Low Stock
            </span>

            <strong>
              {lowStockCount}
            </strong>
          </div>

        </div>

        <div className="stock-summary-card">

          <div className="stock-summary-icon stock-icon-red">
            ×
          </div>

          <div>
            <span>
              Out of Stock
            </span>

            <strong>
              {outOfStockCount}
            </strong>
          </div>

        </div>

      </div>

      {/* INVENTORY SECTION */}

      <div className="stock-section">

        <div className="stock-section-header">

          <div>
            <h2>
              Inventory
            </h2>

            <p>
              {filteredProducts.length}{" "}
              product
              {filteredProducts.length ===
              1
                ? ""
                : "s"}{" "}
              shown
            </p>
          </div>

          <div className="stock-search-wrap">

            <span className="stock-search-icon">
              ⌕
            </span>

            <input
              className="stock-search"
              type="search"
              placeholder="Search products, SKU or location..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {loading ? (

          <div className="loading-box stock-loading">

            <div className="stock-spinner" />

            <span>
              Loading inventory...
            </span>

          </div>

        ) : (

          <div className="stock-table-container">

            <table className="stock-table stock-modern-table">

              <thead>
                <tr>

                  <th>
                    Product
                  </th>

                  <th>
                    SKU
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Stock
                  </th>

                  <th>
                    Minimum
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredProducts.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="empty-state"
                    >
                      {search
                        ? "No products match your search."
                        : "No products found."}
                    </td>

                  </tr>

                ) : (

                  filteredProducts.map(
                    (product) => {

                      const status =
                        getStockStatus(
                          product
                        );

                      return (
                        <tr
                          key={product.id}
                        >

                          {/* PRODUCT */}

                          <td>

                            <div className="stock-product-cell">

                              <div className="stock-product-avatar">
                                {product.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <strong>
                                  {product.name}
                                </strong>

                                <span>
                                  {product.category ||
                                    "General"}
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* SKU */}

                          <td>

                            <span className="stock-sku">
                              {product.sku}
                            </span>

                          </td>

                          {/* LOCATION */}

                          <td>

                            <span className="stock-location">

                              <span>
                                ⌖
                              </span>

                              {product.location ||
                                "-"}

                            </span>

                          </td>

                          {/* CURRENT STOCK */}

                          <td>

                            <strong className="stock-number">
                              {
                                product.current_stock
                              }
                            </strong>

                          </td>

                          {/* MINIMUM */}

                          <td>

                            <span className="stock-minimum">
                              {
                                product.min_stock_alert
                              }
                            </span>

                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`stock-badge ${status.className}`}
                            >

                              <span className="stock-status-dot" />

                              {status.label}

                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="action-buttons stock-actions">

                              {canManageStock && (

                                <button
                                  type="button"
                                  className="primary-button stock-manage-button"
                                  onClick={() =>
                                    openStockModal(
                                      product
                                    )
                                  }
                                >
                                  Manage Stock
                                </button>

                              )}

                              <button
                                type="button"
                                className="secondary-button stock-history-button"
                                onClick={() =>
                                  openHistory(
                                    product
                                  )
                                }
                              >
                                History
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* MANAGE STOCK MODAL */}

      {showStockModal &&
        selectedProduct && (

          <div
            className="modal-overlay"
            onMouseDown={(e) => {

              if (
                e.target ===
                  e.currentTarget &&
                !saving
              ) {
                closeStockModal();
              }

            }}
          >

            <div
              className="modal stock-modal stock-modern-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <div className="modal-eyebrow">
                    INVENTORY UPDATE
                  </div>

                  <h2>
                    Manage Stock
                  </h2>

                  <p>
                    {selectedProduct.name}
                  </p>

                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={
                    closeStockModal
                  }
                  disabled={saving}
                >
                  ×
                </button>

              </div>

              {/* CURRENT STOCK */}

              <div className="current-stock-box stock-current-box">

                <div>

                  <span>
                    Current Stock
                  </span>

                  <small>
                    {selectedProduct.sku}
                  </small>

                </div>

                <strong>
                  {
                    selectedProduct.current_stock
                  }
                </strong>

              </div>

              <form
                onSubmit={
                  handleStockMovement
                }
                className="stock-form"
              >

                {/* MOVEMENT TOGGLE */}

                <div className="stock-movement-toggle">

                  <button
                    type="button"
                    className={
                      movementType ===
                      "IN"
                        ? "movement-option active-in"
                        : "movement-option"
                    }
                    onClick={() => {

                      setMovementType(
                        "IN"
                      );

                      setMessage("");

                    }}
                  >

                    <span>
                      +
                    </span>

                    Add Stock

                  </button>

                  <button
                    type="button"
                    className={
                      movementType ===
                      "OUT"
                        ? "movement-option active-out"
                        : "movement-option"
                    }
                    onClick={() => {

                      setMovementType(
                        "OUT"
                      );

                      setMessage("");

                    }}
                  >

                    <span>
                      −
                    </span>

                    Remove Stock

                  </button>

                </div>

                {/* QUANTITY */}

                <div className="form-group">

                  <label>
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        e.target.value
                      )
                    }
                    placeholder="Enter quantity"
                    required
                    autoFocus
                  />

                </div>

                {/* REASON */}

                <div className="form-group">

                  <label>
                    Reason
                  </label>

                  <input
                    type="text"
                    value={reason}
                    onChange={(e) =>
                      setReason(
                        e.target.value
                      )
                    }
                    placeholder={
                      movementType ===
                      "IN"
                        ? "e.g. New supplier delivery"
                        : "e.g. Customer order"
                    }
                  />

                </div>

                {/* VALIDATION */}

                {movementType ===
                  "OUT" &&
                  quantity &&
                  Number(quantity) >
                    selectedProduct.current_stock && (

                    <div className="form-error">
                      Quantity cannot exceed
                      current stock.
                    </div>

                  )}

                {message && (

                  <div className="form-error">
                    {message}
                  </div>

                )}

                {/* ACTIONS */}

                <div className="modal-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeStockModal
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      saving ||
                      !quantity ||
                      Number(quantity) <=
                        0 ||
                      (movementType ===
                        "OUT" &&
                        Number(quantity) >
                          selectedProduct.current_stock)
                    }
                  >
                    {saving
                      ? "Updating..."
                      : movementType ===
                        "IN"
                      ? "Add Stock"
                      : "Remove Stock"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      {/* HISTORY MODAL */}

      {showHistory &&
        selectedProduct && (

          <div
            className="modal-overlay"
            onMouseDown={(e) => {

              if (
                e.target ===
                e.currentTarget
              ) {
                closeHistory();
              }

            }}
          >

            <div
              className="modal history-modal stock-history-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <div className="modal-eyebrow">
                    INVENTORY ACTIVITY
                  </div>

                  <h2>
                    Stock Movement History
                  </h2>

                  <p>
                    {selectedProduct.name}
                    {" · "}
                    {selectedProduct.sku}
                  </p>

                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={
                    closeHistory
                  }
                >
                  ×
                </button>

              </div>

              {/* CURRENT STOCK */}

              <div className="history-current-stock">

                <span>
                  Current stock
                </span>

                <strong>
                  {
                    selectedProduct.current_stock
                  }{" "}
                  units
                </strong>

              </div>

              {/* HISTORY */}

              {historyLoading ? (

                <div className="loading-box stock-loading">

                  <div className="stock-spinner" />

                  <span>
                    Loading history...
                  </span>

                </div>

              ) : movements.length ===
                0 ? (

                <div className="empty-history">

                  <div className="empty-history-icon">
                    ↕
                  </div>

                  <strong>
                    No stock movements
                  </strong>

                  <span>
                    No inventory activity has
                    been recorded for this
                    product yet.
                  </span>

                </div>

              ) : (

                <div className="movement-table-container">

                  <table className="movement-table stock-history-table">

                    <thead>

                      <tr>

                        <th>
                          Date
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

                      </tr>

                    </thead>

                    <tbody>

                      {movements.map(
                        (movement) => (

                          <tr
                            key={
                              movement.id
                            }
                          >

                            <td>

                              <div className="history-date">

                                <strong>
                                  {new Date(
                                    movement.created_at
                                  ).toLocaleDateString()}
                                </strong>

                                <span>
                                  {new Date(
                                    movement.created_at
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour:
                                        "2-digit",
                                      minute:
                                        "2-digit"
                                    }
                                  )}
                                </span>

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
                                {
                                  movement.movement_type
                                }
                              </span>

                            </td>

                            <td
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

                            </td>

                            <td>
                              {movement.reason ||
                                "No reason provided"}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    closeHistory
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
};

export default Stock;