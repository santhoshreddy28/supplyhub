import { useEffect, useState } from "react";

import Dashboard from "./Dashboard";
import Customers from "./Customers";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
import StockMovements from "./pages/StockMovements";
import Invoices from "./pages/Invoices";
import Login from "./Login";
import Layout from "./Layout";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [path, setPath] = useState(
    window.location.pathname
  );

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState(
      {},
      "",
      newPath
    );

    setPath(newPath);
  };

  const handleLogin = (
    loggedInUser: User,
    newToken: string
  ) => {
    localStorage.setItem(
      "token",
      newToken
    );

    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );

    setToken(newToken);
    setUser(loggedInUser);

    navigate("/admin");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    navigate("/login");
  };

  if (!token || !user) {
    if (path !== "/login") {
      window.history.replaceState(
        {},
        "",
        "/login"
      );

      setPath("/login");
    }

    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  const role =
    user.role?.trim().toLowerCase();

  const permissions = {
    dashboard: [
      "admin",
      "accounts",
      "sales",
      "warehouse"
    ],

    products: [
      "admin",
      "warehouse"
    ],

    customers: [
      "admin",
      "accounts",
      "sales"
    ],

    stock: [
      "admin",
      "warehouse"
    ],

    stockMovements: [
      "admin",
      "warehouse",
      "accounts"
    ],

    invoices: [
      "admin",
      "accounts",
      "sales"
    ]
  };

  const canAccess = (
    section: keyof typeof permissions
  ) => {
    return permissions[
      section
    ].includes(role);
  };

  if (
    path === "/" ||
    path === "/login"
  ) {
    navigate("/admin");
    return null;
  }

  let page: React.ReactNode = null;

  if (
    path === "/admin" ||
    path === "/dashboard"
  ) {
    if (!canAccess("dashboard")) {
      return (
        <AccessDenied
          role={role}
          onLogout={handleLogout}
        />
      );
    }

    page = <Dashboard />;
  }

  else if (
    path === "/products"
  ) {
    if (!canAccess("products")) {
      return (
        <AccessDenied
          role={role}
          onLogout={handleLogout}
        />
      );
    }

    page = <Products />;
  }

  else if (
    path === "/customers"
  ) {
    if (!canAccess("customers")) {
      return (
        <AccessDenied
          role={role}
          onLogout={handleLogout}
        />
      );
    }

    page = <Customers />;
  }

  else if (
    path === "/stock"
  ) {
    if (!canAccess("stock")) {
      return (
        <AccessDenied
          role={role}
          onLogout={handleLogout}
        />
      );
    }

    page = <Stock />;
  }

  else if (
    path === "/stock-movements"
  ) {
    if (
      !canAccess(
        "stockMovements"
      )
    ) {
      return (
        <AccessDenied
          role={role}
          onLogout={handleLogout}
        />
      );
    }

    page = <StockMovements />;
  }

  else if (
    path === "/invoices"
  ) {
    if (
      !canAccess("invoices")
    ) {
      return (
        <AccessDenied
          role={role}
          onLogout={handleLogout}
        />
      );
    }

    page = <Invoices />;
  }

  else {
    navigate("/admin");
    return null;
  }

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
    >
      {page}
    </Layout>
  );
}

interface AccessDeniedProps {
  role: string;
  onLogout: () => void;
}

function AccessDenied({
  role,
  onLogout
}: AccessDeniedProps) {
  return (
    <Layout
      user={{
        id: "",
        name: "User",
        email: "",
        role
      }}
      onLogout={onLogout}
    >
      <div
        style={{
          minHeight:
            "calc(100vh - 68px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "450px",
            padding: "40px",
            background: "#ffffff",
            border:
              "1px solid #e2e8f0",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow:
              "0 15px 40px rgba(15,23,42,0.08)"
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              margin:
                "0 auto 18px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fee2e2",
              color: "#dc2626",
              fontSize: "22px",
              fontWeight: 700
            }}
          >
            !
          </div>

          <h2
            style={{
              margin:
                "0 0 10px",
              color: "#172033"
            }}
          >
            Access Denied
          </h2>

          <p
            style={{
              color: "#64748b",
              margin:
                "0 0 10px"
            }}
          >
            Your account does not
            have permission to access
            this page.
          </p>

          <p
            style={{
              color: "#94a3b8",
              margin:
                "0 0 25px"
            }}
          >
            Current role:{" "}
            <strong>
              {role}
            </strong>
          </p>

          <button
            onClick={onLogout}
            style={{
              border: "none",
              borderRadius: "9px",
              padding:
                "11px 20px",
              background:
                "#172033",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default App;