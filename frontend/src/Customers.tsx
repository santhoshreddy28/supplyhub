import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  business_name: string | null;
  gst_number: string | null;
  customer_type: string;
  address: string | null;
  status: string;
  follow_up_date: string | null;
  notes: string | null;
}

interface FollowUp {
  id: string;
  customer_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

interface CustomerForm {
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: string;
  address: string;
  status: string;
  follow_up_date: string;
  notes: string;
}

const emptyForm: CustomerForm = {
  name: "",
  mobile: "",
  email: "",
  business_name: "",
  gst_number: "",
  customer_type: "Retail",
  address: "",
  status: "Lead",
  follow_up_date: "",
  notes: ""
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function getCurrentUser(): User | null {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function Customers() {
  const user = getCurrentUser();

  const role =
    user?.role?.trim().toLowerCase();

  const canManageCustomers =
    role === "admin" ||
    role === "accounts" ||
    role === "sales";

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState<CustomerForm>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [editingCustomerId, setEditingCustomerId] =
    useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string | null>(null);

  const fetchCustomers = async (
    searchValue = ""
  ) => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `/api/customers?search=${encodeURIComponent(
          searchValue
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to fetch customers"
        );
        return;
      }

      setCustomers(data.data);
    } catch {
      setError(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleFormChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
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

  const openAddForm = () => {
    if (!canManageCustomers) {
      return;
    }

    setEditingCustomerId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (
    customer: Customer
  ) => {
    if (!canManageCustomers) {
      return;
    }

    setEditingCustomerId(customer.id);

    setForm({
      name: customer.name || "",
      mobile: customer.mobile || "",
      email: customer.email || "",
      business_name:
        customer.business_name || "",
      gst_number:
        customer.gst_number || "",
      customer_type:
        customer.customer_type ||
        "Retail",
      address:
        customer.address || "",
      status:
        customer.status || "Lead",
      follow_up_date:
        customer.follow_up_date
          ? customer.follow_up_date.substring(
              0,
              10
            )
          : "",
      notes:
        customer.notes || ""
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomerId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    if (!canManageCustomers) {
      return;
    }

    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.mobile.trim()
    ) {
      setError(
        "Name and mobile are required"
      );
      return;
    }

    setSaving(true);

    try {
      const token =
        localStorage.getItem("token");

      const url =
        editingCustomerId
          ? `/api/customers/${editingCustomerId}`
          : "/api/customers";

      const method =
        editingCustomerId
          ? "PUT"
          : "POST";

      const response =
        await fetch(url, {
          method,
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            name: form.name,
            mobile: form.mobile,
            email:
              form.email || null,
            business_name:
              form.business_name ||
              null,
            gst_number:
              form.gst_number ||
              null,
            customer_type:
              form.customer_type,
            address:
              form.address || null,
            status: form.status,
            follow_up_date:
              form.follow_up_date ||
              null,
            notes:
              form.notes || null
          })
        });

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to save customer"
        );
        return;
      }

      setSuccess(
        editingCustomerId
          ? "Customer updated successfully"
          : "Customer created successfully"
      );

      setShowForm(false);
      setEditingCustomerId(null);
      setForm(emptyForm);

      await fetchCustomers(search);
    } catch {
      setError(
        "Unable to connect to server"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        Loading customers...
      </div>
    );
  }

  if (selectedCustomerId) {
    return (
      <CustomerDetails
        customerId={
          selectedCustomerId
        }
        onBack={() =>
          setSelectedCustomerId(null)
        }
      />
    );
  }

  return (
    <div className="customers-page">

      <div className="page-header">

        <div>

          <h1>
            Customers
          </h1>

          <p>
            Manage your CRM customers
          </p>

        </div>

        {canManageCustomers && (
          <button
            className="add-button"
            onClick={openAddForm}
          >
            + Add Customer
          </button>
        )}

      </div>

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="search-container">

        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => {
            const value =
              e.target.value;

            setSearch(value);
            fetchCustomers(value);
          }}
        />

      </div>

      {showForm && (
        <div
          className="customer-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeForm();
            }
          }}
        >

          <div className="customer-modal">

            <div className="form-header">

              <div>

                <h2>
                  {editingCustomerId
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p>
                  {editingCustomerId
                    ? "Update customer information"
                    : "Enter customer information"}
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
              className="customer-form"
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                <div className="form-field">

                  <label>
                    Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Customer name"
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Mobile *
                  </label>

                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Mobile number"
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Email address"
                  />

                </div>

                <div className="form-field">

                  <label>
                    Business Name
                  </label>

                  <input
                    name="business_name"
                    value={
                      form.business_name
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Business name"
                  />

                </div>

                <div className="form-field">

                  <label>
                    GST Number
                  </label>

                  <input
                    name="gst_number"
                    value={
                      form.gst_number
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="GST number"
                  />

                </div>

                <div className="form-field">

                  <label>
                    Customer Type *
                  </label>

                  <select
                    name="customer_type"
                    value={
                      form.customer_type
                    }
                    onChange={
                      handleFormChange
                    }
                  >

                    <option value="Retail">
                      Retail
                    </option>

                    <option value="Wholesale">
                      Wholesale
                    </option>

                    <option value="Distributor">
                      Distributor
                    </option>

                  </select>

                </div>

                <div className="form-field">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={
                      handleFormChange
                    }
                  >

                    <option value="Lead">
                      Lead
                    </option>

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

                <div className="form-field">

                  <label>
                    Follow-up Date
                  </label>

                  <input
                    type="date"
                    name="follow_up_date"
                    value={
                      form.follow_up_date
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>

              </div>

              <div className="form-field">

                <label>
                  Address
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={
                    handleFormChange
                  }
                  placeholder="Customer address"
                  rows={3}
                />

              </div>

              <div className="form-field">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={
                    handleFormChange
                  }
                  placeholder="Additional notes"
                  rows={3}
                />

              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCustomerId
                    ? "Update Customer"
                    : "Save Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      <div className="customer-table-container">

        <table className="customer-table">

          <thead>

            <tr>

              <th>Name</th>

              <th>Business</th>

              <th>Mobile</th>

              <th>Type</th>

              <th>Status</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {customers.length === 0 ? (

              <tr>

                <td colSpan={6}>
                  No customers found
                </td>

              </tr>

            ) : (

              customers.map(
                (customer) => (

                  <tr
                    key={customer.id}
                  >

                    <td>

                      <button
                        className="customer-name-button"
                        onClick={() =>
                          setSelectedCustomerId(
                            customer.id
                          )
                        }
                      >
                        {customer.name}
                      </button>

                    </td>

                    <td>

                      {
                        customer.business_name ||
                        "-"
                      }

                    </td>

                    <td>

                      {customer.mobile}

                    </td>

                    <td>

                      {
                        customer.customer_type
                      }

                    </td>

                    <td>

                      <span
                        className={`status ${customer.status.toLowerCase()}`}
                      >
                        {customer.status}
                      </span>

                    </td>

                    <td>

                      {canManageCustomers && (

                        <button
                          className="edit-button"
                          onClick={() =>
                            openEditForm(
                              customer
                            )
                          }
                        >
                          Edit
                        </button>

                      )}

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}


/* =========================================================
   CUSTOMER DETAILS
   ========================================================= */

interface CustomerDetailsProps {
  customerId: string;
  onBack: () => void;
}

function CustomerDetails({
  customerId,
  onBack
}: CustomerDetailsProps) {

  const user = getCurrentUser();

  const role =
    user?.role?.trim().toLowerCase();

  const canManageCustomers =
    role === "admin" ||
    role === "accounts" ||
    role === "sales";

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [followUps, setFollowUps] =
    useState<FollowUp[]>([]);

  const [followUpNote, setFollowUpNote] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [followUpsLoading, setFollowUpsLoading] =
    useState(true);

  const [savingFollowUp, setSavingFollowUp] =
    useState(false);

  const [showFollowUpForm, setShowFollowUpForm] =
    useState(false);

  const [error, setError] =
    useState("");

  const [followUpError, setFollowUpError] =
    useState("");

  const [followUpSuccess, setFollowUpSuccess] =
    useState("");

  const fetchCustomer = async () => {

    try {

      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `/api/customers/${customerId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setError(
          data.message ||
            "Failed to fetch customer"
        );

        return;
      }

      setCustomer(data.customer);

    } catch {

      setError(
        "Unable to connect to server"
      );

    } finally {

      setLoading(false);

    }
  };

  const fetchFollowUps = async () => {

    try {

      setFollowUpsLoading(true);
      setFollowUpError("");

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `/api/customers/${customerId}/follow-ups`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setFollowUpError(
          data.message ||
            "Failed to fetch follow-ups"
        );

        return;
      }

      setFollowUps(data.data);

    } catch {

      setFollowUpError(
        "Unable to connect to server"
      );

    } finally {

      setFollowUpsLoading(false);

    }
  };

  useEffect(() => {

    fetchCustomer();
    fetchFollowUps();

  }, [customerId]);

  const handleAddFollowUp = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    if (!canManageCustomers) {
      return;
    }

    if (!followUpNote.trim()) {

      setFollowUpError(
        "Follow-up note is required"
      );

      return;
    }

    try {

      setSavingFollowUp(true);
      setFollowUpError("");
      setFollowUpSuccess("");

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `/api/customers/${customerId}/follow-ups`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              note: followUpNote
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setFollowUpError(
          data.message ||
            "Failed to add follow-up"
        );

        return;
      }

      setFollowUpNote("");
      setShowFollowUpForm(false);

      setFollowUpSuccess(
        "Follow-up note added successfully"
      );

      await fetchFollowUps();

    } catch {

      setFollowUpError(
        "Unable to connect to server"
      );

    } finally {

      setSavingFollowUp(false);

    }
  };

  if (loading) {

    return (
      <div className="page-loading">
        Loading customer...
      </div>
    );

  }

  if (error) {

    return (
      <div className="customers-page">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Customers
        </button>

        <div className="error-message">
          {error}
        </div>

      </div>
    );

  }

  if (!customer) {

    return (
      <div className="customers-page">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Customers
        </button>

        <div className="error-message">
          Customer not found
        </div>

      </div>
    );

  }

  return (
    <div className="customers-page">

      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Customers
      </button>

      <div className="customer-detail-header">

        <div>

          <h1>
            {customer.name}
          </h1>

          <p>
            {customer.business_name ||
              "Customer Details"}
          </p>

        </div>

        <span
          className={`status ${customer.status.toLowerCase()}`}
        >
          {customer.status}
        </span>

      </div>

      <div className="customer-details-grid">

        <div className="detail-card">

          <h2>
            Contact Information
          </h2>

          <div className="detail-row">

            <span>
              Mobile
            </span>

            <strong>
              {customer.mobile}
            </strong>

          </div>

          <div className="detail-row">

            <span>
              Email
            </span>

            <strong>
              {customer.email || "-"}
            </strong>

          </div>

        </div>

        <div className="detail-card">

          <h2>
            Business Information
          </h2>

          <div className="detail-row">

            <span>
              Business Name
            </span>

            <strong>
              {
                customer.business_name ||
                "-"
              }
            </strong>

          </div>

          <div className="detail-row">

            <span>
              Customer Type
            </span>

            <strong>
              {customer.customer_type}
            </strong>

          </div>

          <div className="detail-row">

            <span>
              GST Number
            </span>

            <strong>
              {customer.gst_number || "-"}
            </strong>

          </div>

        </div>

        <div className="detail-card">

          <h2>
            Address
          </h2>

          <p className="detail-text">
            {customer.address ||
              "No address provided"}
          </p>

        </div>

        <div className="detail-card">

          <h2>
            Follow-up
          </h2>

          <div className="detail-row">

            <span>
              Next Follow-up
            </span>

            <strong>
              {customer.follow_up_date
                ? new Date(
                    customer.follow_up_date
                  ).toLocaleDateString()
                : "-"}
            </strong>

          </div>

        </div>

        <div className="detail-card">

          <h2>
            Notes
          </h2>

          <p className="detail-text">
            {customer.notes ||
              "No notes available"}
          </p>

        </div>

      </div>

      <div className="follow-up-section">

        <div className="follow-up-header">

          <div>

            <h2>
              Follow-up History
            </h2>

            <p>
              Track communication and
              follow-up activity.
            </p>

          </div>

          {canManageCustomers && (

            <button
              className="add-button"
              onClick={() => {

                setShowFollowUpForm(
                  !showFollowUpForm
                );

                setFollowUpError("");
                setFollowUpSuccess("");

              }}
            >
              + Add Follow-up
            </button>

          )}

        </div>

        {followUpSuccess && (

          <div className="success-message">
            {followUpSuccess}
          </div>

        )}

        {followUpError && (

          <div className="error-message">
            {followUpError}
          </div>

        )}

        {showFollowUpForm && (

          <form
            className="follow-up-form"
            onSubmit={
              handleAddFollowUp
            }
          >

            <div className="form-field">

              <label>
                Follow-up Note *
              </label>

              <textarea
                value={followUpNote}
                onChange={(e) =>
                  setFollowUpNote(
                    e.target.value
                  )
                }
                placeholder="Enter follow-up details..."
                rows={4}
                required
              />

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() => {

                  setShowFollowUpForm(
                    false
                  );

                  setFollowUpNote("");
                  setFollowUpError("");

                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-button"
                disabled={
                  savingFollowUp
                }
              >
                {savingFollowUp
                  ? "Adding..."
                  : "Add Follow-up"}
              </button>

            </div>

          </form>

        )}

        <div className="follow-up-list">

          {followUpsLoading ? (

            <p>
              Loading follow-ups...
            </p>

          ) : followUps.length === 0 ? (

            <div className="empty-follow-ups">
              No follow-up notes yet.
            </div>

          ) : (

            followUps.map(
              (followUp) => (

                <div
                  className="follow-up-card"
                  key={followUp.id}
                >

                  <div className="follow-up-card-header">

                    <strong>
                      Follow-up
                    </strong>

                    <span>
                      {new Date(
                        followUp.created_at
                      ).toLocaleString()}
                    </span>

                  </div>

                  <p>
                    {followUp.note}
                  </p>

                </div>

              )
            )

          )}

        </div>

      </div>

    </div>
  );
}

export default Customers;
