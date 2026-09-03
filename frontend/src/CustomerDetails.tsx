import { useEffect, useState } from "react";

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
  created_at: string;
  updated_at: string;
}

interface CustomerDetailsProps {
  customerId: string;
  onBack: () => void;
}

function CustomerDetails({
  customerId,
  onBack
}: CustomerDetailsProps) {
  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const token =
          localStorage.getItem("token");

        const response = await fetch(
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

    fetchCustomer();
  }, [customerId]);

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
              {customer.business_name || "-"}
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

    </div>
  );
}

export default CustomerDetails;
