import {
  useEffect,
  useState
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Invoice {
  id: string;
  invoice_number: string;
  challan_id: string;
  customer_id: string;
  customer_name: string | null;
  business_name: string | null;
  customer_email?: string | null;
  customer_mobile?: string | null;
  subtotal: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  status: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface InvoiceItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: string | number;
  quantity: number;
  line_total: string | number;
}

interface InvoiceDetails extends Invoice {
  items: InvoiceItem[];
}

interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name: string;
  business_name: string;
  total_quantity: number;
  status: string;
  created_at: string;
}

const API_URL = "http://localhost:5000";

function money(value: string | number) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function safeFileName(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingChallans, setLoadingChallans] =
    useState(false);

  const [generatingId, setGeneratingId] =
    useState<string | null>(null);

  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceDetails | null>(null);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showFilenameDialog, setShowFilenameDialog] =
    useState(false);

  const [filename, setFilename] = useState("");

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/invoices`,
        {
          headers
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch invoices"
        );
      }

      setInvoices(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch invoices"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchChallans = async () => {
    try {
      setLoadingChallans(true);

      const response = await fetch(
        `${API_URL}/challans`,
        {
          headers
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch challans"
        );
      }

      const list = Array.isArray(result)
        ? result
        : result.data || [];

      setChallans(list);
    } catch (err) {
      console.error(
        "Challan fetch error:",
        err
      );
    } finally {
      setLoadingChallans(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchChallans();
  }, []);

  const viewInvoice = async (
    invoiceId: string
  ) => {
    try {
      setLoadingDetails(true);
      setError("");

      const response = await fetch(
        `${API_URL}/invoices/${invoiceId}`,
        {
          headers
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load invoice"
        );
      }

      setSelectedInvoice(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load invoice"
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const generateInvoice = async (
    challanId: string
  ) => {
    try {
      setGeneratingId(challanId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/invoices/from-challan/${challanId}`,
        {
          method: "POST",
          headers
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setMessage(
            `${
              result.invoiceNumber ||
              "Invoice"
            } already exists for this challan.`
          );
        } else {
          throw new Error(
            result.message ||
              "Failed to create invoice"
          );
        }

        await fetchInvoices();
        return;
      }

      setMessage(
        `Invoice ${result.invoiceNumber} created successfully.`
      );

      await fetchInvoices();
      await fetchChallans();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create invoice"
      );
    } finally {
      setGeneratingId(null);
    }
  };

  /*
   * PRINT INVOICE
   */

  const printInvoice = (
    invoice: InvoiceDetails
  ) => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=800"
    );

    if (!printWindow) {
      setError(
        "Please allow popups to print the invoice."
      );
      return;
    }

    const rows = invoice.items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>
                ${item.product_name_snapshot}
              </strong>
              <div class="sku">
                SKU: ${item.sku_snapshot}
              </div>
            </td>
            <td>${item.quantity}</td>
            <td>
              ₹${money(
                item.unit_price_snapshot
              )}
            </td>
            <td>
              ₹${money(
                item.line_total
              )}
            </td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

        <title>
          ${invoice.invoice_number}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
            color: #172033;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .invoice {
            width: 100%;
            max-width: 800px;
            margin: auto;
            position: relative;
            overflow: hidden;
          }

          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform:
              translate(-50%, -50%)
              rotate(-25deg);

            font-size: 95px;
            font-weight: 900;
            letter-spacing: 8px;

            color: #172033;
            opacity: 0.09;

            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
          }

          .content {
            position: relative;
            z-index: 2;
          }

          .header {
            display: flex;
            justify-content:
              space-between;
            align-items:
              flex-start;

            padding-bottom: 24px;

            border-bottom:
              2px solid #172033;
          }

          .brand {
            font-size: 30px;
            font-weight: 900;
            color: #172033;
          }

          .brand-subtitle {
            margin-top: 5px;
            color: #64748b;
            font-size: 12px;
          }

          .invoice-title {
            text-align: right;
          }

          .invoice-title h1 {
            margin: 0;
            font-size: 32px;
            letter-spacing: 1px;
          }

          .invoice-title p {
            margin: 5px 0;
            color: #64748b;
            font-size: 12px;
          }

          .details {
            display: grid;
            grid-template-columns:
              1fr 1fr;

            gap: 25px;

            margin: 28px 0;
          }

          .details-box {
            padding: 16px;
            background: #f8fafc;
            border:
              1px solid #e2e8f0;

            border-radius: 8px;
          }

          .details-title {
            font-size: 10px;
            text-transform:
              uppercase;

            letter-spacing: 1px;

            color: #64748b;

            margin-bottom: 7px;
          }

          .details-box strong {
            font-size: 15px;
          }

          .details-box div {
            margin-top: 4px;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse:
              collapse;

            margin-top: 20px;
          }

          th {
            background: #172033;
            color: white;

            padding: 11px;

            text-align: left;

            font-size: 10px;
            text-transform:
              uppercase;
          }

          td {
            padding: 12px 10px;

            border-bottom:
              1px solid #e2e8f0;

            font-size: 12px;
          }

          .sku {
            color: #64748b;
            font-size: 9px;
            margin-top: 3px;
          }

          .totals {
            width: 300px;

            margin-left:
              auto;

            margin-top: 25px;
          }

          .total-row {
            display: flex;
            justify-content:
              space-between;

            padding: 7px 0;

            font-size: 13px;
          }

          .grand-total {
            display: flex;
            justify-content:
              space-between;

            margin-top: 7px;

            padding-top: 12px;

            border-top:
              2px solid #172033;

            font-size: 18px;

            font-weight: 900;
          }

          .footer {
            margin-top: 55px;

            padding-top: 18px;

            border-top:
              1px solid #e2e8f0;

            text-align: center;

            color: #64748b;

            font-size: 10px;
          }

          .footer-brand {
            font-size: 13px;
            font-weight: 800;
            color: #172033;
            margin-bottom: 4px;
          }

        </style>

      </head>

      <body>

        <div class="invoice">

          <div class="watermark">
            SUPPLYHUB
          </div>

          <div class="content">

            <div class="header">

              <div>

                <div class="brand">
                  SupplyHub
                </div>

                <div class="brand-subtitle">
                  Business Management
                </div>

              </div>

              <div class="invoice-title">

                <h1>
                  INVOICE
                </h1>

                <p>
                  ${
                    invoice.invoice_number
                  }
                </p>

                <p>
                  ${new Date(
                    invoice.created_at
                  ).toLocaleDateString(
                    "en-IN"
                  )}
                </p>

              </div>

            </div>

            <div class="details">

              <div class="details-box">

                <div class="details-title">
                  Bill To
                </div>

                <strong>
                  ${
                    invoice.customer_name ||
                    "-"
                  }
                </strong>

                <div>
                  ${
                    invoice.business_name ||
                    ""
                  }
                </div>

                ${
                  invoice.customer_mobile
                    ? `
                      <div>
                        ${
                          invoice.customer_mobile
                        }
                      </div>
                    `
                    : ""
                }

                ${
                  invoice.customer_email
                    ? `
                      <div>
                        ${
                          invoice.customer_email
                        }
                      </div>
                    `
                    : ""
                }

              </div>

              <div class="details-box">

                <div class="details-title">
                  Reference
                </div>

                <strong>
                  Challan
                </strong>

                <div>
                  ${
                    invoice.challan_id
                  }
                </div>

                <div>
                  Status:
                  <strong>
                    ${
                      invoice.status
                    }
                  </strong>
                </div>

              </div>

            </div>

            <table>

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Product
                  </th>

                  <th>
                    Qty
                  </th>

                  <th>
                    Unit Price
                  </th>

                  <th>
                    Total
                  </th>

                </tr>

              </thead>

              <tbody>

                ${rows}

              </tbody>

            </table>

            <div class="totals">

              <div class="total-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  ₹${money(
                    invoice.subtotal
                  )}
                </strong>

              </div>

              <div class="total-row">

                <span>
                  GST (18%)
                </span>

                <strong>
                  ₹${money(
                    invoice.tax_amount
                  )}
                </strong>

              </div>

              <div class="grand-total">

                <span>
                  Total
                </span>

                <strong>
                  ₹${money(
                    invoice.total_amount
                  )}
                </strong>

              </div>

            </div>

            <div class="footer">

              <div class="footer-brand">
                SupplyHub
              </div>

              Thank you for your business.

            </div>

          </div>

        </div>

        <script>

          window.onload = function() {

            setTimeout(
              function() {
                window.print();
              },
              300
            );

          };

        </script>

      </body>

      </html>
    `);

    printWindow.document.close();
  };

  /*
   * DIRECT PDF GENERATION
   */

  const createPDF = (
    invoice: InvoiceDetails,
    requestedFilename: string
  ) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    /*
     * WATERMARK
     */

    doc.saveGraphicsState();

    doc.setTextColor(
      23,
      32,
      51
    );

    doc.setGState(
      new (
        doc as any
      ).GState({
        opacity: 0.09
      })
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(52);

    doc.text(
      "SUPPLYHUB",
      pageWidth / 2,
      pageHeight / 2,
      {
        align: "center",
        angle: 25
      }
    );

    doc.restoreGraphicsState();

    /*
     * HEADER
     */

    doc.setTextColor(
      23,
      32,
      51
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(25);

    doc.text(
      "SupplyHub",
      15,
      22
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.setTextColor(
      100,
      116,
      139
    );

    doc.text(
      "Business Management",
      15,
      28
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(25);

    doc.setTextColor(
      23,
      32,
      51
    );

    doc.text(
      "INVOICE",
      pageWidth - 15,
      22,
      {
        align: "right"
      }
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.setTextColor(
      100,
      116,
      139
    );

    doc.text(
      invoice.invoice_number,
      pageWidth - 15,
      29,
      {
        align: "right"
      }
    );

    doc.text(
      new Date(
        invoice.created_at
      ).toLocaleDateString(
        "en-IN"
      ),
      pageWidth - 15,
      35,
      {
        align: "right"
      }
    );

    doc.setDrawColor(
      23,
      32,
      51
    );

    doc.setLineWidth(
      0.7
    );

    doc.line(
      15,
      41,
      pageWidth - 15,
      41
    );

    /*
     * CUSTOMER INFORMATION
     */

    doc.setFillColor(
      248,
      250,
      252
    );

    doc.roundedRect(
      15,
      50,
      85,
      39,
      3,
      3,
      "F"
    );

    doc.roundedRect(
      110,
      50,
      85,
      39,
      3,
      3,
      "F"
    );

    doc.setFontSize(8);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setTextColor(
      100,
      116,
      139
    );

    doc.text(
      "BILL TO",
      20,
      58
    );

    doc.text(
      "REFERENCE",
      115,
      58
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.setTextColor(
      23,
      32,
      51
    );

    doc.text(
      invoice.customer_name ||
        "-",
      20,
      66
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    let customerY = 72;

    if (
      invoice.business_name
    ) {
      doc.text(
        invoice.business_name,
        20,
        customerY
      );

      customerY += 5;
    }

    if (
      invoice.customer_mobile
    ) {
      doc.text(
        invoice.customer_mobile,
        20,
        customerY
      );

      customerY += 5;
    }

    if (
      invoice.customer_email
    ) {
      doc.text(
        invoice.customer_email,
        20,
        customerY
      );
    }

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(10);

    doc.text(
      "Challan",
      115,
      66
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    const challanText =
      invoice.challan_id;

    const challanLines =
      doc.splitTextToSize(
        challanText,
        75
      );

    doc.text(
      challanLines,
      115,
      72
    );

    doc.text(
      `Status: ${invoice.status}`,
      115,
      83
    );

    /*
     * ITEMS
     */

    const tableRows =
      invoice.items.map(
        (item, index) => [
          String(index + 1),
          `${item.product_name_snapshot}\nSKU: ${item.sku_snapshot}`,
          String(item.quantity),
          `Rs. ${money(
            item.unit_price_snapshot
          )}`,
          `Rs. ${money(
            item.line_total
          )}`
        ]
      );

    autoTable(
      doc,
      {
        startY: 98,

        head: [
          [
            "#",
            "Product",
            "Qty",
            "Unit Price",
            "Total"
          ]
        ],

        body: tableRows,

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 4,
          textColor: [
            51,
            65,
            85
          ],
          lineColor: [
            226,
            232,
            240
          ],
          lineWidth: 0.2
        },

        headStyles: {
          fillColor: [
            23,
            32,
            51
          ],
          textColor: [
            255,
            255,
            255
          ],
          fontStyle:
            "bold"
        },

        columnStyles: {
          0: {
            cellWidth: 10
          },

          1: {
            cellWidth: 75
          },

          2: {
            cellWidth: 18,
            halign: "center"
          },

          3: {
            cellWidth: 35,
            halign: "right"
          },

          4: {
            cellWidth: 35,
            halign: "right"
          }
        }
      }
    );

    /*
     * TOTALS
     */

    const finalY =
      (
        doc as any
      ).lastAutoTable.finalY +
      12;

    const totalsX =
      pageWidth - 80;

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.setTextColor(
      71,
      85,
      105
    );

    doc.text(
      "Subtotal",
      totalsX,
      finalY
    );

    doc.text(
      `Rs. ${money(
        invoice.subtotal
      )}`,
      pageWidth - 15,
      finalY,
      {
        align: "right"
      }
    );

    doc.text(
      "GST (18%)",
      totalsX,
      finalY + 7
    );

    doc.text(
      `Rs. ${money(
        invoice.tax_amount
      )}`,
      pageWidth - 15,
      finalY + 7,
      {
        align: "right"
      }
    );

    doc.setDrawColor(
      23,
      32,
      51
    );

    doc.setLineWidth(
      0.5
    );

    doc.line(
      totalsX,
      finalY + 12,
      pageWidth - 15,
      finalY + 12
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(14);

    doc.setTextColor(
      23,
      32,
      51
    );

    doc.text(
      "Total",
      totalsX,
      finalY + 21
    );

    doc.text(
      `Rs. ${money(
        invoice.total_amount
      )}`,
      pageWidth - 15,
      finalY + 21,
      {
        align: "right"
      }
    );

    /*
     * FOOTER
     */

    doc.setDrawColor(
      226,
      232,
      240
    );

    doc.setLineWidth(
      0.3
    );

    doc.line(
      15,
      pageHeight - 28,
      pageWidth - 15,
      pageHeight - 28
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(9);

    doc.setTextColor(
      23,
      32,
      51
    );

    doc.text(
      "SupplyHub",
      pageWidth / 2,
      pageHeight - 20,
      {
        align: "center"
      }
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      100,
      116,
      139
    );

    doc.text(
      "Thank you for your business.",
      pageWidth / 2,
      pageHeight - 15,
      {
        align: "center"
      }
    );

    /*
     * DOWNLOAD
     */

    let finalFilename =
      safeFileName(
        requestedFilename
      );

    if (!finalFilename) {
      finalFilename =
        invoice.invoice_number;
    }

    if (
      finalFilename
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      finalFilename =
        finalFilename.slice(
          0,
          -4
        );
    }

    doc.save(
      `${finalFilename}.pdf`
    );
  };

  /*
   * OPEN PDF FILENAME DIALOG
   */

  const openDownloadDialog = (
    invoice: InvoiceDetails
  ) => {
    setSelectedInvoice(
      invoice
    );

    setFilename(
      invoice.invoice_number
    );

    setShowFilenameDialog(
      true
    );
  };

  /*
   * DOWNLOAD
   */

  const downloadPDF = () => {
    if (!selectedInvoice) {
      return;
    }

    createPDF(
      selectedInvoice,
      filename
    );

    setShowFilenameDialog(
      false
    );
  };

  /*
   * FILTER
   */

  const filteredInvoices =
    invoices.filter(
      (invoice) => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        return [
          invoice.invoice_number,
          invoice.customer_name ||
            "",
          invoice.business_name ||
            "",
          invoice.status
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      }
    );

  const totalValue =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.total_amount
        ),
      0
    );

  const issuedCount =
    invoices.filter(
      (invoice) =>
        invoice.status ===
        "Issued"
    ).length;

  const confirmedChallans =
    challans.filter(
      (challan) =>
        challan.status ===
        "Confirmed"
    );

  return (
    <div className="invoice-page">

      <style>{`

        .invoice-page {
          padding: 32px;
          background: #f8fafc;
          min-height:
            calc(100vh - 68px);
        }

        .invoice-header {
          display: flex;
          justify-content:
            space-between;
          align-items:
            flex-start;
          gap: 20px;
          margin-bottom: 28px;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          color: #64748b;
          margin-bottom: 8px;
        }

        .invoice-header h1 {
          margin: 0;
          color: #172033;
          font-size: 32px;
        }

        .invoice-header p {
          margin: 8px 0 0;
          color: #64748b;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .button {
          border: none;
          border-radius: 9px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .button-primary {
          background: #172033;
          color: white;
        }

        .button-light {
          background: white;
          color: #172033;
          border:
            1px solid #dbe2ea;
        }

        .button:hover {
          opacity: .9;
        }

        .button:disabled {
          opacity: .55;
          cursor:
            not-allowed;
        }

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .summary-card {
          background: white;
          border:
            1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
        }

        .summary-card span {
          display: block;
          color: #64748b;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .summary-card strong {
          color: #172033;
          font-size: 25px;
        }

        .alert {
          padding: 13px 16px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 14px;
        }

        .alert-success {
          background: #ecfdf5;
          color: #047857;
          border:
            1px solid #a7f3d0;
        }

        .alert-error {
          background: #fef2f2;
          color: #b91c1c;
          border:
            1px solid #fecaca;
        }

        .panel {
          background: white;
          border:
            1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .panel-header {
          display: flex;
          justify-content:
            space-between;
          align-items:
            center;
          gap: 20px;
          padding: 20px;
          border-bottom:
            1px solid #e2e8f0;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 18px;
          color: #172033;
        }

        .panel-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .search {
          width: 270px;
          border:
            1px solid #dbe2ea;
          border-radius: 8px;
          padding: 10px 12px;
          outline: none;
        }

        .table-wrap {
          overflow-x: auto;
        }

        .invoice-table {
          width: 100%;
          border-collapse:
            collapse;
        }

        .invoice-table th {
          text-align: left;
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          text-transform:
            uppercase;
          letter-spacing: .04em;
          padding: 13px 16px;
          white-space: nowrap;
        }

        .invoice-table td {
          padding: 15px 16px;
          border-top:
            1px solid #eef2f7;
          color: #334155;
          font-size: 13px;
          white-space: nowrap;
        }

        .invoice-table tbody tr:hover {
          background: #f8fafc;
        }

        .customer strong {
          display: block;
          color: #172033;
        }

        .customer span {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          margin-top: 3px;
        }

        .status {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          font-size: 11px;
          font-weight: 700;
        }

        .actions {
          display: flex;
          gap: 7px;
        }

        .action-button {
          border:
            1px solid #dbe2ea;
          background: white;
          color: #172033;
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .action-button:hover {
          background: #f1f5f9;
        }

        .empty {
          padding: 55px 20px;
          text-align: center;
          color: #64748b;
        }

        .challan-row {
          display: flex;
          align-items:
            center;
          justify-content:
            space-between;
          gap: 20px;
          padding: 15px 20px;
          border-top:
            1px solid #eef2f7;
        }

        .challan-info strong {
          color: #172033;
        }

        .challan-info span {
          display: block;
          color: #64748b;
          font-size: 12px;
          margin-top: 4px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background:
            rgba(15,23,42,.55);
          display: flex;
          align-items:
            center;
          justify-content:
            center;
          padding: 25px;
          z-index: 1000;
        }

        .modal {
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          box-shadow:
            0 30px 80px
            rgba(15,23,42,.25);
        }

        .modal-header {
          display: flex;
          justify-content:
            space-between;
          align-items:
            flex-start;
          padding: 24px;
          border-bottom:
            1px solid #e2e8f0;
        }

        .modal-header h2 {
          margin: 0;
          color: #172033;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .close-button {
          border: none;
          background: #f1f5f9;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
        }

        .modal-body {
          padding: 24px;
        }

        .customer-box {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }

        .info-box {
          padding: 16px;
          background: #f8fafc;
          border-radius: 10px;
        }

        .info-box label {
          display: block;
          color: #64748b;
          font-size: 11px;
          text-transform:
            uppercase;
          margin-bottom: 6px;
        }

        .info-box strong {
          color: #172033;
        }

        .detail-table {
          width: 100%;
          border-collapse:
            collapse;
        }

        .detail-table th,
        .detail-table td {
          padding: 11px;
          border-bottom:
            1px solid #e2e8f0;
          text-align: left;
          font-size: 13px;
        }

        .detail-table th {
          color: #64748b;
          background: #f8fafc;
          font-size: 11px;
          text-transform:
            uppercase;
        }

        .modal-total {
          margin-left: auto;
          width: 300px;
          margin-top: 22px;
        }

        .modal-total-row {
          display: flex;
          justify-content:
            space-between;
          padding: 7px 0;
          color: #475569;
        }

        .modal-total-grand {
          display: flex;
          justify-content:
            space-between;
          border-top:
            2px solid #172033;
          padding-top: 12px;
          margin-top: 6px;
          font-size: 18px;
          font-weight: 800;
          color: #172033;
        }

        .modal-footer {
          padding: 18px 24px;
          border-top:
            1px solid #e2e8f0;
          display: flex;
          justify-content:
            flex-end;
          gap: 10px;
        }

        .loading {
          padding: 45px;
          text-align: center;
          color: #64748b;
        }

        .filename-overlay {
          position: fixed;
          inset: 0;
          background:
            rgba(15,23,42,.65);
          display: flex;
          align-items:
            center;
          justify-content:
            center;
          z-index: 2000;
          padding: 20px;
        }

        .filename-modal {
          width: 100%;
          max-width: 470px;
          background: white;
          border-radius: 16px;
          padding: 28px;
          box-shadow:
            0 30px 80px
            rgba(15,23,42,.3);
        }

        .filename-modal h2 {
          margin: 0 0 8px;
          color: #172033;
        }

        .filename-modal p {
          margin: 0 0 20px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .filename-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 7px;
        }

        .filename-input {
          width: 100%;
          padding: 12px 13px;
          border:
            1px solid #cbd5e1;
          border-radius: 9px;
          outline: none;
          font-size: 14px;
          color: #172033;
          box-sizing:
            border-box;
        }

        .filename-input:focus {
          border-color:
            #172033;
        }

        .filename-extension {
          margin-top: 7px;
          font-size: 11px;
          color: #94a3b8;
        }

        .filename-actions {
          display: flex;
          justify-content:
            flex-end;
          gap: 10px;
          margin-top: 24px;
        }

        @media (max-width: 800px) {

          .invoice-page {
            padding: 18px;
          }

          .summary-grid {
            grid-template-columns:
              1fr;
          }

          .invoice-header {
            flex-direction:
              column;
          }

          .panel-header {
            flex-direction:
              column;
            align-items:
              stretch;
          }

          .search {
            width: 100%;
          }

          .customer-box {
            grid-template-columns:
              1fr;
          }

          .challan-row {
            flex-direction:
              column;
            align-items:
              flex-start;
          }

        }

      `}</style>

      <div className="invoice-header">

        <div>

          <div className="eyebrow">
            BILLING MANAGEMENT
          </div>

          <h1>
            Invoices
          </h1>

          <p>
            Create, review and print
            customer invoices.
          </p>

        </div>

        <div className="header-actions">

          <button
            className="button button-light"
            onClick={() => {
              fetchInvoices();
              fetchChallans();
            }}
            disabled={
              loading ||
              loadingChallans
            }
          >
            ↻ Refresh
          </button>

        </div>

      </div>

      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="summary-grid">

        <div className="summary-card">

          <span>
            Total Invoices
          </span>

          <strong>
            {invoices.length}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            Issued
          </span>

          <strong>
            {issuedCount}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            Total Value
          </span>

          <strong>
            ₹{money(totalValue)}
          </strong>

        </div>

      </div>

      <div className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Invoice History
            </h2>

            <p>
              View, print and download
              generated invoices.
            </p>

          </div>

          <input
            className="search"
            type="search"
            placeholder=
              "Search invoice or customer..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {loading ? (

          <div className="loading">
            Loading invoices...
          </div>

        ) : filteredInvoices.length ===
          0 ? (

          <div className="empty">
            No invoices found.
          </div>

        ) : (

          <div className="table-wrap">

            <table className="invoice-table">

              <thead>

                <tr>

                  <th>
                    Invoice
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Challan
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Subtotal
                  </th>

                  <th>
                    Tax
                  </th>

                  <th>
                    Total
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

                {filteredInvoices.map(
                  (invoice) => (

                    <tr
                      key={
                        invoice.id
                      }
                    >

                      <td>
                        <strong>
                          {
                            invoice.invoice_number
                          }
                        </strong>
                      </td>

                      <td>

                        <div className="customer">

                          <strong>
                            {
                              invoice.customer_name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              invoice.business_name ||
                              ""
                            }
                          </span>

                        </div>

                      </td>

                      <td>
                        {
                          invoice.challan_id.slice(
                            0,
                            8
                          )
                        }
                        ...
                      </td>

                      <td>
                        {new Date(
                          invoice.created_at
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        ₹
                        {money(
                          invoice.subtotal
                        )}
                      </td>

                      <td>
                        ₹
                        {money(
                          invoice.tax_amount
                        )}
                      </td>

                      <td>

                        <strong>
                          ₹
                          {money(
                            invoice.total_amount
                          )}
                        </strong>

                      </td>

                      <td>

                        <span className="status">
                          {
                            invoice.status
                          }
                        </span>

                      </td>

                      <td>

                        <div className="actions">

                          <button
                            className="action-button"
                            onClick={() =>
                              viewInvoice(
                                invoice.id
                              )
                            }
                          >
                            View
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      <div className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Confirmed Challans
            </h2>

            <p>
              Generate invoices from
              confirmed delivery challans.
            </p>

          </div>

        </div>

        {loadingChallans ? (

          <div className="loading">
            Loading confirmed
            challans...
          </div>

        ) : confirmedChallans.length ===
          0 ? (

          <div className="empty">
            No confirmed challans
            waiting for invoicing.
          </div>

        ) : (

          confirmedChallans.map(
            (challan) => (

              <div
                className="challan-row"
                key={
                  challan.id
                }
              >

                <div className="challan-info">

                  <strong>
                    {
                      challan.challan_number
                    }
                  </strong>

                  <span>
                    {
                      challan.customer_name
                    }
                    {" • "}
                    {
                      challan.total_quantity
                    } items
                  </span>

                </div>

                <button
                  className=
                    "button button-primary"
                  onClick={() =>
                    generateInvoice(
                      challan.id
                    )
                  }
                  disabled={
                    generatingId ===
                    challan.id
                  }
                >
                  {
                    generatingId ===
                    challan.id
                      ? "Generating..."
                      : "Generate Invoice"
                  }
                </button>

              </div>

            )
          )

        )}

      </div>

      {selectedInvoice && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedInvoice(
              null
            )
          }
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
                  {
                    selectedInvoice.invoice_number
                  }
                </h2>

                <p>
                  Invoice details
                </p>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedInvoice(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            {loadingDetails ? (

              <div className="loading">
                Loading invoice...
              </div>

            ) : (

              <>

                <div className="modal-body">

                  <div className="customer-box">

                    <div className="info-box">

                      <label>
                        Customer
                      </label>

                      <strong>
                        {
                          selectedInvoice.customer_name ||
                          "-"
                        }
                      </strong>

                      <div>
                        {
                          selectedInvoice.business_name ||
                          ""
                        }
                      </div>

                      {selectedInvoice.customer_mobile && (
                        <div>
                          {
                            selectedInvoice.customer_mobile
                          }
                        </div>
                      )}

                      {selectedInvoice.customer_email && (
                        <div>
                          {
                            selectedInvoice.customer_email
                          }
                        </div>
                      )}

                    </div>

                    <div className="info-box">

                      <label>
                        Reference
                      </label>

                      <strong>
                        Challan
                      </strong>

                      <div>
                        {
                          selectedInvoice.challan_id
                        }
                      </div>

                      <div
                        style={{
                          marginTop: 8
                        }}
                      >
                        Status:{" "}
                        <strong>
                          {
                            selectedInvoice.status
                          }
                        </strong>
                      </div>

                    </div>

                  </div>

                  <table className="detail-table">

                    <thead>

                      <tr>

                        <th>
                          Product
                        </th>

                        <th>
                          SKU
                        </th>

                        <th>
                          Qty
                        </th>

                        <th>
                          Unit Price
                        </th>

                        <th>
                          Total
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {selectedInvoice.items.map(
                        (item) => (

                          <tr
                            key={
                              item.id
                            }
                          >

                            <td>
                              {
                                item.product_name_snapshot
                              }
                            </td>

                            <td>
                              {
                                item.sku_snapshot
                              }
                            </td>

                            <td>
                              {
                                item.quantity
                              }
                            </td>

                            <td>
                              ₹
                              {money(
                                item.unit_price_snapshot
                              )}
                            </td>

                            <td>
                              ₹
                              {money(
                                item.line_total
                              )}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                  <div className="modal-total">

                    <div className="modal-total-row">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        ₹
                        {money(
                          selectedInvoice.subtotal
                        )}
                      </strong>

                    </div>

                    <div className="modal-total-row">

                      <span>
                        GST (18%)
                      </span>

                      <strong>
                        ₹
                        {money(
                          selectedInvoice.tax_amount
                        )}
                      </strong>

                    </div>

                    <div className="modal-total-grand">

                      <span>
                        Total
                      </span>

                      <strong>
                        ₹
                        {money(
                          selectedInvoice.total_amount
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    className="button button-light"
                    onClick={() =>
                      setSelectedInvoice(
                        null
                      )
                    }
                  >
                    Close
                  </button>

                  <button
                    className="button button-light"
                    onClick={() =>
                      printInvoice(
                        selectedInvoice
                      )
                    }
                  >
                    🖨 Print
                  </button>

                  <button
                    className=
                      "button button-primary"
                    onClick={() =>
                      openDownloadDialog(
                        selectedInvoice
                      )
                    }
                  >
                    ↓ Download PDF
                  </button>

                </div>

              </>

            )}

          </div>

        </div>
      )}

      {showFilenameDialog &&
        selectedInvoice && (

          <div
            className=
              "filename-overlay"
            onClick={() =>
              setShowFilenameDialog(
                false
              )
            }
          >

            <div
              className=
                "filename-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <h2>
                Download Invoice PDF
              </h2>

              <p>
                Choose the filename for
                your invoice PDF. The
                default filename is the
                invoice number.
              </p>

              <label
                className=
                  "filename-label"
              >
                File name
              </label>

              <input
                className=
                  "filename-input"
                autoFocus
                value={filename}
                onChange={(e) =>
                  setFilename(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    downloadPDF();
                  }
                }}
              />

              <div
                className=
                  "filename-extension"
              >
                .pdf will be added
                automatically
              </div>

              <div
                className=
                  "filename-actions"
              >

                <button
                  className=
                    "button button-light"
                  onClick={() =>
                    setShowFilenameDialog(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className=
                    "button button-primary"
                  onClick={
                    downloadPDF
                  }
                >
                  Download PDF
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

export default Invoices;