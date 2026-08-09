import { Response } from "express";
import { sql } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const getInvoices = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const invoices = await sql`
      SELECT
        i.id,
        i.invoice_number,
        i.challan_id,
        i.customer_id,
        c.name AS customer_name,
        c.business_name,
        i.subtotal,
        i.tax_amount,
        i.total_amount,
        i.status,
        i.created_by,
        u.name AS created_by_name,
        i.created_at
      FROM invoices i
      LEFT JOIN customers c
        ON c.id = i.customer_id
      LEFT JOIN users u
        ON u.id = i.created_by
      ORDER BY i.created_at DESC
    `;

    return res.status(200).json({
      data: invoices
    });
  } catch (error) {
    console.error(
      "Get invoices error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch invoices",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
};

export const getInvoiceById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const invoiceResult = await sql`
      SELECT
        i.id,
        i.invoice_number,
        i.challan_id,
        i.customer_id,
        c.name AS customer_name,
        c.business_name,
        c.email AS customer_email,
        c.mobile AS customer_mobile,
        i.subtotal,
        i.tax_amount,
        i.total_amount,
        i.status,
        i.created_by,
        u.name AS created_by_name,
        i.created_at
      FROM invoices i
      LEFT JOIN customers c
        ON c.id = i.customer_id
      LEFT JOIN users u
        ON u.id = i.created_by
      WHERE i.id = ${id}
    `;

    if (invoiceResult.length === 0) {
      return res.status(404).json({
        message: "Invoice not found"
      });
    }

    const items = await sql`
      SELECT
        id,
        product_id,
        product_name_snapshot,
        sku_snapshot,
        unit_price_snapshot,
        quantity,
        line_total
      FROM invoice_items
      WHERE invoice_id = ${id}
      ORDER BY id ASC
    `;

    return res.status(200).json({
      ...invoiceResult[0],
      items
    });
  } catch (error) {
    console.error(
      "Get invoice error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch invoice",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
};

export const createInvoiceFromChallan =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const { challanId } = req.params;

      if (!challanId) {
        return res.status(400).json({
          message: "Challan ID is required"
        });
      }

      const challanResult = await sql`
        SELECT
          c.id,
          c.challan_number,
          c.customer_id,
          c.status,
          c.created_by
        FROM challans c
        WHERE c.id = ${challanId}
      `;

      if (challanResult.length === 0) {
        return res.status(404).json({
          message: "Challan not found"
        });
      }

      const challan =
        challanResult[0];

      if (challan.status !== "Confirmed") {
        return res.status(400).json({
          message:
            "Only confirmed challans can be invoiced"
        });
      }

      const existingInvoice = await sql`
        SELECT
          id,
          invoice_number
        FROM invoices
        WHERE challan_id = ${challanId}
        LIMIT 1
      `;

      if (existingInvoice.length > 0) {
        return res.status(409).json({
          message:
            "An invoice already exists for this challan",
          invoiceId:
            existingInvoice[0].id,
          invoiceNumber:
            existingInvoice[0].invoice_number
        });
      }

      /*
       * IMPORTANT:
       *
       * Actual challan_items columns:
       *
       * id
       * challan_id
       * product_id
       * product_name_snapshot
       * product_sku_snapshot
       * unit_price_snapshot
       * quantity
       *
       * There is NO created_at column.
       */

      const items = await sql`
        SELECT
          ci.product_id,
          ci.product_name_snapshot,
          ci.product_sku_snapshot AS sku_snapshot,
          ci.unit_price_snapshot,
          ci.quantity
        FROM challan_items ci
        WHERE ci.challan_id = ${challanId}
        ORDER BY ci.id ASC
      `;

      if (items.length === 0) {
        return res.status(400).json({
          message:
            "Cannot create invoice for a challan with no items"
        });
      }

      let subtotal = 0;

      for (const item of items) {
        const unitPrice =
          Number(
            item.unit_price_snapshot
          );

        const itemQuantity =
          Number(item.quantity);

        subtotal +=
          unitPrice * itemQuantity;
      }

      const taxRate = 0.18;

      const taxAmount =
        subtotal * taxRate;

      const totalAmount =
        subtotal + taxAmount;

      const invoiceNumberResult =
        await sql`
          SELECT
            'INV-' ||
            TO_CHAR(
              CURRENT_DATE,
              'YYYYMMDD'
            ) ||
            '-' ||
            LPAD(
              (
                COUNT(*) + 1
              )::text,
              4,
              '0'
            ) AS invoice_number
          FROM invoices
          WHERE DATE(created_at) =
            CURRENT_DATE
        `;

      const invoiceNumber =
        invoiceNumberResult[0]
          .invoice_number;

      const invoiceResult =
        await sql`
          INSERT INTO invoices (
            invoice_number,
            challan_id,
            customer_id,
            subtotal,
            tax_amount,
            total_amount,
            status,
            created_by
          )
          VALUES (
            ${invoiceNumber},
            ${challanId},
            ${challan.customer_id},
            ${subtotal},
            ${taxAmount},
            ${totalAmount},
            'Issued',
            ${req.user?.userId}
          )
          RETURNING *
        `;

      const invoice =
        invoiceResult[0];

      for (const item of items) {
        const unitPrice =
          Number(
            item.unit_price_snapshot
          );

        const itemQuantity =
          Number(item.quantity);

        const lineTotal =
          unitPrice * itemQuantity;

        await sql`
          INSERT INTO invoice_items (
            invoice_id,
            product_id,
            product_name_snapshot,
            sku_snapshot,
            unit_price_snapshot,
            quantity,
            line_total
          )
          VALUES (
            ${invoice.id},
            ${item.product_id},
            ${item.product_name_snapshot},
            ${item.sku_snapshot},
            ${unitPrice},
            ${itemQuantity},
            ${lineTotal}
          )
        `;
      }

      return res.status(201).json({
        message:
          "Invoice created successfully",

        invoiceId:
          invoice.id,

        invoiceNumber:
          invoice.invoice_number,

        subtotal,

        taxAmount,

        totalAmount
      });
    } catch (error) {
      console.error(
        "Create invoice error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to create invoice",

        error:
          error instanceof Error
            ? error.message
            : "Unknown error"
      });
    }
  };