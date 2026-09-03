import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Invalid email or password"
        );
        return;
      }

      if (!data.token || !data.user) {
        setMessage(
          "Invalid login response from server"
        );
        return;
      }

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      onLogin(
        data.user,
        data.token
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setMessage(
        "Unable to connect to the server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-left">

        <div className="login-brand">

          <div className="brand-mark">
            S
          </div>

          <span>
            SupplyHub
          </span>

        </div>

        <div className="login-content">

          <div className="login-badge">
            ERP & CRM PLATFORM
          </div>

          <h1>
            Manage your business
            <br />
            <span>smarter.</span>
          </h1>

          <p className="login-description">
            A centralized platform for
            managing products, inventory,
            customers and business operations.
          </p>

          <div className="login-features">

            <div className="login-feature">

              <div className="feature-icon">
                ✓
              </div>

              <div>

                <strong>
                  Inventory Management
                </strong>

                <span>
                  Monitor stock levels and movements
                </span>

              </div>

            </div>

            <div className="login-feature">

              <div className="feature-icon">
                ✓
              </div>

              <div>

                <strong>
                  Customer Management
                </strong>

                <span>
                  Manage your CRM customers
                </span>

              </div>

            </div>

            <div className="login-feature">

              <div className="feature-icon">
                ✓
              </div>

              <div>

                <strong>
                  Business Insights
                </strong>

                <span>
                  Track your business performance
                </span>

              </div>

            </div>

          </div>

        </div>

        <div className="login-footer">
          © 2026 SupplyHub. All rights reserved.
        </div>

      </div>

      <div className="login-right">

        <div className="login-card">

          <div className="login-card-header">

            <div className="mobile-brand">

              <div className="brand-mark">
                S
              </div>

              <span>
                SupplyHub
              </span>

            </div>

            <h2>
              Everything your business
              needs, in one place.
            </h2>

            <p>
              Sign in to access your workspace
            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="login-form"
          >

            <div className="login-form-group">

              <label>
                Email address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  @
                </span>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (message) {
                      setMessage("");
                    }
                  }}
                  required
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

            </div>

            <div className="login-form-group">

              <label>
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  •
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (message) {
                      setMessage("");
                    }
                  }}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

            {message && (
              <div className="login-error">

                <span>
                  !
                </span>

                {message}

              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          <div className="login-security">

            <span className="security-icon">
              🔒
            </span>

            <span>
              Your connection is secure
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
