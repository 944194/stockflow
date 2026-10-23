
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Settings,
  Search,
  Bell,
  Plus,
  AlertTriangle,
  Boxes,
  DollarSign,
  Menu,
  LogOut,
  RefreshCw,
} from "lucide-react";
import "./App.css";

const API = "http://localhost:5000";

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session expired. Please log in again.");
    }
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

const emptyForm = {
  name: "",
  sku: "",
  quantity: "",
  costPrice: "",
  sellingPrice: "",
  lowStockThreshold: "5",
};

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("stockflow_token") || ""
  );
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("stockflow_user") || "null")
  );

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    organizationName: "",
  });

  const [products, setProducts] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState("Dashboard");
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("stockflow_token");
    localStorage.removeItem("stockflow_user");
    setToken("");
    setUser(null);
    setProducts([]);
    setDashboard(null);
    setError("");
    setNotice("");
  }, []);

  const loadData = useCallback(async (activeToken) => {
    setLoading(true);
    setError("");

    try {
      const [productData, dashboardData] = await Promise.all([
        apiRequest("/api/products", activeToken),
        apiRequest("/api/dashboard", activeToken),
      ]);

      setProducts(productData);
      setDashboard(dashboardData);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("session expired")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token, loadData]);

  async function handleAuth(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const endpoint =
        authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";

      const payload =
        authMode === "signup"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const result = await apiRequest(endpoint, null, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("stockflow_token", result.token);
      localStorage.setItem("stockflow_user", JSON.stringify(result.user));

      setToken(result.token);
      setUser(result.user);
      setPage("Dashboard");
      setNotice(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addProduct(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest("/api/products", token, {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim(),
          quantity: Number(form.quantity),
          costPrice: form.costPrice === "" ? null : Number(form.costPrice),
          sellingPrice:
            form.sellingPrice === "" ? null : Number(form.sellingPrice),
          lowStockThreshold: Number(form.lowStockThreshold || 5),
        }),
      });

      setForm(emptyForm);
      setShowForm(false);
      setNotice(result.message || "Product created successfully.");
      await loadData(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;

    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/api/products/${id}`, token, {
        method: "DELETE",
      });

      setNotice(result.message || "Product deleted successfully.");
      await loadData(token);
    } catch (err) {
      setError(err.message);
    }
  }

  const lowStock = products.filter(
    (p) =>
      p.lowStockThreshold !== null &&
      p.lowStockThreshold !== undefined &&
      p.quantity <= p.lowStockThreshold
  );

  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);

  const retailValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.sellingPrice || 0),
    0
  );

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!token) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleAuth}>
          <div className="auth-brand">
            <div className="brand-icon"><Boxes size={24} /></div>
            <div>
              <strong>StockFlow</strong>
              <small>INVENTORY CONTROL</small>
            </div>
          </div>

          <h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">
            {authMode === "login"
              ? "Log in to manage your inventory."
              : "Create your workspace and start managing stock."}
          </p>

          {authMode === "signup" && (
            <label>
              Organization name
              <input
                required
                value={authForm.organizationName}
                onChange={(e) =>
                  setAuthForm({ ...authForm, organizationName: e.target.value })
                }
                placeholder="Your store name"
              />
            </label>
          )}

          <label>
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              minLength={authMode === "signup" ? 8 : undefined}
              autoComplete={
                authMode === "login" ? "current-password" : "new-password"
              }
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              placeholder={authMode === "signup" ? "At least 8 characters" : "Your password"}
            />
          </label>

          {error && <p className="feedback error">{error}</p>}

          <button className="primary-button auth-submit" disabled={saving}>
            {saving
              ? "Please wait..."
              : authMode === "login"
                ? "Log in"
                : "Create account"}
          </button>

          <p className="auth-switch">
            {authMode === "login"
              ? "New to StockFlow?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setError("");
              }}
            >
              {authMode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Boxes size={24} /></div>
          <div>
            <strong>StockFlow</strong>
            <small>INVENTORY CONTROL</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        {[
          { name: "Dashboard", icon: LayoutDashboard },
          { name: "Products", icon: Package },
          { name: "Settings", icon: Settings },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`nav-item ${page === name ? "active" : ""}`}
            onClick={() => setPage(name)}
          >
            <Icon size={19} /> {name}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="avatar">
            {(user?.email || "S").charAt(0).toUpperCase()}
          </div>
          <div className="account-info">
            <strong>{user?.email || "Store Owner"}</strong>
            <small>Administrator</small>
          </div>
          <button
            className="icon-button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Open menu"
            onClick={() => setPage("Products")}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace / <strong>{page}</strong>
          </div>
          <button
            className="icon-button"
            aria-label="Refresh data"
            onClick={() => loadData(token)}
            title="Refresh dashboard"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        <section className="page-content">
          {error && <p className="feedback error">{error}</p>}
          {notice && <p className="feedback success">{notice}</p>}

          {page === "Dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">OVERVIEW</p>
                  <h1>Dashboard</h1>
                  <p className="muted">
                    Here's what's happening with your inventory.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    setPage("Products");
                    setShowForm(true);
                  }}
                >
                  <Plus size={18} /> Add Product
                </button>
              </div>

              <div className="stats-grid">
                <Stat
                  icon={Package}
                  label="Total Products"
                  value={dashboard?.totalProducts ?? products.length}
                  note="Products in your catalog"
                />
                <Stat
                  icon={Boxes}
                  label="Total Stock Units"
                  value={totalUnits.toLocaleString("en-IN")}
                  note="Units currently in stock"
                />
                <Stat
                  icon={AlertTriangle}
                  label="Low Stock Items"
                  value={lowStock.length}
                  note="Items need your attention"
                  warning
                />
                <Stat
                  icon={DollarSign}
                  label="Inventory Retail Value"
                  value={`₹${retailValue.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}`}
                  note="Based on selling prices"
                />
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Low Stock Alerts</h2>
                    <p className="muted">
                      Products at or below their stock threshold
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("Products")}
                  >
                    View products →
                  </button>
                </div>

                {loading ? (
                  <p className="empty-state">Loading inventory...</p>
                ) : lowStock.length === 0 ? (
                  <p className="empty-state">
                    All products are sufficiently stocked.
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>PRODUCT</th>
                          <th>SKU</th>
                          <th>QUANTITY</th>
                          <th>THRESHOLD</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStock.map((p) => (
                          <tr key={p.id}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.sku}</td>
                            <td>{p.quantity}</td>
                            <td>{p.lowStockThreshold}</td>
                            <td><span className="status low">Low stock</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {page === "Products" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">INVENTORY</p>
                  <h1>Products</h1>
                  <p className="muted">
                    Manage your products and stock levels.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus size={18} /> Add Product
                </button>
              </div>

              {showForm && (
                <form className="panel product-form" onSubmit={addProduct}>
                  <h2>Add New Product</h2>

                  <div className="form-grid">
                    {[
                      ["name", "Product Name", "text"],
                      ["sku", "SKU", "text"],
                      ["quantity", "Quantity", "number"],
                      ["costPrice", "Cost Price (₹)", "number"],
                      ["sellingPrice", "Selling Price (₹)", "number"],
                      ["lowStockThreshold", "Low Stock Threshold", "number"],
                    ].map(([key, label, type]) => (
                      <label key={key}>
                        {label}
                        <input
                          required={["name", "sku", "quantity"].includes(key)}
                          type={type}
                          min={type === "number" ? "0" : undefined}
                          step={type === "number" && key.includes("Price") ? "0.01" : undefined}
                          value={form[key]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setShowForm(false);
                        setForm(emptyForm);
                      }}
                    >
                      Cancel
                    </button>
                    <button className="primary-button" type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Product"}
                    </button>
                  </div>
                </form>
              )}

              <section className="panel">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    placeholder="Search by product name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {loading ? (
                  <p className="empty-state">Loading products...</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>PRODUCT</th>
                          <th>SKU</th>
                          <th>QUANTITY</th>
                          <th>SELLING PRICE</th>
                          <th>STATUS</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p) => (
                          <tr key={p.id}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.sku}</td>
                            <td>{p.quantity}</td>
                            <td>
                              {p.sellingPrice == null
                                ? "—"
                                : `₹${Number(p.sellingPrice).toLocaleString("en-IN")}`}
                            </td>
                            <td>
                              <span
                                className={`status ${
                                  p.lowStockThreshold != null &&
                                  p.quantity <= p.lowStockThreshold
                                    ? "low"
                                    : "good"
                                }`}
                              >
                                {p.lowStockThreshold != null &&
                                p.quantity <= p.lowStockThreshold
                                  ? "Low stock"
                                  : "In stock"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="delete-button"
                                onClick={() => deleteProduct(p.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filtered.length === 0 && (
                      <p className="empty-state">
                        {search ? "No products match your search." : "No products yet. Add your first product."}
                      </p>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {page === "Settings" && (
            <section className="panel settings-panel">
              <p className="eyebrow">PREFERENCES</p>
              <h1>Settings</h1>
              <p className="muted">Your StockFlow account</p>
              <p>Signed in as: <strong>{user?.email}</strong></p>
              <p>Organization ID: <strong>{user?.organizationId}</strong></p>
              <p className="muted">
                Each product can have its own low-stock threshold.
              </p>
              <button className="secondary-button" onClick={logout}>
                <LogOut size={16} /> Log out
              </button>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, note, warning }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${warning ? "warning" : ""}`}>
        <Icon size={21} />
      </div>
      <p className="stat-label">{label}</p>
      <h2>{value}</h2>
      <p className="stat-note">{note}</p>
    </div>
  );
}
