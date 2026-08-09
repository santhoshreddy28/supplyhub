import { useEffect, useMemo, useState } from "react";

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity_changed: number;
  movement_type: string;
  reason: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

function StockMovements() {
  const [movements, setMovements] = useState<
    StockMovement[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found"
        );
      }

      const response = await fetch(
        "http://localhost:5000/stock-movements",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Failed to load stock movements"
        );
      }

      const data = Array.isArray(result)
        ? result
        : result.data || [];

      setMovements(data);
    } catch (err) {
      console.error(
        "Stock movement error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load stock movements"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const filteredMovements = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return movements.filter(
      (movement) => {
        const movementType =
          movement.movement_type
            ?.trim()
            .toUpperCase();

        if (
          typeFilter !== "ALL" &&
          movementType !== typeFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          movement.product_name
            ?.toLowerCase()
            .includes(query) ||
          movement.sku
            ?.toLowerCase()
            .includes(query) ||
          movement.reason
            ?.toLowerCase()
            .includes(query) ||
          movement.created_by_name
            ?.toLowerCase()
            .includes(query)
        );
      }
    );
  }, [
    movements,
    search,
    typeFilter
  ]);

  const totalIn = movements
    .filter(
      (movement) =>
        movement.movement_type
          ?.toUpperCase() === "IN"
    )
    .reduce(
      (total, movement) =>
        total +
        Number(
          movement.quantity_changed
        ),
      0
    );

  const totalOut = movements
    .filter(
      (movement) =>
        movement.movement_type
          ?.toUpperCase() === "OUT"
    )
    .reduce(
      (total, movement) =>
        total +
        Number(
          movement.quantity_changed
        ),
      0
    );

  return (
    <div className="stock-movements-page">

      <div className="stock-movements-header">

        <div>
          <div className="page-eyebrow">
            INVENTORY CONTROL
          </div>

          <h1>
            Stock Movement History
          </h1>

          <p>
            Track every inventory movement
            across your business.
          </p>
        </div>

        <button
          className="challan-primary-button"
          onClick={loadMovements}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </div>

      {error && (
        <div className="challan-message">
          {error}
        </div>
      )}

      <div className="challan-summary">

        <div className="challan-summary-card">
          <span>
            Total Movements
          </span>

          <strong>
            {movements.length}
          </strong>
        </div>

        <div className="challan-summary-card">
          <span>
            Stock In
          </span>

          <strong>
            {totalIn}
          </strong>
        </div>

        <div className="challan-summary-card">
          <span>
            Stock Out
          </span>

          <strong>
            {totalOut}
          </strong>
        </div>

      </div>

      <div className="movement-table-card">

        <div className="movement-toolbar">

          <div className="movement-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              value={search}
              placeholder="Search product, SKU, reason or user..."
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <div className="movement-filters">

            <button
              type="button"
              className={
                typeFilter === "ALL"
                  ? "movement-filter active"
                  : "movement-filter"
              }
              onClick={() =>
                setTypeFilter("ALL")
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                typeFilter === "IN"
                  ? "movement-filter active"
                  : "movement-filter"
              }
              onClick={() =>
                setTypeFilter("IN")
              }
            >
              Stock In
            </button>

            <button
              type="button"
              className={
                typeFilter === "OUT"
                  ? "movement-filter active"
                  : "movement-filter"
              }
              onClick={() =>
                setTypeFilter("OUT")
              }
            >
              Stock Out
            </button>

          </div>

        </div>

        {loading ? (
          <div className="movement-empty">

            <div className="movement-loading-icon">
              ...
            </div>

            <h3>
              Loading movement history
            </h3>

            <p>
              Fetching the latest inventory
              activity.
            </p>

          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="movement-empty">

            <div className="movement-empty-icon">
              ◌
            </div>

            <h3>
              No movements found
            </h3>

            <p>
              Try changing your search
              or filter.
            </p>

          </div>
        ) : (
          <div className="movement-table-wrapper">

            <table className="movement-table">

              <thead>
                <tr>
                  <th>
                    Date
                  </th>

                  <th>
                    Product
                  </th>

                  <th>
                    Movement
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    User
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredMovements.map(
                  (movement) => {
                    const isOut =
                      movement.movement_type
                        ?.toUpperCase() ===
                      "OUT";

                    return (
                      <tr
                        key={
                          movement.id
                        }
                      >

                        <td>
                          <div className="movement-date">

                            <strong>
                              {new Date(
                                movement.created_at
                              ).toLocaleDateString(
                                "en-IN"
                              )}
                            </strong>

                            <span>
                              {new Date(
                                movement.created_at
                              ).toLocaleTimeString(
                                "en-IN",
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
                          <div className="movement-product">

                            <strong>
                              {
                                movement.product_name
                              }
                            </strong>

                            <span>
                              {movement.sku}
                            </span>

                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              isOut
                                ? "movement-badge movement-out"
                                : "movement-badge movement-in"
                            }
                          >
                            {isOut
                              ? "OUT"
                              : "IN"}
                          </span>
                        </td>

                        <td>
                          <strong
                            className={
                              isOut
                                ? "movement-quantity out"
                                : "movement-quantity in"
                            }
                          >
                            {isOut
                              ? "-"
                              : "+"}
                            {
                              movement.quantity_changed
                            }
                          </strong>
                        </td>

                        <td>
                          <span className="movement-reason">
                            {movement.reason}
                          </span>
                        </td>

                        <td>
                          <div className="movement-user">

                            <div className="movement-avatar">
                              {movement
                                .created_by_name
                                ?.charAt(0)
                                .toUpperCase() ||
                                "U"}
                            </div>

                            <strong>
                              {
                                movement.created_by_name ||
                                "Unknown"
                              }
                            </strong>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

        {!loading &&
          filteredMovements.length > 0 && (
            <div className="movement-footer">

              Showing{" "}
              <strong>
                {filteredMovements.length}
              </strong>{" "}
              of{" "}
              <strong>
                {movements.length}
              </strong>{" "}
              movements

            </div>
          )}

      </div>

    </div>
  );
}

export default StockMovements;