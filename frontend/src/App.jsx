
import { useState } from "react";
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
} from "lucide-react";
import "./App.css";

const initialProducts = [
  { id: 1, name: "Wireless Mouse", sku: "WM-001", quantity: 24, price: 799, threshold: 5 },
  { id: 2, name: "Mechanical Keyboard", sku: "MK-002", quantity: 3, price: 2499, threshold: 5 },
  { id: 3, name: "USB-C Hub", sku: "UH-003", quantity: 12, price: 1499, threshold: 5 },
  { id: 4, name: "Laptop Stand", sku: "LS-004", quantity: 2, price: 999, threshold: 5 },
];

export default function App() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState("Dashboard");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    quantity: "",
    price: "",
    threshold: "5",
  });

  const lowStock = products.filter(
    (p) => p.quantity <= p.threshold
  );

  const totalUnits = products.reduce(
    (sum, p) => sum + p.quantity,
    0
  );

  function addProduct(e) {
    e.preventDefault();

    if (products.some((p) => p.sku.toLowerCase() === form.sku.trim().toLowerCase())) {
      alert("This SKU already exists.");
      return;
    }

    setProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: form.name.trim(),
        sku: form.sku.trim(),
        quantity: Number(form.quantity),
        price: Number(form.price || 0),
        threshold: Number(form.threshold || 5),
      },
    ]);

    setForm({ name: "", sku: "", quantity: "", price: "", threshold: "5" });
    setShowForm(false);
  }

  function deleteProduct(id) {
    if (window.confirm("Delete this product?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Boxes size={24} /></div>
          <div><strong>StockFlow</strong><small>INVENTORY CONTROL</small></div>
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
          <div className="avatar">S</div>
          <div><strong>Store Owner</strong><small>Administrator</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu">
            <Menu />
          </button>
          <div className="breadcrumb">Workspace / <strong>{page}</strong></div>
          <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
        </header>

        <section className="page-content">
          {page === "Dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">OVERVIEW</p>
                  <h1>Dashboard</h1>
                  <p className="muted">Here's what's happening with your inventory.</p>
                </div>
                <button className="primary-button" onClick={() => { setPage("Products"); setShowForm(true); }}>
                  <Plus size={18} /> Add Product
                </button>
              </div>

              <div className="stats-grid">
                <Stat icon={Package} label="Total Products" value={products.length} note="Products in your catalog" />
                <Stat icon={Boxes} label="Total Stock Units" value={totalUnits.toLocaleString()} note="Units currently in stock" />
                <Stat icon={AlertTriangle} label="Low Stock Items" value={lowStock.length} note="Items need your attention" warning />
                <Stat icon={DollarSign} label="Inventory Retail Value" value={`₹${products.reduce((sum, p) => sum + p.quantity * p.price, 0).toLocaleString("en-IN")}`} note="Based on selling prices" />
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <div><h2>Low Stock Alerts</h2><p className="muted">Products at or below their stock threshold</p></div>
                  <button className="text-button" onClick={() => setPage("Products")}>View products →</button>
                </div>
                {lowStock.length === 0 ? (
                  <p className="empty-state">All products are sufficiently stocked.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>PRODUCT</th><th>SKU</th><th>QUANTITY</th><th>THRESHOLD</th><th>STATUS</th></tr></thead>
                      <tbody>{lowStock.map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td><td>{p.sku}</td>
                          <td>{p.quantity}</td><td>{p.threshold}</td>
                          <td><span className="status low">Low stock</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {page === "Products" && (
            <>
              <div className="page-heading">
                <div><p className="eyebrow">INVENTORY</p><h1>Products</h1><p className="muted">Manage your products and stock levels.</p></div>
                <button className="primary-button" onClick={() => setShowForm(!showForm)}><Plus size={18} /> Add Product</button>
              </div>

              {showForm && (
                <form className="panel product-form" onSubmit={addProduct}>
                  <h2>Add New Product</h2>
                  <div className="form-grid">
                    {[
                      ["name", "Product Name", "text"],
                      ["sku", "SKU", "text"],
                      ["quantity", "Quantity", "number"],
                      ["price", "Selling Price (₹)", "number"],
                      ["threshold", "Low Stock Threshold", "number"],
                    ].map(([key, label, type]) => (
                      <label key={key}>{label}
                        <input
                          required={["name", "sku", "quantity"].includes(key)}
                          type={type}
                          min={type === "number" ? "0" : undefined}
                          value={form[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
                    <button className="primary-button" type="submit">Save Product</button>
                  </div>
                </form>
              )}

              <section className="panel">
                <div className="search-box"><Search size={18} /><input placeholder="Search by product name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>PRODUCT</th><th>SKU</th><th>QUANTITY</th><th>SELLING PRICE</th><th>STATUS</th><th>ACTION</th></tr></thead>
                    <tbody>{filtered.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td><td>{p.sku}</td><td>{p.quantity}</td>
                        <td>₹{p.price.toLocaleString("en-IN")}</td>
                        <td><span className={`status ${p.quantity <= p.threshold ? "low" : "good"}`}>{p.quantity <= p.threshold ? "Low stock" : "In stock"}</span></td>
                        <td><button className="delete-button" onClick={() => deleteProduct(p.id)}>Delete</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                  {filtered.length === 0 && <p className="empty-state">No products found.</p>}
                </div>
              </section>
            </>
          )}

          {page === "Settings" && (
            <section className="panel settings-panel">
              <p className="eyebrow">PREFERENCES</p>
              <h1>Settings</h1>
              <p className="muted">Configure your inventory defaults.</p>
              <p>Your current low-stock threshold is set individually for each product.</p>
              <p className="muted">Account authentication and saved settings will be connected to the backend in a later step.</p>
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
      <div className={`stat-icon ${warning ? "warning" : ""}`}><Icon size={21} /></div>
      <p className="stat-label">{label}</p>
      <h2>{value}</h2>
      <p className="stat-note">{note}</p>
    </div>
  );
}
