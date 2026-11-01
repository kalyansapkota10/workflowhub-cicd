import TaskDashboard from "./TaskDashboard";
import { useState } from "react";
import { api } from "./api";
import "./App.css";

const AUTH_STORAGE_KEY = "workflowhub_auth";

function App() {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem(AUTH_STORAGE_KEY) || "null"
      );
    } catch {
      return null;
    }
  });

  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");

    setForm({
      username: "",
      email: "",
      password: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "register") {
        await api.register({
          username: form.username,
          email: form.email,
          password: form.password,
        });

        setMode("login");
        setNotice(
          "Account created successfully. Please log in."
        );

        setForm({
          username: form.username,
          email: "",
          password: "",
        });
      } else {
        const result = await api.login({
          username: form.username,
          password: form.password,
        });

        const authData = {
          token: result.token,
          user: result.user,
        };

        sessionStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(authData)
        );

        setAuth(authData);

        setForm({
          username: "",
          email: "",
          password: "",
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      await api.logout(auth.token);

      sessionStorage.removeItem(AUTH_STORAGE_KEY);

      setAuth(null);
      setMode("login");
      setNotice("You have logged out successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (auth) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-header">
          <div className="brand">
            <div className="brand-icon">W</div>
            <span>WorkFlowHub</span>
          </div>

          <div className="header-actions">
            <span className="username">
              {auth.user.username}
            </span>

            <button
              className="logout-button"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Logout"}
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="welcome-section">
            <span className="section-label">
              YOUR WORKSPACE
            </span>

            <h1>
              Welcome back, {auth.user.username}!
            </h1>

            <p>
              Manage your tasks and stay organized with WorkFlowHub.
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <TaskDashboard token={auth.token} />
        </main>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <div className="brand">
          <div className="brand-icon">W</div>
          <span>WorkFlowHub</span>
        </div>

        <div className="intro-content">
          <span className="intro-label">
            WORK SMARTER, EVERY DAY
          </span>

          <h1>
            Organize your work.
            <br />
            Achieve more.
          </h1>

          <p>
            A simple workspace to create, organize,
            and track your tasks in one place.
          </p>
        </div>

        <p className="intro-footer">
          WorkFlowHub — Simple Task Management
        </p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-heading">
            <h2>
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p>
              {mode === "login"
                ? "Sign in to continue to your workspace."
                : "Get started with WorkFlowHub today."}
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {notice && (
            <div className="success-message">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleInputChange}
                required
              />
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;