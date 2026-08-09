import React from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

function Layout({
  children,
  user,
  onLogout
}: LayoutProps) {

  const currentPath =
    window.location.pathname;

  const navigate = (
    path: string
  ) => {
    if (
      window.location.pathname ===
      path
    ) {
      return;
    }

    window.history.pushState(
      {},
      "",
      path
    );

    window.dispatchEvent(
      new PopStateEvent(
        "popstate"
      )
    );
  };

  const isActive = (
    path: string
  ) => {
    return (
      currentPath === path
    );
  };

  const role =
    user.role
      ?.trim()
      .toLowerCase();

  const canShow = (
    section: string
  ) => {

    if (
      role === "admin"
    ) {
      return true;
    }

    if (
      section ===
      "dashboard"
    ) {
      return [
        "accounts",
        "sales",
        "warehouse"
      ].includes(role);
    }

    if (
      section ===
      "products"
    ) {
      return [
        "warehouse"
      ].includes(role);
    }

    if (
      section ===
      "customers"
    ) {
      return [
        "accounts",
        "sales"
      ].includes(role);
    }

    if (
      section ===
      "stock"
    ) {
      return [
        "warehouse"
      ].includes(role);
    }

    if (
      section ===
      "stockHistory"
    ) {
      return [
        "warehouse",
        "accounts"
      ].includes(role);
    }

    if (
      section ===
      "invoices"
    ) {
      return [
        "accounts",
        "sales"
      ].includes(role);
    }

    return false;
  };

  const navButtonStyle = (
    active: boolean
  ): React.CSSProperties => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "13px 14px",
    border: "none",
    borderRadius: "10px",
    background: active
      ? "#202b40"
      : "transparent",
    color: active
      ? "#ffffff"
      : "#b8c3d6",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: active
      ? 700
      : 500,
    transition:
      "background .15s ease"
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "#f8fafc",
        display: "flex"
      }}
    >

      {/* SIDEBAR */}

      <aside
        style={{
          width: "250px",
          minWidth: "250px",
          background:
            "#101827",
          color: "#ffffff",
          display: "flex",
          flexDirection:
            "column",
          minHeight: "100vh"
        }}
      >

        {/* BRAND */}

        <div
          style={{
            padding:
              "28px 26px 22px",
            borderBottom:
              "1px solid rgba(255,255,255,.06)"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "12px"
            }}
          >

            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius:
                  "10px",
                background:
                  "#ffffff",
                color:
                  "#172033",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontWeight: 800,
                fontSize: "20px"
              }}
            >
              S
            </div>

            <div>

              <div
                style={{
                  fontWeight: 800,
                  fontSize:
                    "17px"
                }}
              >
                SupplyHub
              </div>

              <div
                style={{
                  color:
                    "#8794a9",
                  fontSize:
                    "11px",
                  marginTop:
                    "3px"
                }}
              >
                Business Management
              </div>

            </div>

          </div>

        </div>

        {/* USER CARD */}

        <div
          style={{
            margin:
              "18px 17px",
            padding:
              "14px",
            background:
              "#202b40",
            borderRadius:
              "12px"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "12px"
            }}
          >

            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius:
                  "50%",
                background:
                  "#315fd6",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontWeight: 700
              }}
            >
              {(
                user.name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div
              style={{
                minWidth: 0
              }}
            >

              <div
                style={{
                  fontWeight: 700,
                  fontSize:
                    "14px",
                  whiteSpace:
                    "nowrap",
                  overflow:
                    "hidden",
                  textOverflow:
                    "ellipsis"
                }}
              >
                {user.name}
              </div>

              <div
                style={{
                  color:
                    "#aeb9ca",
                  fontSize:
                    "12px",
                  marginTop:
                    "3px"
                }}
              >
                {user.role}
              </div>

            </div>

          </div>

        </div>

        {/* MENU */}

        <div
          style={{
            padding:
              "0 17px",
            flex: 1
          }}
        >

          <div
            style={{
              color:
                "#718097",
              fontSize:
                "11px",
              fontWeight: 700,
              letterSpacing:
                ".08em",
              padding:
                "8px 10px 12px"
            }}
          >
            MAIN MENU
          </div>

          {canShow(
            "dashboard"
          ) && (
            <button
              style={navButtonStyle(
                isActive(
                  "/admin"
                ) ||
                isActive(
                  "/dashboard"
                )
              )}
              onClick={() =>
                navigate(
                  "/admin"
                )
              }
            >
              <span>
                ▦
              </span>

              Dashboard
            </button>
          )}

          {canShow(
            "products"
          ) && (
            <button
              style={navButtonStyle(
                isActive(
                  "/products"
                )
              )}
              onClick={() =>
                navigate(
                  "/products"
                )
              }
            >
              <span>
                □
              </span>

              Products
            </button>
          )}

          {canShow(
            "customers"
          ) && (
            <button
              style={navButtonStyle(
                isActive(
                  "/customers"
                )
              )}
              onClick={() =>
                navigate(
                  "/customers"
                )
              }
            >
              <span>
                ◉
              </span>

              Customers
            </button>
          )}

          {canShow(
            "stock"
          ) && (
            <button
              style={navButtonStyle(
                isActive(
                  "/stock"
                )
              )}
              onClick={() =>
                navigate(
                  "/stock"
                )
              }
            >
              <span>
                ↕
              </span>

              Inventory
            </button>
          )}

          {canShow(
            "stockHistory"
          ) && (
            <button
              style={navButtonStyle(
                isActive(
                  "/stock-movements"
                )
              )}
              onClick={() =>
                navigate(
                  "/stock-movements"
                )
              }
            >
              <span>
                ⇄
              </span>

              Stock History
            </button>
          )}

          {canShow(
            "invoices"
          ) && (
            <button
              style={navButtonStyle(
                isActive(
                  "/invoices"
                )
              )}
              onClick={() =>
                navigate(
                  "/invoices"
                )
              }
            >
              <span>
                ▤
              </span>

              Invoices
            </button>
          )}

        </div>

        {/* BOTTOM */}

        <div
          style={{
            padding:
              "18px 17px 24px"
          }}
        >

          <div
            style={{
              borderTop:
                "1px solid rgba(255,255,255,.07)",
              paddingTop:
                "20px"
            }}
          >

            <div
              style={{
                color:
                  "#718097",
                fontSize:
                  "10px",
                fontWeight: 700,
                letterSpacing:
                  ".08em",
                marginBottom:
                  "7px"
              }}
            >
              CURRENT ROLE
            </div>

            <div
              style={{
                color:
                  "#ffffff",
                fontWeight: 700,
                fontSize:
                  "13px",
                marginBottom:
                  "20px"
              }}
            >
              {user.role}
            </div>

            <button
              onClick={
                onLogout
              }
              style={{
                width: "100%",
                padding:
                  "12px 14px",
                border:
                  "1px solid rgba(255,255,255,.1)",
                borderRadius:
                  "9px",
                background:
                  "transparent",
                color:
                  "#b8c3d6",
                cursor:
                  "pointer",
                textAlign:
                  "left",
                fontWeight: 600
              }}
            >
              ↪ Logout
            </button>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <div
        style={{
          flex: 1,
          minWidth: 0
        }}
      >

        {/* TOP BAR */}

        <header
          style={{
            height: "68px",
            background:
              "#ffffff",
            borderBottom:
              "1px solid #e2e8f0",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            padding:
              "0 32px"
          }}
        >

          <div
            style={{
              color:
                "#172033",
              fontWeight: 700,
              fontSize:
                "14px"
            }}
          >
            SupplyHub
            <span
              style={{
                color:
                  "#cbd5e1",
                margin:
                  "0 10px"
              }}
            >
              /
            </span>

            <span
              style={{
                color:
                  "#64748b",
                fontWeight: 500
              }}
            >
              {currentPath ===
              "/invoices"
                ? "Invoices"
                : currentPath ===
                  "/products"
                ? "Products"
                : currentPath ===
                  "/customers"
                ? "Customers"
                : currentPath ===
                  "/stock"
                ? "Inventory"
                : currentPath ===
                  "/stock-movements"
                ? "Stock History"
                : "Admin"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "11px"
            }}
          >

            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius:
                  "50%",
                background:
                  "#eef2ff",
                color:
                  "#315fd6",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontWeight: 700
              }}
            >
              {(
                user.name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <div
                style={{
                  fontWeight: 700,
                  fontSize:
                    "13px",
                  color:
                    "#172033"
                }}
              >
                {user.name}
              </div>

              <div
                style={{
                  fontSize:
                    "11px",
                  color:
                    "#94a3b8"
                }}
              >
                {user.email}
              </div>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <main>
          {children}
        </main>

      </div>

    </div>
  );
}

export default Layout;