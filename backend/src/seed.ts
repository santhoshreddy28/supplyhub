import bcrypt from "bcrypt";
import { sql } from "./config/database";

const users = [
  {
    name: "Admin User",
    email: "iamadmin@supplyhub.com",
    password: "Admin@123",
    role: "Admin"
  },
  {
    name: "Admin User 2",
    email: "iamadmin2@supplyhub.com",
    password: "Admin@456",
    role: "Admin"
  },
  {
    name: "Accounts User",
    email: "iamaccounts@supplyhub.com",
    password: "Accounts@123",
    role: "Accounts"
  },
  {
    name: "Sales User",
    email: "iamsales@supplyhub.com",
    password: "Sales@123",
    role: "Sales"
  },
  {
    name: "Warehouse User",
    email: "iamwarehouse@supplyhub.com",
    password: "Warehouse@123",
    role: "Warehouse"
  }
];

const seedUsers = async () => {
  try {
    for (const user of users) {
      const passwordHash = await bcrypt.hash(
        user.password,
        10
      );

      await sql`
        INSERT INTO users (
          name,
          email,
          password_hash,
          role
        )
        VALUES (
          ${user.name},
          ${user.email},
          ${passwordHash},
          ${user.role}
        )
        ON CONFLICT (email)
        DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role
      `;
    }

    console.log(
      "All test users created successfully"
    );

    console.log(
      "Admin: iamadmin@supplyhub.com / Admin@123"
    );

    console.log(
      "Admin 2: iamadmin2@supplyhub.com / Admin@456"
    );

    console.log(
      "Accounts: iamaccounts@supplyhub.com / Accounts@123"
    );

    console.log(
      "Sales: iamsales@supplyhub.com / Sales@123"
    );

    console.log(
      "Warehouse: iamwarehouse@supplyhub.com / Warehouse@123"
    );

  } catch (error) {
    console.error(
      "Seed error:",
      error
    );
  }
};

seedUsers();