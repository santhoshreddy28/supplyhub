import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unit_price: string | number;
  current_stock: number;
  min_stock_alert: number;
  location: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  current_stock: number;
  min_stock_alert: number;
  location: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsResponse {
  data: Product[];
  pagination: Pagination;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  current_stock: string;
  min_stock_alert: string;
  location: string;
}

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unit_price: "",
  current_stock: "",
  min_stock_alert: "",
  location: ""
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] =
    useState<LowStockProduct[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [showEditForm, setShowEditForm] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] =
    useState("");

  const [editingProductId, setEditingProductId] =
    useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const storedUser =
    localStorage.getItem("user");

  let user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }

  const role =
    user?.role?.trim().toLowerCase();

  const canManageProducts =
    role === "admin" ||
    role === "warehouse";

  const fetchProducts = async (
    page = 1,
    searchValue = search
  ) => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        search: searchValue
      });

      const response = await fetch(
        `http://localhost:5000/products?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch products"
        );
      }

      const data: ProductsResponse =
        result;

      setProducts(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error(
        "Products error:",
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

  const fetchLowStockProducts =
    async () => {
      try {
        const token =
          localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/products/alerts/low-stock",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to fetch low stock products"
          );
        }

        setLowStockProducts(
          result.data
        );
      } catch (error) {
        console.error(
          "Low stock error:",
          error
        );
      }
    };

  useEffect(() => {
    fetchProducts(1, "");
    fetchLowStockProducts();
  }, []);

  const handleSearch = (
    value: string
  ) => {
    setSearch(value);
    fetchProducts(1, value);
  };

  const handlePrevious = () => {
    if (pagination.page > 1) {
      fetchProducts(
        pagination.page - 1,
        search
      );
    }
  };

  const handleNext = () => {
    if (
      pagination.page <
      pagination.totalPages
    ) {
      fetchProducts(
        pagination.page + 1,
        search
      );
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFormMessage("");
    setEditingProductId(null);
  };

  const openAddForm = () => {
    if (!canManageProducts) {
      return;
    }

    resetForm();
    setShowEditForm(false);
    setShowDetails(false);
    setShowAddForm(true);
  };

  const openEditForm = (
    product: Product
  ) => {
    if (!canManageProducts) {
      return;
    }

    setForm({
      name: product.name,
      sku: product.sku,
      category:
        product.category || "",
      unit_price: String(
        product.unit_price
      ),
      current_stock: String(
        product.current_stock
      ),
      min_stock_alert: String(
        product.min_stock_alert
      ),
      location:
        product.location || ""
    });

    setEditingProductId(
      product.id
    );

    setFormMessage("");
    setShowAddForm(false);
    setShowDetails(false);
    setShowEditForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetForm();
  };

  const openProductDetails = async (
    product: Product
  ) => {
    setError("");

    setSelectedProduct(product);
    setShowDetails(true);

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/products/${product.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch product details"
        );
      }

      const latestProduct =
        result.product ||
        result.data;

      if (latestProduct) {
        setSelectedProduct(
          latestProduct
        );
      }
    } catch (error) {
      console.error(
        "Product details error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to refresh product details"
      );
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedProduct(null);
  };

  const handleAddProduct = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!canManageProducts) {
      return;
    }

    try {
      setSaving(true);
      setFormMessage("");

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/products",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`
          },
          body: JSON.stringify({
            name: form.name,
            sku: form.sku,
            category:
              form.category || null,
            unit_price:
              Number(form.unit_price),
            current_stock:
              Number(form.current_stock),
            min_stock_alert:
              Number(
                form.min_stock_alert
              ),
            location:
              form.location || null
          })
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create product"
        );
      }

      closeForm();

      await fetchProducts(
        1,
        search
      );

      await fetchLowStockProducts();
    } catch (error) {
      console.error(
        "Create product error:",
        error
      );

      setFormMessage(
        error instanceof Error
          ? error.message
          : "Failed to create product"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (!canManageProducts) {
        return;
      }

      if (!editingProductId) {
        return;
      }

      try {
        setSaving(true);
        setFormMessage("");

        const token =
          localStorage.getItem("token");

        const response = await fetch(
          `http://localhost:5000/products/${editingProductId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`
            },
            body: JSON.stringify({
              name: form.name,
              sku: form.sku,
              category:
                form.category || null,
              unit_price:
                Number(form.unit_price),
              min_stock_alert:
                Number(
                  form.min_stock_alert
                ),
              location:
                form.location || null
            })
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to update product"
          );
        }

        closeForm();

        await fetchProducts(
          pagination.page,
          search
        );

        await fetchLowStockProducts();
      } catch (error) {
        console.error(
          "Update product error:",
          error
        );

        setFormMessage(
          error instanceof Error
            ? error.message
            : "Failed to update product"
        );
      } finally {
        setSaving(false);
      }
    };

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

  return (
    <div className="products-page">

      <div className="products-header">

        <div>
          <h1>Products</h1>

          <p>
            Manage products and inventory
          </p>
        </div>

        {canManageProducts && (
          <button
            className="primary-button"
            onClick={openAddForm}
          >
            + Add Product
          </button>
        )}

      </div>


      <div className="products-toolbar">

        <input
          type="text"
          value={search}
          onChange={(e) =>
            handleSearch(
              e.target.value
            )
          }
          placeholder="Search products..."
          className="search-input"
        />

      </div>


      {lowStockProducts.length > 0 && (

        <div className="low-stock-alert">

          <div className="alert-header">

            <div>
              <h2>
                ⚠️ Low Stock Alerts
              </h2>

              <p>
                {lowStockProducts.length}{" "}
                product
                {lowStockProducts.length !==
                1
                  ? "s"
                  : ""}{" "}
                need attention.
              </p>
            </div>

          </div>


          <div className="low-stock-list">

            {lowStockProducts.map(
              (product) => (

                <div
                  key={product.id}
                  className="low-stock-item"
                >

                  <div>

                    <strong>
                      {product.name}
                    </strong>

                    <span>
                      SKU: {product.sku}
                    </span>

                    {product.location && (
                      <span>
                        Location:{" "}
                        {product.location}
                      </span>
                    )}

                  </div>


                  <div className="low-stock-count">

                    <strong>
                      {product.current_stock}{" "}
                      units
                    </strong>

                    <span>
                      Minimum:{" "}
                      {
                        product.min_stock_alert
                      }
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      )}


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {loading && (
        <div className="loading-box">
          Loading products...
        </div>
      )}


      {!loading && !error && (

        <>

          <div className="products-table-container">

            <table className="products-table">

              <thead>

                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {products.length === 0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="empty-state"
                    >
                      No products found.
                    </td>

                  </tr>

                ) : (

                  products.map(
                    (product) => {

                      const stockStatus =
                        getStockStatus(
                          product
                        );

                      return (

                        <tr
                          key={product.id}
                        >

                          <td className="product-name">
                            {product.name}
                          </td>

                          <td className="sku">
                            {product.sku}
                          </td>

                          <td>
                            {product.category ||
                              "-"}
                          </td>

                          <td className="price">
                            ₹
                            {Number(
                              product.unit_price
                            ).toFixed(2)}
                          </td>

                          <td>

                            <div className="stock-cell">

                              <span>
                                {
                                  product.current_stock
                                }
                              </span>

                              <span
                                className={`stock-badge ${stockStatus.className}`}
                              >
                                {
                                  stockStatus.label
                                }
                              </span>

                            </div>

                          </td>

                          <td>
                            {product.location ||
                              "-"}
                          </td>

                          <td>

                            <div className="action-buttons">

                              <button
                                className="secondary-button"
                                onClick={() =>
                                  openProductDetails(
                                    product
                                  )
                                }
                              >
                                View
                              </button>

                              {canManageProducts && (
                                <button
                                  className="secondary-button"
                                  onClick={() =>
                                    openEditForm(
                                      product
                                    )
                                  }
                                >
                                  Edit
                                </button>
                              )}

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


          <div className="pagination">

            <div className="pagination-info">
              Showing page{" "}
              {pagination.page} of{" "}
              {pagination.totalPages ||
                1}{" "}
              ({pagination.total} products)
            </div>


            <div className="pagination-buttons">

              <button
                className="secondary-button"
                onClick={handlePrevious}
                disabled={
                  pagination.page <= 1
                }
              >
                Previous
              </button>


              <button
                className="primary-button"
                onClick={handleNext}
                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
              >
                Next
              </button>

            </div>

          </div>

        </>

      )}


      {/* PRODUCT DETAILS MODAL */}

      {showDetails &&
        selectedProduct && (

          <div
            className="modal-overlay"
            onClick={(e) => {

              if (
                e.target ===
                e.currentTarget
              ) {
                closeDetails();
              }

            }}
          >

            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <h2>
                    Product Details
                  </h2>

                  <p>
                    Complete product information
                  </p>

                </div>


                <button
                  className="close-button"
                  onClick={closeDetails}
                >
                  ×
                </button>

              </div>


              <div className="details-grid">

                <div>

                  <label>
                    Product Name
                  </label>

                  <strong>
                    {selectedProduct.name}
                  </strong>

                </div>


                <div>

                  <label>
                    SKU
                  </label>

                  <strong>
                    {selectedProduct.sku}
                  </strong>

                </div>


                <div>

                  <label>
                    Category
                  </label>

                  <strong>
                    {selectedProduct.category ||
                      "-"}
                  </strong>

                </div>


                <div>

                  <label>
                    Unit Price
                  </label>

                  <strong>
                    ₹
                    {Number(
                      selectedProduct.unit_price
                    ).toFixed(2)}
                  </strong>

                </div>


                <div>

                  <label>
                    Current Stock
                  </label>

                  <strong>
                    {
                      selectedProduct.current_stock
                    }
                  </strong>

                </div>


                <div>

                  <label>
                    Minimum Stock Alert
                  </label>

                  <strong>
                    {
                      selectedProduct.min_stock_alert
                    }
                  </strong>

                </div>


                <div>

                  <label>
                    Location
                  </label>

                  <strong>
                    {selectedProduct.location ||
                      "-"}
                  </strong>

                </div>


                <div>

                  <label>
                    Stock Status
                  </label>

                  <span
                    className={`stock-badge ${
                      getStockStatus(
                        selectedProduct
                      ).className
                    }`}
                  >
                    {
                      getStockStatus(
                        selectedProduct
                      ).label
                    }
                  </span>

                </div>

              </div>


              <div className="details-footer">

                <div>

                  <label>
                    Created At
                  </label>

                  <span>
                    {selectedProduct.created_at
                      ? new Date(
                          selectedProduct.created_at
                        ).toLocaleString()
                      : "-"}
                  </span>

                </div>


                <div>

                  <label>
                    Updated At
                  </label>

                  <span>
                    {selectedProduct.updated_at
                      ? new Date(
                          selectedProduct.updated_at
                        ).toLocaleString()
                      : "-"}
                  </span>

                </div>

              </div>


              <div className="modal-actions">

                <button
                  className="primary-button"
                  onClick={closeDetails}
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}


      {/* ADD / EDIT MODAL */}

      {(showAddForm ||
        showEditForm) && (

        <div
          className="modal-overlay"
          onClick={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              closeForm();
            }

          }}
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {showEditForm
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  {showEditForm
                    ? "Update product information"
                    : "Create a new product"}
                </p>

              </div>


              <button
                type="button"
                className="close-button"
                onClick={closeForm}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                showEditForm
                  ? handleUpdateProduct
                  : handleAddProduct
              }
              className="product-form"
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Product Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    SKU *
                  </label>

                  <input
                    name="sku"
                    value={form.sku}
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <input
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Unit Price *
                  </label>

                  <input
                    name="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.unit_price
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Current Stock
                  </label>

                  <input
                    name="current_stock"
                    type="number"
                    min="0"
                    value={
                      form.current_stock
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      showEditForm
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Minimum Stock Alert *
                  </label>

                  <input
                    name="min_stock_alert"
                    type="number"
                    min="0"
                    value={
                      form.min_stock_alert
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Location
                </label>

                <input
                  name="location"
                  value={
                    form.location
                  }
                  onChange={
                    handleFormChange
                  }
                />

              </div>


              {formMessage && (
                <div className="form-error">
                  {formMessage}
                </div>
              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : showEditForm
                    ? "Update Product"
                    : "Create Product"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Products;