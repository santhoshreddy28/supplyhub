import { Response } from "express";
import { sql } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const getCustomers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const search = String(req.query.search || "").trim();
    const offset = (page - 1) * limit;

    const customers = await sql`
      SELECT
        id,
        name,
        mobile,
        email,
        business_name,
        gst_number,
        customer_type,
        address,
        status,
        follow_up_date,
        notes,
        created_at,
        updated_at
      FROM customers
      WHERE
        name ILIKE ${`%${search}%`}
        OR mobile ILIKE ${`%${search}%`}
        OR COALESCE(business_name, '') ILIKE ${`%${search}%`}
        OR COALESCE(email, '') ILIKE ${`%${search}%`}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM customers
      WHERE
        name ILIKE ${`%${search}%`}
        OR mobile ILIKE ${`%${search}%`}
        OR COALESCE(business_name, '') ILIKE ${`%${search}%`}
        OR COALESCE(email, '') ILIKE ${`%${search}%`}
    `;

    const total = countResult[0].total;

    res.json({
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      message: "Failed to fetch customers"
    });
  }
};
export const createCustomer = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes
    } = req.body;

    if (!name || !mobile || !customer_type) {
      return res.status(400).json({
        message: "Name, mobile and customer type are required"
      });
    }

    const allowedCustomerTypes = [
      "Retail",
      "Wholesale",
      "Distributor"
    ];

    if (!allowedCustomerTypes.includes(customer_type)) {
      return res.status(400).json({
        message: "Invalid customer type"
      });
    }

    const allowedStatuses = [
      "Lead",
      "Active",
      "Inactive"
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid customer status"
      });
    }

    const result = await sql`
      INSERT INTO customers (
        name,
        mobile,
        email,
        business_name,
        gst_number,
        customer_type,
        address,
        status,
        follow_up_date,
        notes,
        created_by
      )
      VALUES (
        ${name},
        ${mobile},
        ${email || null},
        ${business_name || null},
        ${gst_number || null},
        ${customer_type},
        ${address || null},
        ${status || "Lead"},
        ${follow_up_date || null},
        ${notes || null},
        ${req.user?.userId || null}
      )
      RETURNING *
    `;

    res.status(201).json({
      message: "Customer created successfully",
      customer: result[0]
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      message: "Failed to create customer"
    });
  }
};

export const updateCustomer = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes
    } = req.body;

    if (!name || !mobile || !customer_type) {
      return res.status(400).json({
        message: "Name, mobile and customer type are required"
      });
    }

    const allowedCustomerTypes = [
      "Retail",
      "Wholesale",
      "Distributor"
    ];

    if (!allowedCustomerTypes.includes(customer_type)) {
      return res.status(400).json({
        message: "Invalid customer type"
      });
    }

    const allowedStatuses = [
      "Lead",
      "Active",
      "Inactive"
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid customer status"
      });
    }

    const result = await sql`
      UPDATE customers
      SET
        name = ${name},
        mobile = ${mobile},
        email = ${email || null},
        business_name = ${business_name || null},
        gst_number = ${gst_number || null},
        customer_type = ${customer_type},
        address = ${address || null},
        status = ${status || "Lead"},
        follow_up_date = ${follow_up_date || null},
        notes = ${notes || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      message: "Customer updated successfully",
      customer: result[0]
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      message: "Failed to update customer"
    });
  }
};

export const getCustomerById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT
        id,
        name,
        mobile,
        email,
        business_name,
        gst_number,
        customer_type,
        address,
        status,
        follow_up_date,
        notes,
        created_by,
        created_at,
        updated_at
      FROM customers
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      customer: result[0]
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      message: "Failed to fetch customer"
    });
  }
};

export const addFollowUp = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        message: "Follow-up note is required"
      });
    }

    const customer = await sql`
      SELECT id
      FROM customers
      WHERE id = ${id}
    `;

    if (customer.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const result = await sql`
      INSERT INTO customer_follow_ups (
        customer_id,
        note,
        created_by
      )
      VALUES (
        ${id},
        ${note.trim()},
        ${req.user?.userId || null}
      )
      RETURNING *
    `;

    res.status(201).json({
      message: "Follow-up note added successfully",
      followUp: result[0]
    });
  } catch (error) {
    console.error("Add follow-up error:", error);

    res.status(500).json({
      message: "Failed to add follow-up note"
    });
  }
};

export const getFollowUps = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const customer = await sql`
      SELECT id
      FROM customers
      WHERE id = ${id}
    `;

    if (customer.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const followUps = await sql`
      SELECT
        id,
        customer_id,
        note,
        created_by,
        created_at
      FROM customer_follow_ups
      WHERE customer_id = ${id}
      ORDER BY created_at DESC
    `;

    res.json({
      data: followUps
    });
  } catch (error) {
    console.error("Get follow-ups error:", error);

    res.status(500).json({
      message: "Failed to fetch follow-up notes"
    });
  }
};