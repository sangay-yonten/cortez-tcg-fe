import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import logo from "../assets/logo.jpg";
import {
  CATEGORY_LABELS,
  type ProductCategory,
} from "../data/products";
import {
  adminSignIn,
  adminSignOut,
  deleteAdminProduct,
  formatOrderMoney,
  getAdminSession,
  loadAdminOrders,
  loadAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  updateOrderStatus,
  type AdminOrder,
  type AdminProduct,
  type AdminProductPatch,
  type OrderStatus,
} from "../lib/adminApi";
import { isSupabaseConfigured } from "../lib/supabase";
import { resolveProductImage } from "../lib/productImages";
import { useShop } from "../lib/ShopContext";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminHomePanel from "./AdminHomePanel";
import AdminInvoice from "./AdminInvoice";
import AdminOrderDetail from "./AdminOrderDetail";
import AdminProductDetail from "./AdminProductDetail";
import AdminSelect from "./AdminSelect";
import AdminStreamsPanel from "./AdminStreamsPanel";
import { AdminStatsSkeleton, AdminTableSkeleton } from "./Skeleton";

type AdminPageProps = {
  onBackHome: () => void;
};

type AdminTab = "orders" | "inventory" | "streams" | "home";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "cancelled",
];

const ADMIN_PAGE_SIZE = 8;

function statusLabel(status: OrderStatus) {
  return status.replaceAll("_", " ");
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    totalPages,
    safePage,
    start,
    slice: items.slice(start, start + pageSize),
  };
}

export default function AdminPage({ onBackHome }: AdminPageProps) {
  const { refresh: refreshShop, settings } = useShop();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<AdminTab>("orders");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [orderQuery, setOrderQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [orderPage, setOrderPage] = useState(1);

  const [inventoryQuery, setInventoryQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">(
    "all",
  );
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "hidden">(
    "all",
  );
  const [inventoryPage, setInventoryPage] = useState(1);
  const [invoiceOrder, setInvoiceOrder] = useState<AdminOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [detailProduct, setDetailProduct] = useState<AdminProduct | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    product: AdminProduct;
    mode: "list" | "unlist" | "hard";
  } | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const session = await getAdminSession();
        if (!alive) return;
        setSessionEmail(session?.user.email ?? null);
      } finally {
        if (alive) setAuthChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function loadDashboard() {
    setLoadingData(true);
    setDataError(null);
    try {
      const [nextOrders, nextProducts] = await Promise.all([
        loadAdminOrders(),
        loadAdminProducts(),
      ]);
      setOrders(nextOrders);
      setProducts(nextProducts);
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : "Failed to load admin data",
      );
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (!sessionEmail) return;
    void loadDashboard();
  }, [sessionEmail]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderQuery, statusFilter]);

  useEffect(() => {
    setInventoryPage(1);
  }, [inventoryQuery, categoryFilter, stockFilter]);

  const filteredOrders = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        order.id,
        order.fullName,
        order.phone,
        order.paymentReference,
        order.address,
        order.zoneLabel,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, orderQuery, statusFilter]);

  const filteredProducts = useMemo(() => {
    const q = inventoryQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }
      if (stockFilter === "low" && !(product.stock > 0 && product.stock <= 5)) {
        return false;
      }
      if (stockFilter === "out" && product.stock !== 0) return false;
      if (stockFilter === "hidden" && product.isActive) return false;
      if (!q) return true;
      const haystack = [
        product.id,
        product.name,
        CATEGORY_LABELS[product.category],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [products, inventoryQuery, categoryFilter, stockFilter]);

  const orderPager = paginate(filteredOrders, orderPage, ADMIN_PAGE_SIZE);
  const inventoryPager = paginate(
    filteredProducts,
    inventoryPage,
    ADMIN_PAGE_SIZE,
  );

  const pendingCount = orders.filter(
    (order) => order.status === "pending_payment",
  ).length;
  const paidCount = orders.filter((order) => order.status === "paid").length;
  const lowStockCount = products.filter(
    (product) => product.isActive && product.stock > 0 && product.stock <= 5,
  ).length;
  const listedCount = products.filter((product) => product.isActive).length;

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const session = await adminSignIn(email, password);
      setSessionEmail(session?.user.email ?? email);
      setPassword("");
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Login failed. Check credentials.",
      );
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await adminSignOut();
    setSessionEmail(null);
    setOrders([]);
    setProducts([]);
    setInvoiceOrder(null);
    setDetailOrder(null);
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setSavingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
      setInvoiceOrder((current) =>
        current?.id === orderId ? { ...current, status } : current,
      );
      setDetailOrder((current) =>
        current?.id === orderId ? { ...current, status } : current,
      );
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : "Could not update order status",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleProductSave(
    product: AdminProduct,
    patch: AdminProductPatch,
  ) {
    setSavingId(product.id);
    try {
      await updateAdminProduct(product.id, patch);
      setProducts((prev) =>
        prev.map((row) => {
          if (row.id !== product.id) return row;
          return {
            ...row,
            stock: patch.stock ?? row.stock,
            price: patch.price ?? row.price,
            name: patch.name ?? row.name,
            imageUrl: patch.imageUrl ?? row.imageUrl,
            image:
              patch.imageUrl != null
                ? resolveProductImage(patch.imageUrl)
                : row.image,
            badge:
              patch.badge === undefined
                ? row.badge
                : (patch.badge ?? undefined),
            compareAt:
              patch.compareAt === undefined
                ? row.compareAt
                : (patch.compareAt ?? undefined),
            isActive: patch.isActive ?? row.isActive,
            cardDetails:
              patch.cardDetails === undefined
                ? row.cardDetails
                : (patch.cardDetails ?? undefined),
            boxDetails:
              patch.boxDetails === undefined
                ? row.boxDetails
                : (patch.boxDetails ?? undefined),
            packDetails:
              patch.packDetails === undefined
                ? row.packDetails
                : (patch.packDetails ?? undefined),
          };
        }),
      );
      setDetailProduct((current) => {
        if (!current || current.id !== product.id) return current;
        return {
          ...current,
          stock: patch.stock ?? current.stock,
          price: patch.price ?? current.price,
          name: patch.name ?? current.name,
          imageUrl: patch.imageUrl ?? current.imageUrl,
          image:
            patch.imageUrl != null
              ? resolveProductImage(patch.imageUrl)
              : current.image,
          badge:
            patch.badge === undefined
              ? current.badge
              : (patch.badge ?? undefined),
          compareAt:
            patch.compareAt === undefined
              ? current.compareAt
              : (patch.compareAt ?? undefined),
          isActive: patch.isActive ?? current.isActive,
          cardDetails:
            patch.cardDetails === undefined
              ? current.cardDetails
              : (patch.cardDetails ?? undefined),
          boxDetails:
            patch.boxDetails === undefined
              ? current.boxDetails
              : (patch.boxDetails ?? undefined),
          packDetails:
            patch.packDetails === undefined
              ? current.packDetails
              : (patch.packDetails ?? undefined),
        };
      });
      await refreshShop();
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : "Could not update product",
      );
      throw err;
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemoveConfirm() {
    if (!pendingRemove) return;
    const { product, mode } = pendingRemove;

    setSavingId(product.id);
    try {
      await deleteAdminProduct(product.id, mode);
      if (mode === "hard") {
        setProducts((prev) => prev.filter((row) => row.id !== product.id));
      } else if (mode === "list") {
        setProducts((prev) =>
          prev.map((row) =>
            row.id === product.id ? { ...row, isActive: true } : row,
          ),
        );
      } else {
        setProducts((prev) =>
          prev.map((row) =>
            row.id === product.id
              ? { ...row, isActive: false, stock: 0 }
              : row,
          ),
        );
      }
      setPendingRemove(null);
      await refreshShop();
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : "Could not update product listing",
      );
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    setDetailOrder((prev) => {
      if (!prev) return prev;
      return orders.find((order) => order.id === prev.id) ?? null;
    });
  }, [orders]);

  function renderChrome(actions?: ReactNode) {
    return (
      <div className="sticky-chrome">
        <header className="site-header">
          <button
            type="button"
            className="brand"
            aria-label="Back to Cortez TCG store"
            onClick={onBackHome}
          >
            <img
              src={logo}
              alt=""
              className="brand-mark"
              width={40}
              height={40}
            />
            <span className="brand-text">
              <span className="brand-name">Cortez TCG Live</span>
              <span className="brand-tag">Inventory desk</span>
            </span>
          </button>
          <div
            className="header-actions admin-header-actions"
            role="toolbar"
            aria-label="Desk actions"
          >
            {actions}
            <button
              type="button"
              className="admin-header-link is-store"
              onClick={onBackHome}
            >
              ← Store
            </button>
          </div>
        </header>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        {renderChrome()}
        <section className="admin-page">
          <h1 className="admin-title">Inventory desk</h1>
          <p className="admin-lead">
            Add Supabase keys in `.env.local` before using the admin desk.
          </p>
        </section>
      </>
    );
  }

  if (authChecking) {
    return (
      <>
        {renderChrome()}
        <section className="admin-page">
          <p className="admin-lead">Checking admin session…</p>
        </section>
      </>
    );
  }

  if (!sessionEmail) {
    return (
      <>
        {renderChrome()}
        <section className="admin-page admin-page-login">
          <div className="admin-login-card">
            <p className="admin-kicker">Owner access</p>
            <h1 className="admin-title">Inventory desk</h1>
            <p className="admin-lead">
              Sign in with your Supabase Auth email to manage stock, fees, and
              customer invoices.
            </p>
            <form className="admin-login" onSubmit={handleLogin}>
              <label className="field">
                <span className="field-label">Email</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {loginError && (
                <p className="field-error" role="alert">
                  {loginError}
                </p>
              )}
              <button
                type="submit"
                className="cart-primary-btn"
                disabled={loggingIn}
              >
                {loggingIn ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {renderChrome(
        <>
          <button
            type="button"
            className="admin-header-btn"
            onClick={() => void loadDashboard()}
            disabled={loadingData}
          >
            Refresh
          </button>
          <button
            type="button"
            className="admin-header-link"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </>,
      )}
      <section className="admin-page">
      <p className="admin-session">Signed in as {sessionEmail}</p>

      {loadingData ? (
        <AdminStatsSkeleton />
      ) : (
      <div className="admin-stats" aria-label="Desk summary">
        <article>
          <p>Orders</p>
          <strong>{orders.length}</strong>
        </article>
        <article>
          <p>Awaiting payment</p>
          <strong>{pendingCount}</strong>
        </article>
        <article>
          <p>Paid to pack</p>
          <strong>{paidCount}</strong>
        </article>
        <article>
          <p>Listed SKUs</p>
          <strong>{listedCount}</strong>
        </article>
        <article>
          <p>Low stock</p>
          <strong>{lowStockCount}</strong>
        </article>
      </div>
      )}

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "orders"}
          className={tab === "orders" ? "is-active" : ""}
          onClick={() => {
            setDetailOrder(null);
            setDetailProduct(null);
            setCreatingProduct(false);
            setTab("orders");
          }}
        >
          Orders
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "inventory"}
          className={tab === "inventory" ? "is-active" : ""}
          onClick={() => {
            setDetailOrder(null);
            setDetailProduct(null);
            setCreatingProduct(false);
            setTab("inventory");
          }}
        >
          Catalog / stock
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "streams"}
          className={tab === "streams" ? "is-active" : ""}
          onClick={() => {
            setDetailOrder(null);
            setDetailProduct(null);
            setCreatingProduct(false);
            setTab("streams");
          }}
        >
          Streams
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "home"}
          className={tab === "home" ? "is-active" : ""}
          onClick={() => {
            setDetailOrder(null);
            setDetailProduct(null);
            setCreatingProduct(false);
            setTab("home");
          }}
        >
          Home
        </button>
      </div>

      {dataError && (
        <p className="field-error" role="alert">
          {dataError}
        </p>
      )}
      {loadingData && (
        <AdminTableSkeleton
          rows={6}
          cols={tab === "orders" ? 6 : tab === "inventory" ? 5 : 4}
        />
      )}

      {tab === "orders" && detailOrder && !loadingData && (
        <AdminOrderDetail
          order={detailOrder}
          saving={savingId === detailOrder.id}
          onBack={() => setDetailOrder(null)}
          onStatusChange={(status) =>
            void handleStatusChange(detailOrder.id, status)
          }
          onOpenInvoice={() => setInvoiceOrder(detailOrder)}
        />
      )}

      {tab === "orders" && !detailOrder && !loadingData && (
        <>
          <div className="admin-toolbar">
            <label className="field admin-search">
              <span className="field-label">Search</span>
              <input
                type="search"
                placeholder="Order ID, name, phone, ref…"
                value={orderQuery}
                onChange={(event) => setOrderQuery(event.target.value)}
              />
            </label>
            <div className="field">
              <AdminSelect
                label="Status"
                value={statusFilter}
                options={[
                  { value: "all", label: "All statuses" },
                  ...STATUS_OPTIONS.map((status) => ({
                    value: status,
                    label: statusLabel(status),
                  })),
                ]}
                onChange={(next) =>
                  setStatusFilter(next as OrderStatus | "all")
                }
              />
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Zone</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orderPager.slice.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-empty">
                      No orders match this filter.
                    </td>
                  </tr>
                ) : (
                  orderPager.slice.map((order) => (
                    <tr
                      key={order.id}
                      className="admin-row-clickable"
                      tabIndex={0}
                      onClick={() => setDetailOrder(order)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setDetailOrder(order);
                        }
                      }}
                    >
                      <td>
                        <strong>{order.id}</strong>
                        <p className="admin-muted">
                          {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td>
                        <strong>{order.fullName}</strong>
                        <p className="admin-muted">{order.phone}</p>
                      </td>
                      <td>{order.zoneLabel}</td>
                      <td>
                        <strong>{formatOrderMoney(order.grandTotal)}</strong>
                      </td>
                      <td>
                        <span className={`admin-status is-${order.status}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="admin-muted">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button
              type="button"
              className="pagination-btn"
              disabled={orderPager.safePage <= 1}
              onClick={() => setOrderPage(orderPager.safePage - 1)}
            >
              Previous
            </button>
            <p>
              {filteredOrders.length === 0
                ? "0 orders"
                : `${orderPager.start + 1}–${Math.min(orderPager.start + ADMIN_PAGE_SIZE, filteredOrders.length)} of ${filteredOrders.length}`}
            </p>
            <button
              type="button"
              className="pagination-btn"
              disabled={orderPager.safePage >= orderPager.totalPages}
              onClick={() => setOrderPage(orderPager.safePage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {tab === "inventory" && creatingProduct && !loadingData && (
        <AdminProductDetail
          mode="create"
          saving={savingId === "new-product"}
          onBack={() => setCreatingProduct(false)}
          onCreate={async (input) => {
            setSavingId("new-product");
            try {
              await createAdminProduct(input);
              setCreatingProduct(false);
              await loadDashboard();
              await refreshShop();
            } finally {
              setSavingId(null);
            }
          }}
        />
      )}

      {tab === "inventory" && detailProduct && !creatingProduct && !loadingData && (
        <AdminProductDetail
          mode="edit"
          product={detailProduct}
          saving={savingId === detailProduct.id}
          onBack={() => setDetailProduct(null)}
          onSaveEdit={async (patch) => {
            await handleProductSave(detailProduct, patch);
            setDetailProduct(null);
          }}
        />
      )}

      {tab === "inventory" &&
        !detailProduct &&
        !creatingProduct &&
        !loadingData && (
        <section
          className="admin-inventory"
          aria-labelledby="inventory-admin-heading"
        >
          <div className="admin-section-head">
            <h2 id="inventory-admin-heading" className="admin-section-title">
              Catalog / stock
            </h2>
            <p className="admin-muted">
              Browse inventory here. Add or edit opens a dedicated form — same
              pattern as streams.
            </p>
          </div>

          <div className="admin-toolbar">
            <button
              type="button"
              className="cart-primary-btn admin-add-btn"
              onClick={() => {
                setDetailProduct(null);
                setCreatingProduct(true);
              }}
            >
              Add product
            </button>
          </div>

          <div className="admin-toolbar is-catalog">
            <label className="field admin-search">
              <span className="field-label">Search</span>
              <input
                type="search"
                placeholder="SKU, name, category…"
                value={inventoryQuery}
                onChange={(event) => setInventoryQuery(event.target.value)}
              />
            </label>
            <div className="field">
              <AdminSelect
                label="Category"
                value={categoryFilter}
                options={[
                  { value: "all", label: "All categories" },
                  ...(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(
                    (category) => ({
                      value: category,
                      label: CATEGORY_LABELS[category],
                    }),
                  ),
                ]}
                onChange={(next) =>
                  setCategoryFilter(next as ProductCategory | "all")
                }
              />
            </div>
            <div className="field">
              <AdminSelect
                label="Stock"
                value={stockFilter}
                options={[
                  { value: "all", label: "All stock" },
                  { value: "low", label: "Low (1–5)" },
                  { value: "out", label: "Sold out" },
                  { value: "hidden", label: "Unlisted" },
                ]}
                onChange={(next) =>
                  setStockFilter(
                    next as "all" | "low" | "out" | "hidden",
                  )
                }
              />
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryPager.slice.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      No catalog rows match this filter.
                    </td>
                  </tr>
                ) : (
                  inventoryPager.slice.map((product) => {
                    const onSale =
                      product.compareAt != null &&
                      product.compareAt > product.price;
                    return (
                      <tr
                        key={product.id}
                        className={!product.isActive ? "is-unlisted" : ""}
                      >
                        <td>
                          <div className="admin-inventory-copy">
                            <img
                              src={product.image}
                              alt=""
                              width={40}
                              height={56}
                            />
                            <div>
                              <strong>{product.name}</strong>
                              <p className="admin-muted">
                                {CATEGORY_LABELS[product.category]}
                                <span className="admin-sku">
                                  {" "}
                                  · SKU {product.id}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>{product.stock}</td>
                        <td>
                          <span className="admin-price-now">
                            {formatOrderMoney(product.price)}
                          </span>
                          {onSale && (
                            <p className="admin-muted admin-price-was">
                              was {formatOrderMoney(product.compareAt!)}
                            </p>
                          )}
                        </td>
                        <td>
                          <span
                            className={`admin-list-pill${product.isActive ? " is-listed" : ""}`}
                          >
                            {product.isActive ? "Listed" : "Unlisted"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="admin-text-btn"
                              disabled={savingId === product.id}
                              onClick={() => setDetailProduct(product)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="admin-text-btn"
                              disabled={savingId === product.id}
                              onClick={() =>
                                setPendingRemove({
                                  product,
                                  mode: product.isActive ? "unlist" : "list",
                                })
                              }
                            >
                              {product.isActive ? "Unlist" : "List"}
                            </button>
                            <button
                              type="button"
                              className="admin-text-btn is-danger"
                              disabled={savingId === product.id}
                              onClick={() =>
                                setPendingRemove({ product, mode: "hard" })
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button
              type="button"
              className="pagination-btn"
              disabled={inventoryPager.safePage <= 1}
              onClick={() => setInventoryPage(inventoryPager.safePage - 1)}
            >
              Previous
            </button>
            <p>
              {filteredProducts.length === 0
                ? "0 items"
                : `${inventoryPager.start + 1}–${Math.min(inventoryPager.start + ADMIN_PAGE_SIZE, filteredProducts.length)} of ${filteredProducts.length}`}
            </p>
            <button
              type="button"
              className="pagination-btn"
              disabled={
                inventoryPager.safePage >= inventoryPager.totalPages
              }
              onClick={() => setInventoryPage(inventoryPager.safePage + 1)}
            >
              Next
            </button>
          </div>
        </section>
      )}

      {tab === "streams" && !loadingData && (
        <AdminStreamsPanel onChanged={() => void refreshShop()} />
      )}

      {tab === "home" && !loadingData && (
        <AdminHomePanel onChanged={() => void refreshShop()} />
      )}

      {pendingRemove && (
        <AdminConfirmDialog
          title={
            pendingRemove.mode === "list"
              ? "List in shop?"
              : pendingRemove.mode === "unlist"
                ? "Unlist from shop?"
                : "Delete item?"
          }
          message={
            pendingRemove.mode === "list"
              ? `“${pendingRemove.product.name}” will show in the catalog again. Update stock on Edit if it’s still 0.`
              : pendingRemove.mode === "unlist"
                ? `“${pendingRemove.product.name}” will be hidden from customers and stock set to 0.`
                : `Permanently remove “${pendingRemove.product.name}”? This only works if it was never ordered. Prefer Unlist if unsure.`
          }
          confirmLabel={
            pendingRemove.mode === "list"
              ? "List item"
              : pendingRemove.mode === "unlist"
                ? "Unlist item"
                : "Delete forever"
          }
          danger={pendingRemove.mode === "hard"}
          busy={savingId === pendingRemove.product.id}
          onCancel={() => {
            if (savingId !== pendingRemove.product.id) setPendingRemove(null);
          }}
          onConfirm={() => void handleRemoveConfirm()}
        />
      )}

      {invoiceOrder && (
        <AdminInvoice
          order={invoiceOrder}
          shopName={settings.shopName}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
      </section>
    </>
  );
}
