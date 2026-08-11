import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../data/products";
import type { StreamEvent } from "../data/streams";
import type { ShippingZone } from "../data/shipping";
import {
  loadShopCatalog,
  type ShopCatalog,
  type ShopSettings,
} from "./shopApi";
import { GST_RATE } from "./money";
import { paymentAccounts } from "../data/payment";
import { shippingZones as fallbackZones } from "../data/shipping";
import { products as fallbackProducts } from "../data/products";
import { streams as fallbackStreams } from "../data/streams";
import localPaymentQr from "../assets/payment-qr.png";
import { DEFAULT_HOME_HIGHLIGHT } from "./homeHighlight";

type ShopContextValue = {
  products: Product[];
  streams: StreamEvent[];
  shippingZones: ShippingZone[];
  settings: ShopSettings;
  /** True while a catalog request is in flight. */
  loading: boolean;
  /** False until the first catalog attempt finishes. */
  ready: boolean;
  error: string | null;
  source: ShopCatalog["source"] | null;
  refresh: () => Promise<void>;
};

const defaultSettings: ShopSettings = {
  shopName: "Cortez TCG Live",
  gstRate: GST_RATE,
  paymentAccounts,
  paymentQrUrl: localPaymentQr,
  homeHighlight: { ...DEFAULT_HOME_HIGHLIGHT },
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [streams, setStreams] = useState<StreamEvent[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [source, setSource] = useState<ShopCatalog["source"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const catalog = await loadShopCatalog();
      setProducts(catalog.products);
      setStreams(catalog.streams);
      setShippingZones(catalog.shippingZones);
      setSettings(catalog.settings);
      setSource(catalog.source);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load shop catalog";
      setError(message);
      // Only swap in local fallback when we have nothing to show yet.
      setProducts((prev) => (prev.length > 0 ? prev : fallbackProducts));
      setStreams((prev) => (prev.length > 0 ? prev : fallbackStreams));
      setShippingZones((prev) => (prev.length > 0 ? prev : fallbackZones));
      setSettings((prev) => prev ?? defaultSettings);
      setSource((prev) => prev ?? "local");
    } finally {
      setLoading(false);
      setReady(true);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ShopContext.Provider
      value={{
        products,
        streams,
        shippingZones,
        settings,
        loading,
        ready,
        error,
        source,
        refresh,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return value;
}
