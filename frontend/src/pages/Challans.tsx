import { useEffect, useState } from "react";

interface Customer {
  id: string;
  name: string;
  business_name?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: string;
  current_stock: number;
}

interface ChallanItem {
  productId: string;
  quantity: number;
}

interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name: string;
  business_name?: string;
  total_quantity: number;
  status: string;
  created_at: string;
}

interface ChallanDetailItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  product_sku_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
}

interface ChallanDetails extends Challan {
  items: ChallanDetailItem[];
}

function Challans() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedChallan, setSelectedChallan] =
    useState<ChallanDetails | null>(null);

  const [customerId, setCustomerId] = useState("");

  const [items, setItems] = useState<ChallanItem[]>([
    {
      productId: "",
      quantity: 1
    }
  ]);

  const [pageLoading, setPageLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [confirmingId, setConfirmingId] =
    useState<string | null>(null);

  const [viewingId, setViewingId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json"
  });

  const loadData = async () => {
    try {
      setPageLoading(true);

      const headers = getHeaders();

      const [
        challanResponse,
        customerResponse,
        productResponse
      ] = await Promise.all([
        fetch(
          "http://localhost:5000/challans",
          {
            headers
          }
        ),

        fetch(
          "http://localhost:5000/customers",
          {
            headers
          }
        ),

        fetch(
          "http://localhost:5000/products",
          {
            headers
          }
        )
      ]);

      const challanData =
        await challanResponse.json();

      const customerData =
        await customerResponse.json();

      const productData =
        await productResponse.json();

      if (!challanResponse.ok) {
        throw new Error(
          challanData.message ||
            challanData.error ||
            "Failed to load challans"
        );
      }

      if (!customerResponse.ok) {
        throw new Error(
          customerData.message ||
            customerData.error ||
            "Failed to load customers"
        );
      }

      if (!productResponse.ok) {
        throw new Error(
          productData.message ||
            productData.error ||
            "Failed to load products"
        );
      }

      setChallans(
        Array.isArray(challanData)
          ? challanData
          : challanData.data || []
      );

      setCustomers(
        Array.isArray(customerData)
          ? customerData
          : customerData.data || []
      );

      setProducts(
        Array.isArray(productData)
          ? productData
          : productData.data || []
      );

    } catch (error) {
      console.error(
        "Load challan data error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load data"
      );

    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        productId: "",
        quantity: 1
      }
    ]);
  };

  const removeItem = (index: number) => {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );
    });
  };

  const updateItem = (
    index: number,
    field: keyof ChallanItem,
    value: string
  ) => {
    setItems((current) => {
      const updated = [...current];

      if (field === "productId") {
        updated[index] = {
          ...updated[index],
          productId: value
        };
      }

      if (field === "quantity") {
        const quantity = Number(value);

        updated[index] = {
          ...updated[index],
          quantity:
            Number.isFinite(quantity) &&
            quantity > 0
              ? Math.floor(quantity)
              : 1
        };
      }

      return updated;
    });
  };

  const getProduct = (
    productId: string
  ) => {
    return products.find(
      (product) =>
        product.id === productId
    );
  };

  const totalQuantity = items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const totalAmount = items.reduce(
    (total, item) => {
      const product = getProduct(
        item.productId
      );

      if (!product) {
        return total;
      }

      return (
        total +
        Number(product.unit_price) *
          item.quantity
      );
    },
    0
  );

  const createChallan = async () => {
    if (creating) {
      return;
    }

    setMessage("");

    if (!customerId) {
      setMessage(
        "Please select a customer."
      );
      return;
    }

    const invalidItem = items.some(
      (item) =>
        !item.productId ||
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <= 0
    );

    if (invalidItem) {
      setMessage(
        "Please select a product and enter a valid quantity for every item."
      );
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(
        "http://localhost:5000/challans",
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            customerId,
            items
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Failed to create challan."
        );
        return;
      }

      setCustomerId("");

      setItems([
        {
          productId: "",
          quantity: 1
        }
      ]);

      setShowCreate(false);

      setMessage(
        `Challan ${data.challanNumber} created successfully.`
      );

      await loadData();

    } catch (error) {
      console.error(
        "Create challan error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );

    } finally {
      setCreating(false);
    }
  };

  const viewChallan = async (
    id: string
  ) => {
    if (viewingId) {
      return;
    }

    try {
      setViewingId(id);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/challans/${id}`,
        {
          method: "GET",
          headers: getHeaders()
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Failed to load challan."
        );
        return;
      }

      setSelectedChallan(data);
      setShowDetails(true);

    } catch (error) {
      console.error(
        "View challan error:",
        error
      );

      setMessage(
        "Unable to load challan details."
      );

    } finally {
      setViewingId(null);
    }
  };

  const confirmChallan = async (
    id: string
  ) => {
    if (confirmingId) {
      return;
    }

    try {
      setConfirmingId(id);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/challans/${id}/confirm`,
        {
          method: "PUT",
          headers: getHeaders()
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Unable to confirm challan."
        );

        return;
      }

      setChallans((current) =>
        current.map((challan) =>
          challan.id === id
            ? {
                ...challan,
                status: "Confirmed"
              }
            : challan
        )
      );

      setSelectedChallan((current) => {
        if (
          !current ||
          current.id !== id
        ) {
          return current;
        }

        return {
          ...current,
          status: "Confirmed"
        };
      });

      setMessage(
        "Challan confirmed successfully."
      );

    } catch (error) {
      console.error(
        "Confirm challan error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );

    } finally {
      setConfirmingId(null);
    }
  };

  const selectedTotal =
    selectedChallan
      ? selectedChallan.items.reduce(
          (total, item) =>
            total +
            Number(
              item.unit_price_snapshot
            ) *
              Number(item.quantity),
          0
        )
      : 0;

  if (pageLoading) {
    return (
      <div className="challans-page">

        <div className="challans-header">
          <div>
            <div className="page-eyebrow">
              SALES OPERATIONS
            </div>

            <h1>
              Delivery Challans
            </h1>

            <p>
              Loading your delivery
              documents...
            </p>
          </div>
        </div>

        <div className="challan-empty">
          <div className="challan-empty-icon">
            ...
          </div>

          <h3>
            Loading Challans
          </h3>

          <p>
            Fetching the latest
            delivery information.
          </p>
        </div>

      </div>
    );
  }

  return (
    <div className="challans-page">

      <div className="challans-header">

        <div>
          <div className="page-eyebrow">
            SALES OPERATIONS
          </div>

          <h1>
            Delivery Challans
          </h1>

          <p>
            Create, review and confirm
            customer delivery challans.
          </p>
        </div>

        <button
          className="challan-primary-button"
          onClick={() => {
            setMessage("");
            setShowCreate(true);
          }}
        >
          + New Challan
        </button>

      </div>

      {message && (
        <div className="challan-message">
          {message}
        </div>
      )}

      <div className="challan-summary">

        <div className="challan-summary-card">
          <span>
            Total Challans
          </span>

          <strong>
            {challans.length}
          </strong>
        </div>

        <div className="challan-summary-card">
          <span>
            Drafts
          </span>

          <strong>
            {
              challans.filter(
                (challan) =>
                  challan.status ===
                  "Draft"
              ).length
            }
          </strong>
        </div>

        <div className="challan-summary-card">
          <span>
            Confirmed
          </span>

          <strong>
            {
              challans.filter(
                (challan) =>
                  challan.status ===
                  "Confirmed"
              ).length
            }
          </strong>
        </div>

      </div>

      <div className="challan-table-card">

        <div className="challan-table-header">

          <div>
            <h2>
              Recent Challans
            </h2>

            <span>
              Latest sales delivery
              documents
            </span>
          </div>

        </div>

        {challans.length === 0 ? (
          <div className="challan-empty">

            <div className="challan-empty-icon">
              ⌑
            </div>

            <h3>
              No challans yet
            </h3>

            <p>
              Create your first delivery
              challan to get started.
            </p>

          </div>
        ) : (
          <div className="challan-table-wrapper">

            <table className="challan-table">

              <thead>
                <tr>
                  <th>
                    Challan
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {challans.map(
                  (challan) => {

                    const isConfirming =
                      confirmingId ===
                      challan.id;

                    const isViewing =
                      viewingId ===
                      challan.id;

                    return (
                      <tr
                        key={
                          challan.id
                        }
                      >

                        <td>
                          <strong>
                            {
                              challan.challan_number
                            }
                          </strong>
                        </td>

                        <td>

                          <div className="customer-cell">

                            <strong>
                              {
                                challan.customer_name
                              }
                            </strong>

                            {challan.business_name && (
                              <span>
                                {
                                  challan.business_name
                                }
                              </span>
                            )}

                          </div>

                        </td>

                        <td>
                          {
                            challan.total_quantity
                          }
                        </td>

                        <td>

                          <span
                            className={
                              challan.status ===
                              "Confirmed"
                                ? "status-confirmed"
                                : "status-draft"
                            }
                          >
                            {
                              challan.status
                            }
                          </span>

                        </td>

                        <td>
                          {new Date(
                            challan.created_at
                          ).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>

                        <td>

                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "7px"
                            }}
                          >

                            <button
                              className="confirm-button"
                              onClick={() =>
                                viewChallan(
                                  challan.id
                                )
                              }
                              disabled={
                                viewingId !==
                                  null ||
                                confirmingId !==
                                  null
                              }
                            >
                              {isViewing
                                ? "Opening..."
                                : "View"}
                            </button>

                            {challan.status ===
                              "Draft" && (
                              <button
                                className="confirm-button"
                                onClick={() =>
                                  confirmChallan(
                                    challan.id
                                  )
                                }
                                disabled={
                                  confirmingId !==
                                    null ||
                                  viewingId !==
                                    null
                                }
                              >
                                {isConfirming
                                  ? "Confirming..."
                                  : "Confirm"}
                              </button>
                            )}

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

      </div>

      {showCreate && (
        <div className="challan-modal-overlay">

          <div className="challan-modal">

            <div className="challan-modal-header">

              <div>

                <div className="page-eyebrow">
                  NEW DOCUMENT
                </div>

                <h2>
                  Create Delivery
                  Challan
                </h2>

                <p>
                  Add the customer and
                  products being delivered.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                ×
              </button>

            </div>

            <div className="challan-form">

              <div className="form-group">

                <label>
                  Customer
                </label>

                <select
                  value={customerId}
                  onChange={(e) =>
                    setCustomerId(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select customer
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {customer.name}

                        {customer.business_name
                          ? ` — ${customer.business_name}`
                          : ""}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="items-heading">

                <div>

                  <h3>
                    Products
                  </h3>

                  <span>
                    Add products being
                    delivered
                  </span>

                </div>

                <button
                  className="add-item-button"
                  onClick={addItem}
                >
                  + Add Product
                </button>

              </div>

              <div className="challan-items">

                {items.map(
                  (item, index) => {

                    const product =
                      getProduct(
                        item.productId
                      );

                    return (
                      <div
                        className="challan-item"
                        key={index}
                      >

                        <div className="item-number">
                          {index + 1}
                        </div>

                        <div className="item-product">

                          <label>
                            Product
                          </label>

                          <select
                            value={
                              item.productId
                            }
                            onChange={(e) =>
                              updateItem(
                                index,
                                "productId",
                                e.target.value
                              )
                            }
                          >

                            <option value="">
                              Select product
                            </option>

                            {products.map(
                              (product) => (
                                <option
                                  key={
                                    product.id
                                  }
                                  value={
                                    product.id
                                  }
                                >
                                  {
                                    product.name
                                  }
                                  {" — "}
                                  {
                                    product.sku
                                  }
                                </option>
                              )
                            )}

                          </select>

                        </div>

                        <div className="item-stock">

                          <label>
                            Available
                          </label>

                          <strong>
                            {product
                              ? product.current_stock
                              : "—"}
                          </strong>

                        </div>

                        <div className="item-quantity">

                          <label>
                            Quantity
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={
                              item.quantity
                            }
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                          />

                        </div>

                        <div className="item-price">

                          <label>
                            Amount
                          </label>

                          <strong>
                            {product
                              ? `₹${(
                                  Number(
                                    product.unit_price
                                  ) *
                                  item.quantity
                                ).toLocaleString(
                                  "en-IN"
                                )}`
                              : "₹0"}
                          </strong>

                        </div>

                        <button
                          className="remove-item-button"
                          onClick={() =>
                            removeItem(
                              index
                            )
                          }
                          disabled={
                            items.length ===
                            1
                          }
                        >
                          ×
                        </button>

                      </div>
                    );
                  }
                )}

              </div>

              <div className="challan-total">

                <div>

                  <span>
                    Total Quantity
                  </span>

                  <strong>
                    {totalQuantity}
                  </strong>

                </div>

                <div>

                  <span>
                    Estimated Value
                  </span>

                  <strong>
                    ₹
                    {totalAmount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>

              </div>

              <div className="challan-modal-actions">

                <button
                  className="cancel-button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="challan-primary-button"
                  onClick={
                    createChallan
                  }
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Draft"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {showDetails &&
        selectedChallan && (
          <div className="challan-modal-overlay">

            <div className="challan-modal">

              <div className="challan-modal-header">

                <div>

                  <div className="page-eyebrow">
                    DELIVERY DOCUMENT
                  </div>

                  <h2>
                    Delivery Challan
                  </h2>

                  <div
                    style={{
                      marginTop:
                        "6px",
                      color:
                        "#64748b",
                      fontSize:
                        "14px",
                      fontWeight:
                        600
                    }}
                  >
                    No.{" "}
                    {
                      selectedChallan.challan_number
                    }
                  </div>

                  <p>
                    Created on{" "}
                    {new Date(
                      selectedChallan.created_at
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>

                </div>

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "12px"
                  }}
                >

                  <span
                    className={
                      selectedChallan.status ===
                      "Confirmed"
                        ? "status-confirmed"
                        : "status-draft"
                    }
                  >
                    {
                      selectedChallan.status
                    }
                  </span>

                  <button
                    className="modal-close"
                    onClick={() =>
                      setShowDetails(
                        false
                      )
                    }
                  >
                    ×
                  </button>

                </div>

              </div>

              <div className="challan-form">

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(2, 1fr)",
                    gap: "15px",
                    marginBottom:
                      "28px"
                  }}
                >

                  <div
                    style={{
                      padding:
                        "17px",
                      border:
                        "1px solid #e6ebf1",
                      borderRadius:
                        "10px",
                      background:
                        "#fafbfd"
                    }}
                  >

                    <span
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "6px",
                        color:
                          "#8995a8",
                        fontSize:
                          "10px",
                        fontWeight:
                          700,
                        textTransform:
                          "uppercase"
                      }}
                    >
                      Customer
                    </span>

                    <strong
                      style={{
                        display:
                          "block",
                        color:
                          "#172033",
                        fontSize:
                          "14px"
                      }}
                    >
                      {
                        selectedChallan.customer_name
                      }
                    </strong>

                    {selectedChallan.business_name && (
                      <span
                        style={{
                          display:
                            "block",
                          marginTop:
                            "4px",
                          color:
                            "#8995a8",
                          fontSize:
                            "12px"
                        }}
                      >
                        {
                          selectedChallan.business_name
                        }
                      </span>
                    )}

                  </div>

                  <div
                    style={{
                      padding:
                        "17px",
                      border:
                        "1px solid #e6ebf1",
                      borderRadius:
                        "10px",
                      background:
                        "#fafbfd"
                    }}
                  >

                    <span
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "6px",
                        color:
                          "#8995a8",
                        fontSize:
                          "10px",
                        fontWeight:
                          700,
                        textTransform:
                          "uppercase"
                      }}
                    >
                      Total Quantity
                    </span>

                    <strong
                      style={{
                        color:
                          "#172033",
                        fontSize:
                          "22px"
                      }}
                    >
                      {
                        selectedChallan.total_quantity
                      }
                    </strong>

                  </div>

                </div>

                <div className="items-heading">

                  <div>

                    <h3>
                      Challan Items
                    </h3>

                    <span>
                      Products included
                      in this delivery
                    </span>

                  </div>

                </div>

                <div className="challan-table-wrapper">

                  <table className="challan-table">

                    <thead>

                      <tr>
                        <th>
                          Product
                        </th>

                        <th>
                          SKU
                        </th>

                        <th>
                          Quantity
                        </th>

                        <th>
                          Unit Price
                        </th>

                        <th>
                          Amount
                        </th>
                      </tr>

                    </thead>

                    <tbody>

                      {selectedChallan.items.map(
                        (item) => (
                          <tr
                            key={
                              item.id
                            }
                          >

                            <td>
                              <strong>
                                {
                                  item.product_name_snapshot
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                item.product_sku_snapshot
                              }
                            </td>

                            <td>
                              {
                                item.quantity
                              }
                            </td>

                            <td>
                              ₹
                              {Number(
                                item.unit_price_snapshot
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td>
                              <strong>
                                ₹
                                {(
                                  Number(
                                    item.unit_price_snapshot
                                  ) *
                                  Number(
                                    item.quantity
                                  )
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </strong>
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

                <div className="challan-total">

                  <div>

                    <span>
                      Total Quantity
                    </span>

                    <strong>
                      {
                        selectedChallan.total_quantity
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Total Value
                    </span>

                    <strong>
                      ₹
                      {selectedTotal.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                </div>

                <div className="challan-modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() =>
                      setShowDetails(
                        false
                      )
                    }
                  >
                    Close
                  </button>

                  <button
                    className="print-button"
                    onClick={() =>
                      window.print()
                    }
                  >
                    🖨 Print Challan
                  </button>

                  {selectedChallan.status ===
                    "Draft" && (
                    <button
                      className="challan-primary-button"
                      onClick={() =>
                        confirmChallan(
                          selectedChallan.id
                        )
                      }
                      disabled={
                        confirmingId !==
                          null
                      }
                    >
                      {confirmingId ===
                      selectedChallan.id
                        ? "Confirming..."
                        : "Confirm Challan"}
                    </button>
                  )}

                </div>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Challans;