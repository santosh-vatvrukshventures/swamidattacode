import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { onSyncStatus, offlineFetch } from "./offlineQueue";
import {
  Store,
  Package,
  Layers,
  DollarSign,
  PieChart,
  User,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  RefreshCw,
  Search,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  X,
  CreditCard,
  Terminal,
  FileText,
  Info,
  Smartphone,
  Save,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Truck,
  Trash2,
  Edit,
  ArrowUpDown,
  Download,
  WifiOff,
  Wifi,
  CloudOff,
  RotateCw,
  Menu,
  Settings,
  Database
} from "lucide-react";
import { Item, Sale, Expense, Inward, CustomerOrder, CustomerOrderItem, Offer } from "./types";
import logoNav from "./assets/images/regenerated_image_1783886868730.webp";
import logoHeader from "./assets/images/regenerated_image_1783886867135.webp";
import CustomerPortal from "./CustomerPortal";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"pos" | "inventory" | "ledger" | "expenses" | "reports" | "purchases" | "online_orders">("pos");
  
  // URL Params Check for Customer Mode
  const urlParams = new URLSearchParams(window.location.search);
  const isCustomerMode = urlParams.get("mode") === "order";
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return localStorage.getItem("swamidatta_authorized") === "true";
  });
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  // Database Connection Status
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    mode: "Offline/Local Storage",
    details: "Connecting to database service..."
  });

  // Client Data States
  const [items, setItems] = useState<Item[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inwards, setInwards] = useState<Inward[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [newOfferText, setNewOfferText] = useState("");
  const [loading, setLoading] = useState(true);

  // Purchases (Inward) Form State
  const [supplierName, setSupplierName] = useState("");
  const [inwardDate, setInwardDate] = useState(new Date().toISOString().split("T")[0]);
  const [inwardCart, setInwardCart] = useState<{ item: Item; qty: number; rate: number }[]>([]);
  const [selectedInwardItem, setSelectedInwardItem] = useState<string>("");
  const [inwardItemQty, setInwardItemQty] = useState<number>(1);
  const [inwardItemRate, setInwardItemRate] = useState<number>(0);

  // Product Performance Query Sales View/Correct States
  const [selectedReportItem, setSelectedReportItem] = useState<Item | null>(null);
  const [showItemSalesModal, setShowItemSalesModal] = useState(false);
  const [editingSaleVoucher, setEditingSaleVoucher] = useState<Sale | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [originalEditingItemId, setOriginalEditingItemId] = useState<string | null>(null);
  const [isEditIdManuallyEdited, setIsEditIdManuallyEdited] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [inventoryView, setInventoryView] = useState<"table" | "cards">("table");
  const [posSearchQuery, setPosSearchQuery] = useState("");
  const [inventorySortKey, setInventorySortKey] = useState<"category" | "stock" | "name" | null>(null);
  const [inventorySortDirection, setInventorySortDirection] = useState<"asc" | "desc">("asc");
  const [inwardSortKey, setInwardSortKey] = useState<"supplier" | "item" | null>(null);
  const [inwardSortDirection, setInwardSortDirection] = useState<"asc" | "desc">("asc");
  const [expenseSortKey, setExpenseSortKey] = useState<"category" | "remarks" | null>(null);
  const [expenseSortDirection, setExpenseSortDirection] = useState<"asc" | "desc">("asc");
  const [debtSortKey, setDebtSortKey] = useState<"customer" | null>(null);
  const [debtSortDirection, setDebtSortDirection] = useState<"asc" | "desc">("asc");

  // POS State
  const [customerName, setCustomerName] = useState("General Walk-In");
  const [customerType, setCustomerType] = useState<"Retail" | "Wholesale">("Retail");
  const [cart, setCart] = useState<{ item: Item; qty: number }[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Credit">("Cash");
  const [customersList, setCustomersList] = useState<string[]>([]);
  const [suppliersList, setSuppliersList] = useState<string[]>([]);

  // Dialog/Form States
  const [showRestockModal, setShowRestockModal] = useState<Item | null>(null);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [restockMode, setRestockMode] = useState<"add" | "reduce">("add");
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showManageCustomersModal, setShowManageCustomersModal] = useState(false);
  const [showManageSuppliersModal, setShowManageSuppliersModal] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [showManageExpenseCategoriesModal, setShowManageExpenseCategoriesModal] = useState(false);
  const [editingExpenseCategory, setEditingExpenseCategory] = useState<string | null>(null);
  const [newExpenseCategoryName, setNewExpenseCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState<Sale | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [financialLedgerQuery, setFinancialLedgerQuery] = useState<"revenue" | "outstanding" | null>(null);
  
  // New Item Form State
  const [newItem, setNewItem] = useState({
    item_id: "",
    name: "",
    category: "Disposables",
    purchase_price: 0,
    selling_price_retail: 0,
    selling_price_wholesale: 0,
    current_stock_qty: 100,
    min_stock_alert: 20
  });

  // Reports Filter Period State
  const [reportPeriod, setReportPeriod] = useState<"7days" | "30days" | "thismonth" | "all">("30days");
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [reportItemSearchQuery, setReportItemSearchQuery] = useState("");

  // Table Sorting logic
  const sortedInwards = React.useMemo(() => {
    let result = [...inwards];
    if (inwardSortKey) {
      result.sort((a, b) => {
        const valA = inwardSortKey === "supplier" 
          ? (a?.supplier_name || "").toLowerCase() 
          : (a?.items_received || []).map(i => i.item_id).join(", ").toLowerCase();
        const valB = inwardSortKey === "supplier" 
          ? (b?.supplier_name || "").toLowerCase() 
          : (b?.items_received || []).map(i => i.item_id).join(", ").toLowerCase();
        if (valA < valB) return inwardSortDirection === "asc" ? -1 : 1;
        if (valA > valB) return inwardSortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [inwards, inwardSortKey, inwardSortDirection]);

  const sortedExpenses = React.useMemo(() => {
    let result = [...expenses];
    if (expenseSortKey) {
      result.sort((a, b) => {
        const getVal = (exp: Expense) => {
          if (!exp) return "";
          return expenseSortKey === "category" ? String(exp.category || "") : String(exp.remarks || "");
        };
        const valA = getVal(a).toLowerCase();
        const valB = getVal(b).toLowerCase();
        if (valA < valB) return expenseSortDirection === "asc" ? -1 : 1;
        if (valA > valB) return expenseSortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [expenses, expenseSortKey, expenseSortDirection]);

  const sortedDebtsSales = React.useMemo(() => {
    let result = [...sales];
    result.sort((a, b) => {
      const aBalance = a.net_amount_payable - (a.payment_received || 0);
      const bBalance = b.net_amount_payable - (b.payment_received || 0);
      const aUnpaid = aBalance > 0;
      const bUnpaid = bBalance > 0;
      
      // Primary: Unpaid vs Paid
      if (aUnpaid && !bUnpaid) return -1;
      if (!aUnpaid && bUnpaid) return 1;

      // Secondary: Alphabetical Customer Profile if sort key is set
      if (debtSortKey === "customer") {
        const aName = (a.customer_name || "").toLowerCase();
        const bName = (b.customer_name || "").toLowerCase();
        if (aName < bName) return debtSortDirection === "asc" ? -1 : 1;
        if (aName > bName) return debtSortDirection === "asc" ? 1 : -1;
      }
      
      // Fallback: Date descending (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return result;
  }, [sales, debtSortKey, debtSortDirection]);

  // PWA States
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [syncToast, setSyncToast] = useState<{ message: string; type: string } | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Edit Expense / Inward States
  const [showEditExpenseModal, setShowEditExpenseModal] = useState<Expense | null>(null);
  const [showEditInwardModal, setShowEditInwardModal] = useState<Inward | null>(null);
  const [inwardEditCart, setInwardEditCart] = useState<{ item: Item; qty: number; rate: number }[]>([]);
  const [editInwardSupplier, setEditInwardSupplier] = useState("");
  const [editInwardDate, setEditInwardDate] = useState("");
  const [selectedEditInwardItem, setSelectedEditInwardItem] = useState("");
  const [editInwardItemQty, setEditInwardItemQty] = useState(1);
  const [editInwardItemRate, setEditInwardItemRate] = useState(0);

  const handlePeriodChange = (period: "7days" | "30days" | "thismonth" | "all") => {
    setReportPeriod(period);
    const today = new Date();
    const endStr = today.toISOString().split("T")[0];
    setReportEndDate(endStr);

    if (period === "7days") {
      const d = new Date();
      d.setDate(today.getDate() - 7);
      setReportStartDate(d.toISOString().split("T")[0]);
    } else if (period === "30days") {
      const d = new Date();
      d.setDate(today.getDate() - 30);
      setReportStartDate(d.toISOString().split("T")[0]);
    } else if (period === "thismonth") {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      setReportStartDate(d.toISOString().split("T")[0]);
    } else if (period === "all") {
      setReportStartDate("2020-01-01");
    }
  };

  // Notification logs for the bottom status strip
  const [logs, setLogs] = useState<string[]>([
    "System initialized. Offline-first local storage fallback ready."
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 4)]);
  };

  // Capacitor Hardware Back Button handler
  useEffect(() => {
    let listener: any;
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        const openModals = document.querySelectorAll('.fixed.inset-0');
        if (openModals.length > 0) {
          const topModal = openModals[openModals.length - 1];
          const closeBtn = Array.from(topModal.querySelectorAll('button')).find(
            b => b.textContent?.includes('Cancel') || b.textContent?.includes('Close') || b.innerHTML.includes('lucide-x') || b.innerHTML.includes('<line ')
          );
          if (closeBtn) {
            (closeBtn as HTMLButtonElement).click();
          }
        } else {
          if (!canGoBack) {
            CapApp.exitApp();
          } else {
            window.history.back();
          }
        }
      }).then(l => listener = l).catch(() => {});
    }).catch(() => { /* Ignore on web */ });
    return () => { if (listener) listener.remove(); };
  }, []);

  // Sync Database status and records
  const fetchAllData = async () => {
    try {
      const statusRes = await fetch("/api/status");
      const statusData = await statusRes.json();
      setDbStatus(statusData);

      const itemsRes = await fetch("/api/items");
      const itemsData = await itemsRes.json();
      setItems(itemsData);

      const salesRes = await fetch("/api/sales");
      const salesData = await salesRes.json();
      setSales(salesData);

      const expensesRes = await fetch("/api/expenses");
      const expensesData = await expensesRes.json();
      setExpenses(expensesData);

      const inwardsRes = await fetch("/api/inwards");
      const inwardsData = await inwardsRes.json();
      setInwards(inwardsData);

      const catRes = await fetch("/api/categories");
      const catData = await catRes.json();
      setCategories(catData.map((c: any) => c.name));

      const custRes = await fetch("/api/customers");
      const custData = await custRes.json();
      setCustomersList(custData.map((c: any) => c.name));

      const suppRes = await fetch("/api/suppliers");
      const suppData = await suppRes.json();
      setSuppliersList(suppData.map((s: any) => s.name));

      const expCatRes = await fetch("/api/expense-categories");
      const expCatData = await expCatRes.json();
      setExpenseCategories(expCatData.map((c: any) => c.name));

      const ordersRes = await fetch("/api/customer-orders");
      const ordersData = await ordersRes.json();
      setCustomerOrders(ordersData);

      const offersRes = await fetch("/api/offers");
      const offersData = await offersRes.json();
      setOffers(offersData);
    } catch (err) {
      console.error("Fetch syncing error:", err);
      addLog("Database sync failure. Operating in offline storage mode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ─── PWA: Online/Offline Detection ─────────────────────
  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      addLog("Connection restored. Syncing queued changes...");
      fetchAllData();
    };
    const goOffline = () => {
      setIsOffline(true);
      addLog("You are offline. Changes will be queued and synced when back online.");
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ─── PWA: Install Prompt ───────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      // Only show banner if not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      addLog('App installed to home screen!');
    }
    setDeferredInstallPrompt(null);
    setShowInstallBanner(false);
  }, [deferredInstallPrompt]);

  // ─── PWA: Offline Sync Status ──────────────────────────
  useEffect(() => {
    const unsub = onSyncStatus((event) => {
      setPendingQueueCount(event.count);
      if (event.message) {
        setSyncToast({ message: event.message, type: event.type });
        addLog(event.message);
        // Auto-dismiss after 4 seconds
        setTimeout(() => setSyncToast(null), 4000);
        // Refresh data after sync completes
        if (event.type === 'synced') {
          setTimeout(() => fetchAllData(), 500);
        }
      }
    });
    return unsub;
  }, []);

  // ─── PWA: Service Worker Update Detection ──────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSwRegistration(detail.registration);
      setShowUpdateToast(true);
    };
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  const handleUpdateApp = useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateToast(false);
      window.location.reload();
    }
  }, [swRegistration]);

  const generateSuggestedCode = (name: string, category: string): string => {
    if (!name || !category) return "";
    const catPart = category.trim().substring(0, 3).toUpperCase();
    const words = name.trim().split(/\s+/);
    const initialsPart = words
      .map(w => w.charAt(0))
      .join("")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    
    let attempts = 0;
    let suggested = "";
    while (attempts < 100) {
      const randDigits = Math.floor(100 + Math.random() * 900).toString();
      suggested = `${catPart}${initialsPart}${randDigits}`;
      const conflict = items.some(item => String(item?.item_id || "").toLowerCase() === suggested.toLowerCase());
      if (!conflict) {
        break;
      }
      attempts++;
    }
    return suggested;
  };

  useEffect(() => {
    if (showNewItemModal && !isIdManuallyEdited) {
      if (newItem.name.trim() && newItem.category) {
        const suggested = generateSuggestedCode(newItem.name, newItem.category);
        setNewItem(prev => ({ ...prev, item_id: suggested }));
      } else {
        setNewItem(prev => ({ ...prev, item_id: "" }));
      }
    }
  }, [newItem.name, newItem.category, showNewItemModal, isIdManuallyEdited]);

  // POS Actions
  const addToCart = (item: Item) => {
    if (item.current_stock_qty <= 0) {
      addLog(`Warning: ${item.name} is completely out of stock!`);
    }
    const existing = cart.find((c) => c.item.item_id === item.item_id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.item.item_id === item.item_id ? { ...c, qty: c.qty + 1 } : c
        )
      );
    } else {
      setCart([...cart, { item, qty: 1 }]);
    }
    addLog(`Added ${item.name} to checkout bill.`);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(
      cart
        .map((c) => {
          if (c.item.item_id === itemId) {
            const nextQty = c.qty + delta;
            return { ...c, qty: nextQty };
          }
          return c;
        })
        .filter((c) => c.qty > 0)
    );
  };

  const setCartItemQty = (itemId: string, newQty: number) => {
    setCart(
      cart
        .map((c) => {
          if (c.item.item_id === itemId) {
            return { ...c, qty: newQty };
          }
          return c;
        })
        .filter((c) => c.qty > 0)
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, c) => {
      const price =
        customerType === "Retail"
          ? c.item.selling_price_retail
          : c.item.selling_price_wholesale;
      return total + price * c.qty;
    }, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const grossTotal = getCartTotal();
    const netAmountPayable = Math.max(0, grossTotal - discount);
    const saleId = `SALE_${Date.now().toString().slice(-6)}`;

    const itemsSold = cart.map((c) => {
      const price =
        customerType === "Retail"
          ? c.item.selling_price_retail
          : c.item.selling_price_wholesale;
      return {
        item_id: c.item.item_id,
        name: c.item.name,
        qty_sold: c.qty,
        unit_price: price,
        total_item_price: price * c.qty,
        purchase_cost_at_time: c.item.purchase_price
      };
    });

    const finalCustomerName = customerName.trim() || "General Walk-In";

    const newSale: Sale = {
      sale_id: saleId,
      date: new Date().toISOString(),
      customer_name: finalCustomerName,
      customer_type: customerType,
      items_sold: itemsSold,
      gross_total: grossTotal,
      discount_given: discount,
      net_amount_payable: netAmountPayable,
      payment_mode: paymentMode,
      payment_received: paymentMode === "Credit" ? 0 : netAmountPayable
    };

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSale)
      });
      const data = await res.json();
      addLog(`Invoice ${saleId} dispatched successfully (${data.mode || "cloud"} mode).`);

      // Auto-save new customer
      if (finalCustomerName) {
        fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: finalCustomerName })
        }).catch(err => console.error("Auto-save customer failed:", err));
      }

      // ClearPOS
      setCart([]);
      setCustomerName("General Walk-In");
      setDiscount(0);
      setPaymentMode("Cash");
      
      // Sync State
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to write invoice checkout.");
    }
  };

  // Inventory Restock Action
  const handleRestock = async () => {
    if (!showRestockModal) return;
    try {
      const finalQty = (restockMode === "reduce" || restockMode === "wastage") ? -restockQty : restockQty;

      if (restockMode === "wastage") {
        const costLost = restockQty * showRestockModal.purchase_price;
        const expenseId = `EXP_${Date.now().toString().slice(-6)}`;
        const newExpense: Expense = {
          expense_id: expenseId,
          date: new Date().toISOString(),
          category: "Inventory Wastage",
          amount: costLost,
          remarks: `Logged wastage of ${restockQty} units of ${showRestockModal.name} (${showRestockModal.item_id})`
        };

        const expRes = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newExpense)
        });
        if (!expRes.ok) throw new Error("Failed to create wastage expense");
      }

      const res = await fetch("/api/items/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: showRestockModal.item_id,
          qty_to_add: finalQty
        })
      });
      await res.json();
      
      if (restockMode === "wastage") {
        addLog(`Logged wastage: Reduced -${restockQty} units from ${showRestockModal.name} and created expense.`);
      } else if (restockMode === "reduce") {
        addLog(`Logged stock reduction: Reduced -${restockQty} units from ${showRestockModal.name}.`);
      } else {
        addLog(`Logged stock inward: Added +${restockQty} units to ${showRestockModal.name}.`);
      }
      setShowRestockModal(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to log stock adjustment.");
      alert("Failed to log stock adjustment.");
    }
  };

  // Add New Catalog Item Action
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.item_id || !newItem.name) return;

    const formattedId = String(newItem.item_id || "").trim().toLowerCase().replace(/\s+/g, "_");
    const exists = items.some(
      (item) => String(item?.item_id || "").toLowerCase() === formattedId
    );
    if (exists) {
      alert(`Error: The Product Unique ID Code "${formattedId}" already exists. Duplicate item codes are denied.`);
      return;
    }

    const formattedItem: Item = {
      ...newItem,
      item_id: formattedId
    };

    const updatedItems = [...items, formattedItem];

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItems)
      });
      await res.json();
      addLog(`Created new item catalog listing: ${formattedItem.name}`);
      setShowNewItemModal(false);
      setNewItem({
        item_id: "",
        name: "",
        category: "Disposables",
        purchase_price: 0,
        selling_price_retail: 0,
        selling_price_wholesale: 0,
        current_stock_qty: 100,
        min_stock_alert: 20
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to sync new catalog item.");
    }
  };

  // Update Catalog Item Details (specifically for changing wholesale/retail prices, SKU ID, name, etc.)
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !originalEditingItemId) return;

    const formattedId = String(editingItem.item_id || "").trim().toLowerCase().replace(/\s+/g, "_");
    
    // Check if duplicate (only if changed)
    if (formattedId !== originalEditingItemId) {
      const exists = items.some(item => String(item?.item_id || "").toLowerCase() === formattedId);
      if (exists) {
        alert(`Error: The Product Unique ID Code "${formattedId}" already exists. Duplicate item codes are denied.`);
        return;
      }
    }

    const finalItem = { ...editingItem, item_id: formattedId };

    try {
      const res = await fetch(`/api/items/${originalEditingItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalItem)
      });
      await res.json();
      
      addLog(`Updated product / item: ${finalItem.name}`);
      setEditingItem(null);
      setOriginalEditingItemId(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to sync updated catalog item details.");
    }
  };
  // Category Management Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    
    // Prevent duplicates
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      alert("This category already exists.");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      await res.json();
      addLog(`Added new category: ${name}`);
      setNewCategoryName("");
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to create category.");
    }
  };

  const handleEditCategory = async (oldName: string, newName: string) => {
    const name = newName.trim();
    if (!name || name === oldName) {
      setEditingCategory(null);
      return;
    }
    
    // Prevent duplicates
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      alert("This category already exists.");
      setEditingCategory(null);
      return;
    }

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      await res.json();
      addLog(`Renamed category ${oldName} to ${name}`);
      setEditingCategory(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to rename category.");
    }
  };

  const handleDeleteCategory = async (name: string) => {
    const isUsed = items.some(i => i.category === name);
    if (isUsed) {
      alert(`Cannot delete category "${name}" because it is currently assigned to one or more inventory items. Please reassign those items to a different category first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(name)}`, {
        method: "DELETE"
      });
      await res.json();
      addLog(`Deleted category: ${name}`);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to delete category.");
    }
  };

  // Expense Category Management Handlers
  const handleCreateExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newExpenseCategoryName.trim();
    if (!name) return;
    
    if (expenseCategories.some(c => c.toLowerCase() === name.toLowerCase())) {
      alert("This expense category already exists.");
      return;
    }

    try {
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      await res.json();
      addLog(`Added new expense category: ${name}`);
      setNewExpenseCategoryName("");
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to create expense category.");
    }
  };

  const handleDeleteExpenseCategory = async (name: string) => {
    try {
      const res = await fetch(`/api/expense-categories/${encodeURIComponent(name)}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete expense category");
        return;
      }
      
      await res.json();
      addLog(`Deleted expense category: ${name}`);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to delete expense category.");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(`Are you sure you want to delete product "${itemId}"?`)) return;
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(itemId)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete item.");
        return;
      }
      addLog(`Deleted product: ${itemId}`);
      setShowNewItemModal(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to delete product.");
    }
  };

  const handleDeleteCustomer = async (name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(name)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete customer.");
        return;
      }
      addLog(`Deleted customer: ${name}`);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to delete customer.");
    }
  };

  const handleDeleteSupplier = async (name: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      const res = await fetch(`/api/suppliers/${encodeURIComponent(name)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete supplier.");
        return;
      }
      addLog(`Deleted supplier: ${name}`);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Failed to delete supplier.");
    }
  };

  // Settlement for Credit Customer Accounts
  const handleSettlement = async () => {
    if (!showSettlementModal) return;
    try {
      const res = await fetch("/api/sales/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_id: showSettlementModal.sale_id,
          payment_received: settlementAmount
        })
      });
      await res.json();
      addLog(`Ledger updated: Settlement of ₹${settlementAmount} accepted for Invoice ${showSettlementModal.sale_id}.`);
      setShowSettlementModal(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      addLog("Ledger settlement sync failed.");
    }
  };

  // Commit Inward Purchase Voucher
  const handleInwardSubmit = async () => {
    if (!supplierName.trim()) {
      alert("Please specify a supplier name.");
      return;
    }
    const totalCost = inwardCart.reduce((acc, c) => acc + (c.qty * c.rate), 0);
    if (totalCost <= 0) {
      alert("Inward purchase voucher total cost must be greater than 0.");
      return;
    }

    const inwardId = `INW_${Date.now().toString().slice(-6)}`;

    const newInward: Inward = {
      inward_id: inwardId,
      date: new Date(inwardDate).toISOString(),
      supplier_name: supplierName.trim(),
      items_received: inwardCart.map((c) => ({
        item_id: c.item.item_id,
        qty_added: c.qty,
        purchase_price_at_time: c.rate
      })),
      total_invoice_cost: totalCost
    };

    try {
      const res = await fetch("/api/inwards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInward)
      });
      await res.json();
      addLog(`Logged inward purchase voucher ${inwardId} from ${supplierName}: ₹${totalCost.toFixed(2)}`);
      
      // Auto-save new supplier
      if (supplierName.trim()) {
        fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: supplierName.trim() })
        }).catch(err => console.error("Auto-save supplier failed:", err));
      }

      // Clear form
      setSupplierName("");
      setInwardCart([]);
      setSelectedInwardItem("");
      setInwardItemQty(1);
      setInwardItemRate(0);

      fetchAllData();
    } catch (err) {
      console.error("Inward submit error:", err);
      addLog("Failed to sync inward purchase voucher.");
    }
  };

  // Delete Sale Voucher
  const handleDeleteSale = async (saleId: string) => {
    if (!confirm(`Are you sure you want to delete sale voucher ${saleId}? The quantities will be returned to inventory.`)) return;
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Deleted sale voucher ${saleId}. Inventory quantities restored.`);
        fetchAllData();
      } else {
        alert(data.error || "Failed to delete sale voucher.");
      }
    } catch (err) {
      console.error("Delete sale error:", err);
      addLog("Failed to delete sale voucher.");
    }
  };

  // Delete Expense Voucher
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm(`Are you sure you want to delete zero-amount expense voucher ${expenseId}?`)) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Deleted expense voucher ${expenseId}`);
        fetchAllData();
      } else {
        alert(data.error || "Failed to delete expense voucher.");
      }
    } catch (err) {
      console.error("Delete expense error:", err);
      addLog("Failed to delete expense voucher.");
    }
  };

  // Delete Inward Purchase Voucher
  const handleDeleteInward = async (inwardId: string) => {
    if (!confirm(`Are you sure you want to delete zero-amount inward purchase voucher ${inwardId}?`)) return;
    try {
      const res = await fetch(`/api/inwards/${inwardId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Deleted inward purchase voucher ${inwardId}`);
        fetchAllData();
      } else {
        alert(data.error || "Failed to delete inward purchase voucher.");
      }
    } catch (err) {
      console.error("Delete inward error:", err);
      addLog("Failed to delete inward purchase voucher.");
    }
  };

  // Edit Sale Voucher
  const handleEditSale = async (updatedSale: Sale) => {
    if (updatedSale.items_sold.length === 0) {
      // If all items were removed, delete the voucher entirely.
      await handleDeleteSale(updatedSale.sale_id);
      return;
    }

    try {
      const res = await fetch(`/api/sales/${updatedSale.sale_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSale)
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Successfully updated sale voucher ${updatedSale.sale_id}. Inventory reconciled.`);
        setEditingSaleVoucher(null);
        fetchAllData();
      } else {
        alert(data.error || "Failed to update sale voucher.");
      }
    } catch (err) {
      console.error("Edit sale error:", err);
      addLog("Failed to update sale voucher.");
    }
  };
  // Write Off Bad Debt
  const handleWriteOffDebt = async (sale: Sale, badDebtAmount: number) => {
    if (!confirm(`Are you sure you want to write off ₹${badDebtAmount.toFixed(2)} as Bad Debt for voucher ${sale.sale_id}? This will log an expense.`)) return;

    const expenseId = `EXP_${Date.now().toString().slice(-6)}`;
    const newExpense: Expense = {
      expense_id: expenseId,
      date: new Date().toISOString(),
      category: "Bad Debt Write-off",
      amount: badDebtAmount,
      remarks: `Write-off unpaid Udhaar for Sale Voucher ${sale.sale_id} (${sale.customer_name})`
    };

    try {
      const expRes = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense)
      });
      if (!expRes.ok) throw new Error("Failed to create bad debt expense");

      const updatedSale: Sale = {
        ...sale,
        payment_received: sale.net_amount_payable
      };

      const saleRes = await fetch(`/api/sales/${sale.sale_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSale)
      });
      if (!saleRes.ok) throw new Error("Failed to update sale voucher");

      addLog(`Wrote off ₹${badDebtAmount.toFixed(2)} for ${sale.sale_id}. Bad Debt expense created.`);
      fetchAllData();
    } catch (err) {
      console.error("Write off error:", err);
      addLog("Failed to process bad debt write-off.");
      alert("Failed to process bad debt write-off.");
    }
  };
  // Deprecated direct handleLogWastage function (moved to modal)


  // Edit Expense Voucher
  const handleEditExpense = async (updatedExpense: Expense) => {
    try {
      const res = await fetch(`/api/expenses/${updatedExpense.expense_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExpense)
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Successfully updated expense voucher ${updatedExpense.expense_id}.`);
        setShowEditExpenseModal(null);
        fetchAllData();
      } else {
        alert(data.error || "Failed to update expense voucher.");
      }
    } catch (err) {
      console.error("Edit expense error:", err);
      addLog("Failed to update expense voucher.");
    }
  };

  // Edit Inward Purchase Voucher
  const handleEditInward = async (updatedInward: Inward) => {
    try {
      const res = await fetch(`/api/inwards/${updatedInward.inward_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedInward)
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Successfully updated inward purchase voucher ${updatedInward.inward_id}. Inventory reconciled.`);
        setShowEditInwardModal(null);
        fetchAllData();
      } else {
        alert(data.error || "Failed to update inward purchase voucher.");
      }
    } catch (err) {
      console.error("Edit inward error:", err);
      addLog("Failed to update inward purchase voucher.");
    }
  };


  // Financial Insights Calculations
  const getRevenue = () => sales.reduce((t, s) => t + s.net_amount_payable, 0);
  
  const getCOGS = () => {
    return sales.reduce((total, s) => {
      const saleCOGS = s.items_sold.reduce((st, si) => {
        const buyPrice = si.purchase_cost_at_time ?? (() => {
          const itemInfo = items.find((i) => i.item_id === si.item_id);
          return itemInfo ? itemInfo.purchase_price : si.unit_price * 0.6;
        })();
        return st + buyPrice * si.qty_sold;
      }, 0);
      return total + saleCOGS;
    }, 0);
  };

  const getOperatingExpenses = () => expenses.reduce((t, e) => t + e.amount, 0);
  
  const getOutstandingCredit = () => {
    return sales.reduce((total, s) => {
      if (s.payment_mode === "Credit") {
        const received = s.payment_received || 0;
        return total + (s.net_amount_payable - received);
      }
      return total;
    }, 0);
  };

  const getNetProfit = () => {
    return getRevenue() - getCOGS() - getOperatingExpenses();
  };

  // Period Specific Financial Calculations
  const getFilteredSales = () => {
    const start = new Date(reportStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportEndDate);
    end.setHours(23, 59, 59, 999);

    return sales.filter((s) => {
      const saleDate = new Date(s.date);
      return saleDate >= start && saleDate <= end;
    });
  };

  const getFilteredExpenses = () => {
    const start = new Date(reportStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportEndDate);
    end.setHours(23, 59, 59, 999);

    return expenses.filter((e) => {
      const expDate = new Date(e.date);
      return expDate >= start && expDate <= end;
    });
  };

  const getRevenueForPeriod = (filtered = getFilteredSales()) => filtered.reduce((t, s) => t + s.net_amount_payable, 0);

  const getCOGSForPeriod = (filtered = getFilteredSales()) => {
    return filtered.reduce((total, s) => {
      const saleCOGS = s.items_sold.reduce((st, si) => {
        const buyPrice = si.purchase_cost_at_time ?? (() => {
          const itemInfo = items.find((i) => i.item_id === si.item_id);
          return itemInfo ? itemInfo.purchase_price : si.unit_price * 0.6;
        })();
        return st + buyPrice * si.qty_sold;
      }, 0);
      return total + saleCOGS;
    }, 0);
  };

  const getOperatingExpensesForPeriod = (filtered = getFilteredExpenses()) => filtered.reduce((t, e) => t + e.amount, 0);

  const getNetProfitForPeriod = (filteredSalesList = getFilteredSales(), filteredExpensesList = getFilteredExpenses()) => {
    return getRevenueForPeriod(filteredSalesList) - getCOGSForPeriod(filteredSalesList) - getOperatingExpensesForPeriod(filteredExpensesList);
  };

  const getCostOfGoodsInStock = () => {
    return items.reduce((t, itm) => t + (itm.current_stock_qty * itm.purchase_price), 0);
  };

  const getPeriodItemPerformance = (filteredSalesList: Sale[]) => {
    const summary: Record<string, { qty: number; amount: number }> = {};
    
    // Seed with current inventory
    items.forEach((itm) => {
      summary[itm.item_id] = { qty: 0, amount: 0 };
    });

    filteredSalesList.forEach((s) => {
      s.items_sold.forEach((si) => {
        if (!summary[si.item_id]) {
          summary[si.item_id] = { qty: 0, amount: 0 };
        }
        summary[si.item_id].qty += si.qty_sold;
        summary[si.item_id].amount += si.total_item_price;
      });
    });

    return summary;
  };

  // Categories list comes from backend state now

  // Filtered Inventory
  const filteredItems = items.filter((itm) => {
    const matchesSearch =
      String(itm.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(itm.item_id || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || itm.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sorted Inventory for Table View
  const sortedInventoryItems = [...filteredItems].sort((a, b) => {
    if (!inventorySortKey) return 0;
    if (inventorySortKey === "category") {
      const valA = a.category.toLowerCase();
      const valB = b.category.toLowerCase();
      if (valA < valB) return inventorySortDirection === "asc" ? -1 : 1;
      if (valA > valB) return inventorySortDirection === "asc" ? 1 : -1;
      return 0;
    }
    if (inventorySortKey === "name") {
      const valA = a.name.toLowerCase();
      const valB = b.name.toLowerCase();
      if (valA < valB) return inventorySortDirection === "asc" ? -1 : 1;
      if (valA > valB) return inventorySortDirection === "asc" ? 1 : -1;
      return 0;
    }
    if (inventorySortKey === "stock") {
      const valA = a.current_stock_qty;
      const valB = b.current_stock_qty;
      return inventorySortDirection === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleInventorySort = (key: "category" | "stock") => {
    if (inventorySortKey === key) {
      setInventorySortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setInventorySortKey(key);
      setInventorySortDirection("asc");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 selection:bg-indigo-500/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0,transparent_100%)] pointer-events-none" />
        
        <div className="w-full max-w-md bg-slate-900 border border-slate-800/60 p-8 rounded-2xl shadow-2xl relative overflow-hidden space-y-6 z-10">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Swamidatta Traders Logo displayed exactly above the title in opening/home page */}
            <div className="bg-[#fbf7ed] p-1.5 rounded-2xl w-28 h-28 overflow-hidden flex items-center justify-center shadow-xl shadow-indigo-600/10 border border-slate-800/20 transform hover:scale-105 transition-all duration-300">
              <img src={logoNav} alt="Swamidatta Traders Logo" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-black">
                Authorised Portal
              </span>
              <h2 className="text-xl font-black text-white tracking-wide uppercase font-display">
                Swamidatta Traders
              </h2>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed font-mono">
                Internal Shop Management, POS Billing & Outstanding Ledgers Terminal
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem("swamidatta_authorized", "true");
              setIsAuthorized(true);
            }}
            className="space-y-4"
          >
            {passcodeError && (
              <div className="bg-red-950/40 border border-red-800/50 text-red-400 p-2.5 rounded-lg text-xs font-medium text-center">
                {passcodeError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block">
                Operator Passcode
              </label>
              <input
                type="password"
                placeholder="•••••• (Enter any passcode to login)"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError("");
                }}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-center tracking-widest"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-wider"
            >
              Access Operator Terminal
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("swamidatta_authorized", "true");
                setIsAuthorized(true);
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest font-mono"
            >
              Skip / Quick Bypass &rarr;
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/40 text-center">
            <p className="text-[9px] text-slate-500 font-mono">
              Direct Private APK Node | Swamidatta Network
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isCustomerMode) {
    return <CustomerPortal items={items} customersList={customersList} offers={offers} />;
  }

  return (
    <div 
      className="h-full flex flex-col bg-slate-950 font-sans selection:bg-indigo-500/30 text-slate-100 overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >

      {/* ─── PWA: Offline Status Banner ─── */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-2 flex items-center justify-center gap-2 shrink-0 overflow-hidden"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
              You are offline
            </span>
            <span className="text-[10px] text-amber-400/80">
              — Changes will sync when you reconnect
              {pendingQueueCount > 0 && ` (${pendingQueueCount} pending)`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PWA: Install Banner ─── */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-indigo-950/90 via-indigo-900/80 to-indigo-950/90 border-b border-indigo-800/60 px-4 py-3 flex items-center justify-between gap-3 shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600/30 p-2 rounded-xl">
                <Download className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Install Swamidatta App</p>
                <p className="text-[10px] text-indigo-300/80">Add to home screen for offline access & native experience</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-[10px] text-indigo-400 hover:text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleInstallClick}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black px-4 py-1.5 rounded-lg transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-wide"
              >
                Install
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PWA: Sync Toast ─── */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-xl border shadow-2xl flex items-center gap-2 max-w-sm ${
              syncToast.type === 'synced'
                ? 'bg-emerald-950/95 border-emerald-800/60 text-emerald-300'
                : syncToast.type === 'error'
                  ? 'bg-red-950/95 border-red-800/60 text-red-300'
                  : 'bg-indigo-950/95 border-indigo-800/60 text-indigo-300'
            }`}
          >
            {syncToast.type === 'syncing' ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : syncToast.type === 'synced' ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <CloudOff className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px] font-bold">{syncToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PWA: Update Available Toast ─── */}
      <AnimatePresence>
        {showUpdateToast && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 z-[99999] bg-indigo-950/95 border border-indigo-800/60 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Update Available</p>
              <p className="text-[10px] text-indigo-300/80">A new version is ready.</p>
            </div>
            <button
              onClick={handleUpdateApp}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shrink-0 uppercase tracking-wide"
            >
              Update
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Professional Header Status strip */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#fbf7ed] p-1 rounded-xl w-14 h-14 overflow-hidden flex items-center justify-center shadow-md shadow-indigo-600/15 shrink-0 transition-transform hover:scale-105 duration-200">
            <img src={logoHeader} alt="Swamidatta Traders Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white font-display">
                Swamidatta Traders
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
              Accounting, Stock decrement, Outwards POS & Outstanding Ledgers
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.removeItem("swamidatta_authorized");
              setIsAuthorized(false);
            }}
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/70 transition-colors"
            title="Lock Terminal / Lock App"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={fetchAllData}
            className="hidden md:inline-flex p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/70 transition-colors"
            title="Force refresh database sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/70 transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Sandbox Window Container */}
      <main className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
        
        {/* Nav Drawer for desktop, converts to bottom nav for mobile */}
        <nav className="hidden md:flex flex-col w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 gap-1.5 shrink-0 overflow-y-auto no-scrollbar">
          
          {/* Logo Showcase Banner */}
          <div className="flex flex-col items-center gap-2 p-3.5 mb-2 bg-slate-950/50 rounded-xl border border-slate-800/50">
            <div className="bg-[#fbf7ed] p-1 rounded-lg w-20 h-20 overflow-hidden flex items-center justify-center shadow-md">
              <img src={logoNav} alt="Swamidatta Traders Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <span className="text-[8px] text-indigo-400 font-mono tracking-widest uppercase font-black">Authorized Portal</span>
              <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-wide mt-0.5">Swamidatta Traders</h4>
            </div>
          </div>

          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
            App Modules
          </div>
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "pos"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            POS Sale
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "inventory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory Stock
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "ledger"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            Outstanding Credit Ledger
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "expenses"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Operational Expenses
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "purchases"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Inward Stock Purchases</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "reports"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <PieChart className="w-4 h-4" />
            Financial Reports
          </button>
          <button
            onClick={() => setActiveTab("online_orders")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "online_orders"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            } relative`}
          >
            <Smartphone className="w-4 h-4" />
            Online Orders
            {customerOrders.length > 0 && (
              <span className="absolute right-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {customerOrders.length}
              </span>
            )}
          </button>

          <div className="mt-auto pt-4 border-t border-slate-800/80">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>PWA Native Ready</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Add to your phone's Home Screen from Chrome/Safari for full offline Android APK performance.
              </p>
            </div>
          </div>
        </nav>

        {/* Middle Screen Section */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0 p-4 md:p-6 bg-slate-950">
          
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400">Syncing live cloud parameters...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-full min-h-full"
              >
                
                {/* 1. POS INVOICE BILLING VIEW */}
                {activeTab === "pos" && (
                  <div className="max-w-2xl mx-auto w-full">
                    
                    {/* Cart Invoice Panel */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 sm:p-6 flex flex-col justify-between shadow-xl">
                      
                      {/* Top Checkout Details */}
                      <div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                          <h3 className="text-xs font-bold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                            Counter Checkout Bill
                          </h3>
                          <button
                            onClick={() => setCart([])}
                            className="text-[8px] font-semibold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-wider"
                          >
                            Clear Cart
                          </button>
                        </div>

                        {/* Customer Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
                          <div>
                            <label className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">
                              <span>Customer Name</span>
                              <button 
                                type="button" 
                                onClick={() => setShowManageCustomersModal(true)}
                                className="hover:text-indigo-400 text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                              >
                                <Settings className="w-3 h-3" /> Manage
                              </button>
                            </label>
                            <input
                              type="text"
                              list="customer-suggestions"
                              placeholder="General Walk-In"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                            <datalist id="customer-suggestions">
                              {customersList.map((cust, idx) => (
                                <option key={idx} value={cust} />
                              ))}
                            </datalist>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                              Customer Pricing Tier
                            </label>
                            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
                              <button
                                onClick={() => setCustomerType("Retail")}
                                className={`py-1 rounded text-[10px] font-bold tracking-wide transition-all ${
                                  customerType === "Retail"
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 hover:text-slate-300"
                                }`}
                              >
                                Retail
                              </button>
                              <button
                                onClick={() => setCustomerType("Wholesale")}
                                className={`py-1 rounded text-[10px] font-bold tracking-wide transition-all ${
                                  customerType === "Wholesale"
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 hover:text-slate-300"
                                }`}
                              >
                                Wholesale
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Product / Item Search Box */}
                        <div className="relative mb-3.5 pb-3 border-b border-slate-800/40">
                          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                            Search & Add Product / Item Name
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Type Product ID or name to instantly add..."
                              value={posSearchQuery}
                              onChange={(e) => setPosSearchQuery(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                          {posSearchQuery && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
                              {(() => {
                                const matched = items.filter(
                                  (itm) =>
                                    String(itm.name || "").toLowerCase().includes(posSearchQuery.toLowerCase()) ||
                                    String(itm.item_id || "").toLowerCase().includes(posSearchQuery.toLowerCase())
                                );
                                if (matched.length === 0) {
                                  return <div className="p-3 text-center text-slate-500 text-xs">No matching products found</div>;
                                }
                                return matched.map((itm) => {
                                  const activePrice = customerType === "Retail" ? itm.selling_price_retail : itm.selling_price_wholesale;
                                  return (
                                    <div
                                      key={itm.item_id}
                                      onClick={() => {
                                        addToCart(itm);
                                        setPosSearchQuery("");
                                      }}
                                      className="p-2.5 hover:bg-slate-900 cursor-pointer flex justify-between items-center text-xs transition-colors"
                                    >
                                      <div>
                                        <div className="font-bold text-slate-200">{itm.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">ID: {itm.item_id}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-black text-indigo-400">
                                          ₹{activePrice.toFixed(2)}
                                        </div>
                                        <div className={`text-[9px] font-bold ${itm.current_stock_qty <= itm.min_stock_alert ? "text-red-400" : "text-emerald-400"}`}>
                                          Stock: {itm.current_stock_qty} pcs
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Cart items listing */}
                        <div className="space-y-2 my-2 pr-1 border-y border-slate-800/40 py-2">
                          {cart.length === 0 ? (
                            <div className="py-12 text-center text-slate-600 text-xs flex flex-col items-center justify-center gap-1.5">
                              <ShoppingCart className="w-5 h-5 opacity-40 text-slate-500 animate-bounce" />
                              Cart is empty. Search products above or add them from the Inventory tab.
                            </div>
                          ) : (
                            cart.map((c) => {
                              const activePrice =
                                customerType === "Retail"
                                  ? c.item.selling_price_retail
                                  : c.item.selling_price_wholesale;

                              return (
                                <div
                                  key={c.item.item_id}
                                  className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60"
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <h4 className="text-[11px] font-bold text-slate-100 truncate">
                                      {c.item.name}
                                    </h4>
                                    <div className="text-[9px] text-slate-500 mt-0.5">
                                      ₹{activePrice.toFixed(2)} × {c.qty}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => updateCartQty(c.item.item_id, -1)}
                                        className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={c.qty}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          if (!isNaN(val)) {
                                            setCartItemQty(c.item.item_id, val);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          if (!e.target.value || parseInt(e.target.value, 10) <= 0) {
                                            setCartItemQty(c.item.item_id, 1);
                                          }
                                        }}
                                        className="text-xs font-bold w-12 text-center text-white font-mono bg-slate-900 border border-slate-700 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-500 hide-number-spinners"
                                      />
                                      <button
                                        onClick={() => updateCartQty(c.item.item_id, 1)}
                                        className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="text-xs font-black text-white w-16 text-right font-mono">
                                      ₹{(activePrice * c.qty).toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Bill checkout summary */}
                      <div className="pt-4 border-t border-slate-800 space-y-4">
                        
                        {/* Payment Mode Selection */}
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-2">
                            Select Payment Mode
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { mode: "Cash", label: "Cash Pay", icon: DollarSign },
                              { mode: "UPI", label: "UPI/QR Code", icon: Smartphone },
                              { mode: "Credit", label: "Ledger Credit/Udhar", icon: Layers }
                            ].map((item) => {
                              const Icon = item.icon;
                              const isSelected = paymentMode === item.mode;
                              return (
                                <button
                                  key={item.mode}
                                  type="button"
                                  onClick={() => setPaymentMode(item.mode as any)}
                                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/5"
                                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"
                                  }`}
                                >
                                  {/* Custom radio button bubble */}
                                  <div className="shrink-0 flex items-center justify-center">
                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                      isSelected ? "border-indigo-400" : "border-slate-600"
                                    }`}>
                                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[9px] font-black uppercase tracking-wider leading-none flex items-center gap-1">
                                      <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{item.label}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Flat Discount Input (stacked below Payment Mode) */}
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-1.5">
                            Flat Invoice Discount (₹)
                          </label>
                          <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                            placeholder="0.00"
                          />
                        </div>

                        {/* Calculations */}
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
                          <div className="flex justify-between items-center text-[11px] text-slate-400">
                            <span>Subtotal Amount</span>
                            <span className="font-mono">₹{getCartTotal().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-400">
                            <span>Discount Given</span>
                            <span className="text-red-400 font-mono">- ₹{discount.toFixed(2)}</span>
                          </div>
                          {paymentMode === "Credit" && (
                            <div className="flex justify-between items-center text-[10px] text-indigo-400 italic">
                              <span>Outwards Ledger State</span>
                              <span>Pending Credit Settlement</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                            <span className="text-xs font-bold text-slate-300">Net Payable Total</span>
                            <span className="text-sm font-black text-indigo-400 font-mono">
                              ₹{Math.max(0, getCartTotal() - discount).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Dispatch invoice trigger */}
                        <button
                          onClick={handleCheckout}
                          disabled={cart.length === 0}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-[1px]"
                        >
                          Dispatch Bill / Save Transaction
                        </button>
                      </div>

                    </div>
                    {/* Extra bottom space panel for mobile viewports to prevent status bar cutoff */}
                    <div className="h-28 md:h-8" />
                  </div>
                )}

                {/* 2. INVENTORY CATALOGUE */}
                {activeTab === "inventory" && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-between">
                      <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Filter inventory Product ID/Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                          />
                        </div>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="All">All Categories</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>

                        {/* View Switcher Toggle */}
                        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInventoryView("table")}
                            className={`px-3 py-1 rounded text-[10px] font-bold tracking-wide transition-all uppercase ${
                              inventoryView === "table"
                                ? "bg-indigo-600 text-white"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            Table View
                          </button>
                          <button
                            type="button"
                            onClick={() => setInventoryView("cards")}
                            className={`px-3 py-1 rounded text-[10px] font-bold tracking-wide transition-all uppercase ${
                              inventoryView === "cards"
                                ? "bg-indigo-600 text-white"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            Cards Grid
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowNewItemModal(true);
                            setIsIdManuallyEdited(false);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                        >
                          <Plus className="w-4 h-4" />
                          New Product / Item
                        </button>
                      </div>
                    </div>

                    {/* Stock Alert Warning Box */}
                    {items.some((i) => i.current_stock_qty <= i.min_stock_alert) && (
                      <div className="bg-amber-950/40 border border-amber-800 text-amber-400 p-3 rounded-lg text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Some items have breached their minimum threshold. Tap <b>"Adjust Stock"</b> or select cards to restock.</span>
                      </div>
                    )}

                    {/* Active POS Cart badge inside cards view */}
                    {inventoryView === "cards" && cart.length > 0 && (
                      <div className="bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 p-3 rounded-lg text-xs flex items-center justify-between shadow-lg">
                        <span className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-indigo-400 animate-pulse" />
                          <span>Active POS Sale checkout has <b>{cart.reduce((sum, c) => sum + c.qty, 0)} items</b> in cart.</span>
                        </span>
                        <button
                          onClick={() => setActiveTab("pos")}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Checkout / Complete Bill
                        </button>
                      </div>
                    )}

                    {/* Conditional rendering of inventory view */}
                    {inventoryView === "table" ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                              <tr>
                                <th 
                                  className="px-4 py-3 cursor-pointer hover:bg-slate-900 transition-colors select-none"
                                  onClick={() => handleInventorySort("name")}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>Product Name / ID</span>
                                    <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${
                                      inventorySortKey === "name" ? "text-indigo-400" : "text-slate-600"
                                    }`} />
                                    {inventorySortKey === "name" && (
                                      <span className="text-[8px] text-indigo-400 lowercase font-mono">
                                        ({inventorySortDirection})
                                      </span>
                                    )}
                                  </div>
                                </th>
                                <th 
                                  className="px-4 py-3 cursor-pointer hover:bg-slate-900 transition-colors select-none"
                                  onClick={() => handleInventorySort("category")}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>Category</span>
                                    <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${
                                      inventorySortKey === "category" ? "text-indigo-400" : "text-slate-600"
                                    }`} />
                                    {inventorySortKey === "category" && (
                                      <span className="text-[8px] text-indigo-400 lowercase font-mono">
                                        ({inventorySortDirection})
                                      </span>
                                    )}
                                  </div>
                                </th>
                                <th className="px-4 py-3">Purchase Rate</th>
                                <th className="px-4 py-3">Retail Price</th>
                                <th className="px-4 py-3">Wholesale Price</th>
                                <th 
                                  className="px-4 py-3 cursor-pointer hover:bg-slate-900 transition-colors select-none"
                                  onClick={() => handleInventorySort("stock")}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>Available Stock</span>
                                    <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${
                                      inventorySortKey === "stock" ? "text-indigo-400" : "text-slate-600"
                                    }`} />
                                    {inventorySortKey === "stock" && (
                                      <span className="text-[8px] text-indigo-400 lowercase font-mono">
                                        ({inventorySortDirection})
                                      </span>
                                    )}
                                  </div>
                                </th>
                                <th className="px-4 py-3">Value of stock</th>
                                <th className="px-4 py-3 text-right">Stock Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {sortedInventoryItems.map((itm) => {
                                const isLowStock = itm.current_stock_qty <= itm.min_stock_alert;
                                const isCritical = itm.current_stock_qty <= 5;

                                return (
                                  <tr key={itm.item_id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-slate-100 font-display">
                                        {itm.name}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                        ID: {itm.item_id}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">
                                      {itm.category}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-300">
                                      ₹{itm.purchase_price.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-300">
                                      ₹{itm.selling_price_retail.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-300">
                                      ₹{itm.selling_price_wholesale.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`font-mono font-bold ${
                                            isCritical
                                              ? "text-red-500"
                                              : isLowStock
                                              ? "text-amber-500"
                                              : "text-emerald-500"
                                          }`}
                                        >
                                          {itm.current_stock_qty} units
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                          (alert: {itm.min_stock_alert})
                                        </span>
                                      </div>
                                      
                                      {/* Mini gauge bar */}
                                      <div className="w-24 bg-slate-850 h-1.5 rounded-full mt-1 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            isCritical
                                              ? "bg-red-500"
                                              : isLowStock
                                              ? "bg-amber-500"
                                              : "bg-emerald-500"
                                          }`}
                                          style={{ width: `${Math.min(100, (itm.current_stock_qty / 150) * 100)}%` }}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                                      ₹{(itm.current_stock_qty * itm.purchase_price).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex gap-1.5 justify-end">
                                        <button
                                          onClick={() => {
                                            setShowRestockModal(itm);
                                            setRestockQty(50);
                                            setRestockMode("add");
                                          }}
                                          className="bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-indigo-400 px-2.5 py-1.5 rounded text-[10px] font-bold tracking-wide uppercase transition-all"
                                        >
                                          Adjust Stock
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingItem({ ...itm });
                                            setOriginalEditingItemId(itm.item_id);
                                            setIsEditIdManuallyEdited(false);
                                          }}
                                          className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                                        >
                                          <Edit className="w-3 h-3 text-indigo-400" />
                                          <span>Edit Item</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Category Buttons inside Cards View */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 border-b border-slate-800/40">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap tracking-wide transition-all uppercase border ${
                                selectedCategory === cat
                                  ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/50"
                                  : "bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-white"
                              }`}
                            >
                              {cat === "All" ? "All Products" : cat}
                            </button>
                          ))}
                        </div>

                        {/* Cards list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {(() => {
                            const sortedItems = [...filteredItems].sort((a, b) => {
                              const aLow = a.current_stock_qty <= a.min_stock_alert;
                              const bLow = b.current_stock_qty <= b.min_stock_alert;
                              
                              if (aLow && !bLow) return -1;
                              if (!aLow && bLow) return 1;
                              if (aLow && bLow) {
                                if (a.current_stock_qty !== b.current_stock_qty) {
                                  return a.current_stock_qty - b.current_stock_qty;
                                }
                                return a.name.localeCompare(b.name);
                              }
                              return 0;
                            });

                            if (sortedItems.length === 0) {
                              return (
                                <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                                  No items match the current filters.
                                </div>
                              );
                            }

                            return sortedItems.map((itm) => {
                              const isLowStock = itm.current_stock_qty <= itm.min_stock_alert;
                              const activePrice = customerType === "Retail" ? itm.selling_price_retail : itm.selling_price_wholesale;
                              const activeMargin = activePrice - itm.purchase_price;

                              return (
                                <div
                                  key={itm.item_id}
                                  className={`p-3.5 rounded-xl flex flex-col justify-between border ${
                                    isLowStock
                                      ? "bg-red-950/20 border-red-900/60"
                                      : "bg-slate-900 border-slate-800/60"
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-start gap-1.5">
                                      <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                                        {itm.category}
                                      </span>
                                      {isLowStock && (
                                        <span className="text-[8px] bg-red-950/80 border border-red-800 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                          Low Stock
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-xs font-bold text-slate-100 mt-1 font-display leading-tight line-clamp-2">
                                      {itm.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs font-black text-white">
                                        ₹{activePrice.toFixed(2)}
                                      </span>
                                      <span className="text-[9px] text-slate-500 line-through">
                                        ₹{(activePrice * 1.25).toFixed(0)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-3.5 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-400 mb-3">
                                    <span>Stock: <b className={isLowStock ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{itm.current_stock_qty} pcs</b></span>
                                    <span className="text-[9px] text-indigo-400">Margin: ₹{activeMargin.toFixed(0)}</span>
                                  </div>
                                  <div className="flex gap-2 justify-end mt-auto">
                                    <button
                                      onClick={() => {
                                        setShowRestockModal(itm);
                                        setRestockQty(50);
                                        setRestockMode("add");
                                      }}
                                      className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-indigo-400 px-3 py-1.5 rounded text-[10px] font-bold tracking-wide uppercase transition-all flex-1"
                                    >
                                      Adjust Stock
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItem({ ...itm });
                                        setOriginalEditingItemId(itm.item_id);
                                        setIsEditIdManuallyEdited(false);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded transition-colors"
                                      title="Edit details"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                    {/* Extra bottom space panel for mobile viewports to prevent status bar cutoff */}
                    <div className="h-28 md:h-8" />
                  </div>
                )}

                {/* 3. CREDIT LEDGER */}
                {activeTab === "ledger" && (
                  <div className="space-y-5">
                    
                    {/* Active Outstanding Credit balance cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                            Aggregated Outstanding Balance
                          </p>
                          <h3 className="text-xl font-black text-red-400 mt-1 font-mono">
                            ₹{getOutstandingCredit().toFixed(2)}
                          </h3>
                        </div>
                        <div className="p-3 bg-red-950/50 text-red-400 rounded-lg border border-red-800/30">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                            Total Outstanding Accounts
                          </p>
                          <h3 className="text-xl font-black text-white mt-1 font-mono">
                            {sales.filter((s) => s.payment_mode === "Credit" && (s.payment_received || 0) < s.net_amount_payable).length} clients
                          </h3>
                        </div>
                        <div className="p-3 bg-indigo-950/50 text-indigo-400 rounded-lg border border-indigo-800/30">
                          <User className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                            Historical Credits Issued
                          </p>
                          <h3 className="text-xl font-black text-emerald-400 mt-1 font-mono">
                            ₹{sales.filter((s) => s.payment_mode === "Credit").reduce((t, s) => t + s.net_amount_payable, 0).toFixed(2)}
                          </h3>
                        </div>
                        <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-800/30">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Ledger List */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Consolidated Customer Debts & Credit Logs
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Invoice / ID</th>
                              <th 
                                className="px-4 py-3 cursor-pointer hover:text-indigo-400 transition-colors"
                                onClick={() => {
                                  if (debtSortKey === "customer") {
                                    setDebtSortDirection(debtSortDirection === "asc" ? "desc" : "asc");
                                  } else {
                                    setDebtSortKey("customer");
                                    setDebtSortDirection("asc");
                                  }
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  Customer Profile <ArrowUpDown className="w-3 h-3" />
                                </div>
                              </th>
                              <th className="px-4 py-3">Sales Amount</th>
                              <th className="px-4 py-3">Settlement Received</th>
                              <th className="px-4 py-3">Remaining Balance</th>
                              <th className="px-4 py-3 text-right">Quick Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {sortedDebtsSales.map((sal) => {
                              const amountPayable = sal.net_amount_payable;
                              const amtReceived = sal.payment_received || 0;
                              const balance = amountPayable - amtReceived;
                              const isSettled = balance <= 0;

                              return (
                                <tr key={sal.sale_id} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="px-4 py-3 text-slate-400">
                                    {new Date(sal.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-indigo-400 font-bold">
                                    {sal.sale_id}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-200">
                                      {sal.customer_name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">
                                      {sal.customer_type}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-300">
                                    ₹{amountPayable.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-emerald-400">
                                    ₹{amtReceived.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {isSettled ? (
                                      <span className="text-[9px] bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                        Settled / Cash
                                      </span>
                                    ) : (
                                      <span className="font-mono font-bold text-red-400">
                                        ₹{balance.toFixed(2)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {!isSettled && (
                                        <>
                                          <button
                                            onClick={() => {
                                              setShowSettlementModal(sal);
                                              setSettlementAmount(balance);
                                            }}
                                            className="bg-red-950/40 hover:bg-red-900/40 border border-red-800 hover:border-red-500/50 text-red-400 px-2.5 py-1.5 rounded text-[10px] font-bold tracking-wide uppercase transition-all"
                                          >
                                            Register Pay
                                          </button>
                                          <button
                                            onClick={() => handleWriteOffDebt(sal, balance)}
                                            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 px-2.5 py-1.5 rounded text-[10px] font-bold tracking-wide uppercase transition-all"
                                            title="Write off this unpaid amount as a bad debt expense"
                                          >
                                            Write-off
                                          </button>
                                        </>
                                      )}
                                      <button
                                        onClick={() => setEditingSaleVoucher({ ...sal })}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors ml-1"
                                        title="Edit sale voucher"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm("Are you sure you want to permanently delete this sale voucher? Inventory quantities will be restored.")) {
                                            handleDeleteSale(sal.sale_id);
                                          }
                                        }}
                                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
                                        title="Delete sale voucher"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Extra bottom space panel for mobile viewports to prevent status bar cutoff */}
                    <div className="h-28 md:h-8" />
                  </div>
                )}

                {/* 4. EXPENSES MANAGER */}
                {activeTab === "expenses" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full">
                    
                    {/* Log New Expense (5 Cols) */}
                    <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-indigo-400" />
                          Record Company Expense
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                              <span>Expense Category</span>
                              <button 
                                onClick={() => setShowManageExpenseCategoriesModal(true)}
                                className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                              >
                                <Settings className="w-3 h-3" /> Manage
                              </button>
                            </label>
                            <select
                              id="expense-category-select"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              onChange={(e) => {
                                if (e.target.value === "MANAGE_CATEGORIES") {
                                  setShowManageExpenseCategoriesModal(true);
                                  e.target.value = expenseCategories[0] || "Freight";
                                }
                              }}
                            >
                              {expenseCategories.length > 0 ? (
                                expenseCategories.map((cat, idx) => (
                                  <option key={idx} value={cat}>{cat}</option>
                                ))
                              ) : (
                                <>
                                  <option value="Freight">Freight / Transport Cost</option>
                                  <option value="Utilities">Utilities (Bills, Rent)</option>
                                  <option value="Refreshments">Refreshments / Hospitality</option>
                                  <option value="Salaries">Labor / Salaries</option>
                                  <option value="Miscellaneous">Miscellaneous Operations</option>
                                </>
                              )}
                              <option disabled>──────────</option>
                              <option value="MANAGE_CATEGORIES">-- Manage Expense Categories --</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                              Voucher Amount (₹)
                            </label>
                            <input
                              id="expense-amount-input"
                              type="number"
                              placeholder="0.00"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                              Remarks & Supplier/Bill Notes
                            </label>
                            <textarea
                              id="expense-remarks-textarea"
                              rows={3}
                              placeholder="Describe items, delivery locations or cargo details..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          const catEl = document.getElementById("expense-category-select") as HTMLSelectElement;
                          const amtEl = document.getElementById("expense-amount-input") as HTMLInputElement;
                          const remEl = document.getElementById("expense-remarks-textarea") as HTMLTextAreaElement;

                          if (!amtEl.value || Number(amtEl.value) <= 0) {
                            alert("Please enter a valid expense amount greater than 0.");
                            return;
                          }

                          const newExp: Expense = {
                            expense_id: `EXP_${Date.now().toString().slice(-6)}`,
                            date: new Date().toISOString(),
                            category: catEl.value,
                            amount: Number(amtEl.value),
                            remarks: remEl.value.trim() || "Operational expense invoice record"
                          };

                          try {
                            const res = await fetch("/api/expenses", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(newExp)
                            });
                            await res.json();
                            addLog(`Logged operational expense: ₹${newExp.amount} for ${newExp.category}`);
                            
                            // Clear Form
                            amtEl.value = "";
                            remEl.value = "";
                            
                            fetchAllData();
                          } catch (err) {
                            addLog("Failed to sync expense voucher.");
                          }
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-widest transition-all mt-6"
                      >
                        Commit Expense Voucher
                      </button>
                    </div>

                    {/* Historical Expenses list (7 Cols) */}
                    <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Historical Operating Costs & Petty Cash
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Voucher Code</th>
                              <th 
                                className="px-4 py-3 cursor-pointer hover:text-indigo-400 transition-colors"
                                onClick={() => {
                                  if (expenseSortKey === "category") {
                                    setExpenseSortDirection(expenseSortDirection === "asc" ? "desc" : "asc");
                                  } else {
                                    setExpenseSortKey("category");
                                    setExpenseSortDirection("asc");
                                  }
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  Category <ArrowUpDown className="w-3 h-3" />
                                </div>
                              </th>
                              <th 
                                className="px-4 py-3 cursor-pointer hover:text-indigo-400 transition-colors"
                                onClick={() => {
                                  if (expenseSortKey === "remarks") {
                                    setExpenseSortDirection(expenseSortDirection === "asc" ? "desc" : "asc");
                                  } else {
                                    setExpenseSortKey("remarks");
                                    setExpenseSortDirection("asc");
                                  }
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  Description <ArrowUpDown className="w-3 h-3" />
                                </div>
                              </th>
                              <th className="px-4 py-3 text-right">Amount Paid</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {sortedExpenses.map((exp) => (
                              <tr key={exp.expense_id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3 text-slate-400">
                                  {new Date(exp.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-mono text-indigo-400 font-bold">
                                  {exp.expense_id}
                                </td>
                                <td className="px-4 py-3 text-slate-300 font-semibold">
                                  {exp.category}
                                </td>
                                <td className="px-4 py-3 text-slate-400">
                                  {exp.remarks}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-red-400">
                                  ₹{exp.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setShowEditExpenseModal(exp)}
                                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                      title="Edit expense details"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you sure you want to permanently delete this expense voucher?")) {
                                          handleDeleteExpense(exp.expense_id);
                                        }
                                      }}
                                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors ml-1"
                                      title="Delete voucher"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Extra bottom space panel for mobile viewports to prevent status bar cutoff */}
                    <div className="h-28 md:h-8" />
                  </div>
                )}

                {/* 6. INWARD STOCK PURCHASES VIEW */}
                {activeTab === "purchases" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Add Purchase Inward Form (5 Cols) */}
                    <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 shadow-md">
                      <div>
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Truck className="w-5 h-5" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            Create Inward Purchase Voucher
                          </h3>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Record supplier arrivals, update item unit purchase costs, and replenish inventory levels.
                        </p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                              <span>Supplier Name</span>
                              <button 
                                type="button" 
                                onClick={() => setShowManageSuppliersModal(true)}
                                className="hover:text-indigo-400 text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                              >
                                <Settings className="w-3 h-3" /> Manage
                              </button>
                            </label>
                            <input
                              type="text"
                              list="supplier-suggestions"
                              placeholder="e.g. Mangal Store Wholesalers"
                              value={supplierName}
                              onChange={(e) => setSupplierName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            />
                            <datalist id="supplier-suggestions">
                              {suppliersList.map((supp, idx) => (
                                <option key={idx} value={supp} />
                              ))}
                            </datalist>
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                              Voucher Date
                            </label>
                            <input
                              type="date"
                              value={inwardDate}
                              onChange={(e) => setInwardDate(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Add Item Row */}
                        <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/25 space-y-3">
                          <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold block">
                            Add Item Line
                          </span>
                          
                          <div>
                            <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                              Select Catalog Item
                            </label>
                            <select
                              value={selectedInwardItem}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "__NEW_ITEM__") {
                                  setShowNewItemModal(true);
                                  setSelectedInwardItem("");
                                  return;
                                }
                                setSelectedInwardItem(val);
                                const selected = items.find(i => i.item_id === val);
                                if (selected) {
                                  // Pre-fill existing rate if any
                                  setInwardItemRate(selected.purchase_price || 0);
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            >
                              <option value="__NEW_ITEM__">-- New Product / Item --</option>
                              <option value="">-- Choose Item --</option>
                              {items.map((i) => (
                                <option key={i.item_id} value={i.item_id}>
                                  {i.name} (stock: {i.current_stock_qty})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                                Inward Qty
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={inwardItemQty}
                                onChange={(e) => setInwardItemQty(Math.max(1, Number(e.target.value)))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                                Purchase Rate (₹)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={inwardItemRate}
                                onChange={(e) => setInwardItemRate(Math.max(0, Number(e.target.value)))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedInwardItem) {
                                alert("Please select an item first.");
                                return;
                              }
                              const found = items.find(i => i.item_id === selectedInwardItem);
                              if (!found) return;

                              // Add to local inward cart
                              const existingIdx = inwardCart.findIndex(c => c.item.item_id === selectedInwardItem);
                              if (existingIdx > -1) {
                                const copied = [...inwardCart];
                                copied[existingIdx].qty += inwardItemQty;
                                copied[existingIdx].rate = inwardItemRate; // use latest rate
                                setInwardCart(copied);
                              } else {
                                setInwardCart([...inwardCart, { item: found, qty: inwardItemQty, rate: inwardItemRate }]);
                              }

                              // Reset item-specific states
                              setSelectedInwardItem("");
                              setInwardItemQty(1);
                              setInwardItemRate(0);
                            }}
                            className="w-full bg-indigo-950 hover:bg-indigo-900 border border-indigo-850 text-indigo-400 hover:text-white text-xs font-bold py-1.5 rounded-lg transition-all uppercase tracking-wider"
                          >
                            Add to Inward Invoice
                          </button>
                        </div>

                        {/* Inward Voucher Cart Table */}
                        {inwardCart.length > 0 && (
                          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/10">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[9px] font-bold border-b border-slate-800">
                                <tr>
                                  <th className="px-3 py-2">Item</th>
                                  <th className="px-3 py-2 text-right">Qty</th>
                                  <th className="px-3 py-2 text-right">Rate</th>
                                  <th className="px-3 py-2 text-right">Total</th>
                                  <th className="px-3 py-2 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850">
                                {inwardCart.map((c, idx) => (
                                  <tr key={c.item.item_id} className="hover:bg-slate-800/10 text-slate-300">
                                    <td className="px-3 py-2 font-semibold">
                                      {c.item.name}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-indigo-300">
                                      {c.qty}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono">
                                      ₹{c.rate.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-white">
                                      ₹{(c.qty * c.rate).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => setInwardCart(inwardCart.filter((_, i) => i !== idx))}
                                        className="text-red-400 hover:text-red-300 p-0.5"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="bg-slate-950/60 p-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono font-bold">
                              <span className="text-slate-400">GRAND TOTAL:</span>
                              <span className="text-emerald-400 text-sm">
                                ₹{inwardCart.reduce((sum, c) => sum + (c.qty * c.rate), 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleInwardSubmit}
                          className="w-full bg-[#ffb647] hover:bg-[#e6a33e] text-slate-950 font-bold py-2 rounded-lg text-xs uppercase tracking-widest transition-all mt-4"
                        >
                          Save Purchase Inward Voucher
                        </button>
                      </div>
                    </div>

                    {/* Historical Purchase Inwards Table (7 Cols) */}
                    <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md space-y-4">
                      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            Historical Inward Purchase Vouchers
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Audit trails of inward supplier inventory receipts.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Total Purchases</span>
                          <span className="text-xs font-mono font-bold text-indigo-400">
                            ₹{inwards.reduce((acc, inw) => acc + inw.total_invoice_cost, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Inward ID</th>
                              <th 
                                className="px-4 py-3 cursor-pointer hover:text-indigo-400 transition-colors"
                                onClick={() => {
                                  if (inwardSortKey === "supplier") {
                                    setInwardSortDirection(inwardSortDirection === "asc" ? "desc" : "asc");
                                  } else {
                                    setInwardSortKey("supplier");
                                    setInwardSortDirection("asc");
                                  }
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  Supplier Name <ArrowUpDown className="w-3 h-3" />
                                </div>
                              </th>
                              <th 
                                className="px-4 py-3 cursor-pointer hover:text-indigo-400 transition-colors"
                                onClick={() => {
                                  if (inwardSortKey === "item") {
                                    setInwardSortDirection(inwardSortDirection === "asc" ? "desc" : "asc");
                                  } else {
                                    setInwardSortKey("item");
                                    setInwardSortDirection("asc");
                                  }
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  Replenished Items <ArrowUpDown className="w-3 h-3" />
                                </div>
                              </th>
                              <th className="px-4 py-3 text-right">Invoice Cost</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {inwards.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                                  No purchase inward vouchers recorded yet.
                                </td>
                              </tr>
                            ) : (
                              sortedInwards.map((inw) => (
                                <tr key={inw.inward_id} className="hover:bg-slate-800/20 transition-colors">
                                  <td className="px-4 py-3 text-slate-400">
                                    {new Date(inw.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-indigo-400 font-bold">
                                    {inw.inward_id}
                                  </td>
                                  <td className="px-4 py-3 text-slate-300 font-semibold">
                                    {inw.supplier_name}
                                  </td>
                                  <td className="px-4 py-3 text-slate-400">
                                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                                      {inw.items_received.map((item) => {
                                        return (
                                          <span key={item.item_id} className="bg-slate-950 px-1.5 py-0.5 rounded text-[10px] font-mono text-indigo-300 border border-slate-850 block">
                                            {item.item_id} (+{item.qty_added})
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                                    ₹{inw.total_invoice_cost.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => {
                                          setShowEditInwardModal(inw);
                                          setEditInwardSupplier(inw.supplier_name);
                                          setEditInwardDate(inw.date.slice(0, 10));
                                          const populatedCart = inw.items_received.map(item => {
                                            const matched = items.find(i => i.item_id === item.item_id) || {
                                              item_id: item.item_id,
                                              name: item.item_id,
                                              category: "General",
                                              selling_price_retail: 0,
                                              selling_price_wholesale: 0,
                                              purchase_price: item.purchase_price_at_time,
                                              current_stock_qty: 0,
                                              min_stock_alert: 0
                                            };
                                            return {
                                              item: matched as Item,
                                              qty: item.qty_added,
                                              rate: item.purchase_price_at_time
                                            };
                                          });
                                          setInwardEditCart(populatedCart);
                                        }}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                        title="Edit inward purchase"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm("Are you sure you want to permanently delete this inward purchase voucher? Inventory will be reduced.")) {
                                            handleDeleteInward(inw.inward_id);
                                          }
                                        }}
                                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors ml-1"
                                        title="Delete inward voucher"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Extra bottom space panel for mobile viewports to prevent status bar cutoff */}
                    <div className="h-28 md:h-8" />
                  </div>
                )}

                {/* ONLINE ORDERS (STAFF) */}
                {activeTab === "online_orders" && (
                  <div className="space-y-6">
                    {/* MANAGE SPECIAL OFFERS PANEL */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                      <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          Manage Special Offers
                        </h2>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Broadcast highlights to customers</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Buy 5 Tissue papers and get ₹20 Off"
                          value={newOfferText}
                          onChange={(e) => setNewOfferText(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={async () => {
                            if (!newOfferText.trim()) return;
                            try {
                              const res = await fetch("/api/offers", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ offer_id: crypto.randomUUID(), text: newOfferText.trim(), created_at: new Date().toISOString() })
                              });
                              if (res.ok) {
                                setNewOfferText("");
                                fetchAllData();
                              }
                            } catch (e) { console.error(e); }
                          }}
                          className="bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" /> Add Offer
                        </button>
                      </div>

                      {offers.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {offers.map(offer => (
                            <div key={offer.offer_id} className="flex justify-between items-center bg-slate-950 border border-slate-800/60 p-3 rounded-lg">
                              <span className="text-yellow-400/90 text-sm font-medium">{offer.text}</span>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/offers/${offer.offer_id}`, { method: "DELETE" });
                                    if (res.ok) fetchAllData();
                                  } catch (e) { console.error(e); }
                                }}
                                className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-indigo-400" />
                          Incoming Online Orders
                        </h2>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Manage customer requests</p>
                      </div>
                      <button 
                        onClick={fetchAllData} 
                        className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> 
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </div>
                    
                    {customerOrders.length === 0 ? (
                      <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                        <Smartphone className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-slate-300 font-bold mb-1">No Orders Yet</h3>
                        <p className="text-slate-500 text-xs max-w-xs mx-auto">Incoming customer orders placed through the online portal will appear here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customerOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => (
                          <div key={order.order_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full hover:border-indigo-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-800/60">
                              <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-indigo-400" />
                                  {order.customer_name}
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(order.date).toLocaleString()}</p>
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                                {order.status}
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
                                <Smartphone className="w-3 h-3" /> {order.contact_number}
                              </p>
                              <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/40">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span className="text-slate-300 truncate pr-2">{item.name}</span>
                                    <span className="text-white font-bold whitespace-nowrap bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">x{item.qty}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="mt-auto pt-4 flex gap-2">
                              <button 
                                onClick={async () => {
                                  if (!confirm("Delete this order?")) return;
                                  try {
                                    const res = await fetch(`/api/customer-orders/${order.order_id}`, { method: 'DELETE' });
                                    if (res.ok) fetchAllData();
                                  } catch(e) { console.error(e); }
                                }}
                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-900/30 bg-slate-950"
                                title="Delete Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  // Push to POS
                                  setCustomerName(order.customer_name);
                                  
                                  const orderCart = order.items.map(oItem => {
                                    const matchedItem = items.find(i => i.item_id === oItem.item_id);
                                    if (matchedItem) {
                                      return { item: matchedItem, qty: oItem.qty };
                                    }
                                    return null;
                                  }).filter(Boolean);
                                  
                                  setCart(orderCart as { item: Item; qty: number }[]);
                                  setActiveTab("pos");
                                }}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-lg transition-colors shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Push to POS
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. REPORTS & FREE STANDALONE DEPLOYMENT GUIDE */}
                {activeTab === "reports" && (
                  <div className="space-y-6">
                    
                    {/* Financial Summary KPI Cards */}
                    {(() => {
                      const filteredSalesList = getFilteredSales();
                      const filteredExpensesList = getFilteredExpenses();
                      const itemPerformance = getPeriodItemPerformance(filteredSalesList);

                      // Calculate Payment Mode Breakdown
                      let totalCashReceived = 0;
                      let totalUpiReceived = 0;
                      let totalCreditReceived = 0;
                      let totalCreditOutstanding = 0;

                      filteredSalesList.forEach((s) => {
                        const received = s.payment_received || 0;
                        const outstanding = s.net_amount_payable - received;

                        if (s.payment_mode === "Cash") {
                          totalCashReceived += received;
                        } else if (s.payment_mode === "UPI") {
                          totalUpiReceived += received;
                        } else if (s.payment_mode === "Credit") {
                          totalCreditReceived += received;
                          totalCreditOutstanding += Math.max(0, outstanding);
                        }
                      });

                      // Filter the items by the query
                      const matchingReportItems = items.filter((itm) => {
                        return (
                          String(itm.name || "").toLowerCase().includes(reportItemSearchQuery.toLowerCase()) ||
                          String(itm.item_id || "").toLowerCase().includes(reportItemSearchQuery.toLowerCase())
                        );
                      });

                      return (
                        <>
                          {/* Interactive Period Selector Header */}
                          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-sm font-bold text-white font-display">
                                Reporting Timeframe
                              </h3>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Select date interval to analyze sales, metrics, and payment channels.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                                {(["7days", "30days", "thismonth", "all"] as const).map((p) => {
                                  const labelMap = {
                                    "7days": "7 Days",
                                    "30days": "30 Days",
                                    "thismonth": "This Month",
                                    "all": "All Time"
                                  };
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => handlePeriodChange(p)}
                                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                                        reportPeriod === p
                                          ? "bg-indigo-600 text-white"
                                          : "text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      {labelMap[p]}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                                <input
                                  type="date"
                                  value={reportStartDate}
                                  onChange={(e) => {
                                    setReportStartDate(e.target.value);
                                    setReportPeriod("all");
                                  }}
                                  className="bg-transparent text-[10px] font-mono text-slate-300 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500">to</span>
                                <input
                                  type="date"
                                  value={reportEndDate}
                                  onChange={(e) => {
                                    setReportEndDate(e.target.value);
                                    setReportPeriod("all");
                                  }}
                                  className="bg-transparent text-[10px] font-mono text-slate-300 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Financial Summary KPI Cards - 5 columns */}
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                                    Total Revenue
                                  </span>
                                  <button
                                    onClick={() => setFinancialLedgerQuery("revenue")}
                                    className="text-[9px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded transition-colors"
                                  >
                                    View Ledger
                                  </button>
                                </div>
                                <h3 className="text-base lg:text-lg font-black text-white font-mono">
                                  ₹{getRevenueForPeriod(filteredSalesList).toFixed(0)}
                                </h3>
                              </div>
                              <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-2">
                                <TrendingUp className="w-3 h-3" />
                                <span>{filteredSalesList.length} POS sales</span>
                              </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                                Cost of Goods Sold
                              </span>
                              <h3 className="text-base lg:text-lg font-black text-white font-mono">
                                ₹{getCOGSForPeriod(filteredSalesList).toFixed(0)}
                              </h3>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                                <span>Purchase rate cost</span>
                              </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-900">
                              <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold block mb-1">
                                Cost of Goods in Stock
                              </span>
                              <h3 className="text-base lg:text-lg font-black text-white font-mono">
                                ₹{getCostOfGoodsInStock().toFixed(0)}
                              </h3>
                              <div className="text-[10px] text-indigo-400/80 font-medium flex items-center gap-1 mt-1">
                                <span>Available stock value</span>
                              </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                                Operating Costs
                              </span>
                              <h3 className="text-base lg:text-lg font-black text-red-400 font-mono">
                                ₹{getOperatingExpensesForPeriod(filteredExpensesList).toFixed(0)}
                              </h3>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                                <span>{filteredExpensesList.length} vouchers</span>
                              </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                                Net Business Profit
                              </span>
                              <h3 className={`text-base lg:text-lg font-black font-mono ${getNetProfitForPeriod(filteredSalesList, filteredExpensesList) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                ₹{getNetProfitForPeriod(filteredSalesList, filteredExpensesList).toFixed(0)}
                              </h3>
                              <div className="text-[10px] text-indigo-400 font-medium flex items-center gap-1 mt-1">
                                <span>Revenue - COGS - Ops</span>
                              </div>
                            </div>

                          </div>

                          {/* Payment Mode Collections Received and Outstanding */}
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-indigo-400" />
                                Collections Received by Payment Modes (Selected Period)
                              </h3>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Breakdown of actual liquid amount received in selected interval.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                              
                              {/* Cash */}
                              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-0.5">
                                    Cash Received
                                  </span>
                                  <h4 className="text-sm lg:text-base font-bold text-white font-mono">
                                    ₹{totalCashReceived.toFixed(2)}
                                  </h4>
                                </div>
                                <div className="bg-emerald-950/60 text-emerald-400 px-2 py-1 rounded border border-emerald-900/60 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                  Cash
                                </div>
                              </div>

                              {/* UPI */}
                              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-0.5">
                                    UPI Received
                                  </span>
                                  <h4 className="text-sm lg:text-base font-bold text-white font-mono">
                                    ₹{totalUpiReceived.toFixed(2)}
                                  </h4>
                                </div>
                                <div className="bg-indigo-950/60 text-indigo-400 px-2 py-1 rounded border border-indigo-900/60 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                  UPI
                                </div>
                              </div>

                              {/* Credit Received / Settled */}
                              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-0.5">
                                    Credit Received (Paid)
                                  </span>
                                  <h4 className="text-sm lg:text-base font-bold text-emerald-400 font-mono">
                                    ₹{totalCreditReceived.toFixed(2)}
                                  </h4>
                                </div>
                                <div className="bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-800 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                  Settled
                                </div>
                              </div>

                              {/* Credit Outstanding (Udhaar Outstanding) */}
                              <div className="bg-slate-950 border border-red-950 p-3 rounded-lg flex items-center justify-between border-red-900/30">
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[9px] text-red-400 uppercase tracking-widest font-bold">
                                      Outstanding Udhaar
                                    </span>
                                    <button
                                      onClick={() => setFinancialLedgerQuery("outstanding")}
                                      className="text-[9px] flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-1.5 py-0.5 rounded transition-colors"
                                    >
                                      View Ledger
                                    </button>
                                  </div>
                                  <h4 className="text-sm lg:text-base font-bold text-red-400 font-mono">
                                    ₹{totalCreditOutstanding.toFixed(2)}
                                  </h4>
                                </div>
                                <div className="bg-red-950/40 text-red-400 px-2 py-1 rounded border border-red-900/60 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                  Unpaid
                                </div>
                              </div>

                            </div>
                          </div>

                          {/* Product-wise Sales Query/Search Panel */}
                          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                  Product Sales Performance Query (Selected Period)
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Quantity sold and sales value generated by catalog items in selected period.
                                </p>
                              </div>

                              <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  placeholder="Search item name/ID..."
                                  value={reportItemSearchQuery}
                                  onChange={(e) => setReportItemSearchQuery(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                                />
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                                  <tr>
                                    <th className="px-4 py-3">Item Name / ID</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-right">Qty Sold in Period</th>
                                    <th className="px-4 py-3 text-right">Sales Amount in Period</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                  {matchingReportItems.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                                        No products matching your search query.
                                      </td>
                                    </tr>
                                  ) : (
                                    matchingReportItems.map((itm) => {
                                      const perf = itemPerformance[itm.item_id] || { qty: 0, amount: 0 };
                                      return (
                                        <tr key={itm.item_id} className="hover:bg-slate-800/20 transition-colors">
                                          <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-200 font-display">
                                              {itm.name}
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                              {itm.item_id}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-slate-400">
                                            {itm.category}
                                          </td>
                                          <td className="px-4 py-3 text-right font-mono font-bold text-indigo-300">
                                            {perf.qty} units
                                          </td>
                                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                                            ₹{perf.amount.toFixed(2)}
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedReportItem(itm);
                                                setShowItemSalesModal(true);
                                              }}
                                              className="p-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 hover:text-white rounded ml-auto transition-all"
                                              title="View & Correct Sales"
                                            >
                                              <Edit className="w-3.5 h-3.5 text-indigo-400" />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Extra bottom space panel for mobile viewports to prevent status bar cutoff */}
                    <div className="h-28 md:h-8" />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}

        </div>

      </main>

      {/* Interactive Bottom Navigation Status bar on mobile */}
      <footer className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-1.5 fixed bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-between shrink-0 pb-safe-bottom">
        <div className="w-full flex items-center justify-between font-mono text-[8px] text-slate-500 uppercase font-semibold">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Active: {activeTab === "pos" ? "POS" : activeTab === "inventory" ? "Inventory" : activeTab === "ledger" ? "Ledger" : activeTab === "expenses" ? "Expenses" : activeTab === "purchases" ? "Purchases" : "Reports"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-1 h-1 rounded-full ${dbStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>Atlas {dbStatus.connected ? "ON" : "OFF"}</span>
          </div>

          <button 
            onClick={fetchAllData} 
            className="footer-btn flex items-center gap-1 text-[8px] font-bold uppercase transition-colors hover:text-white text-emerald-400 bg-transparent p-0 min-h-0 border-0"
            title="Click to force refresh database sync"
          >
            {dbStatus.connected ? "Cloud Synced" : "Sync Local"}
          </button>
        </div>
      </footer>

      {/* Footer system diagnostics and notification deck for Desktop layout */}
      <footer className="hidden md:flex bg-slate-900 border-t border-slate-800/80 px-4 py-2.5 items-center justify-between text-[11px] text-slate-500 shrink-0 select-none">
        <div className="flex items-center gap-2 max-w-xl truncate">
          <Terminal className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-mono text-indigo-400 font-semibold shrink-0 uppercase">CONSOLE LOG:</span>
          <span className="italic truncate text-slate-400">{logs[0] || "No events pending..."}</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[9px] text-slate-500">
          <span>Service Worker: <b className="text-emerald-500">Active</b></span>
          <span className="border-l border-slate-800 h-3" />
          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">PWA Standalone App</span>
          <span className="border-l border-slate-800 h-3" />
          <span className="flex items-center gap-1 text-[8px] font-bold uppercase text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>MongoDB Atlas {dbStatus.connected ? "(Connected)" : "(Offline)"}</span>
          </span>
          <span className="border-l border-slate-800 h-3" />
          <button 
            onClick={fetchAllData} 
            className={`footer-btn flex items-center gap-1 text-[8px] font-bold uppercase transition-colors hover:text-white ${
              dbStatus.connected ? "text-emerald-500" : "text-amber-500"
            }`}
            title="Click to force refresh database sync"
          >
            {dbStatus.connected ? "Cloud Synced" : "Local Database"}
          </button>
        </div>
      </footer>

      {/* 1. RESTOCK DIALOG OVERLAY */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Inventory Stock Adjustment
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Adjust: {showRestockModal.name}
                </h3>
              </div>
              <button
                onClick={() => setShowRestockModal(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1.5">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRestockMode("add")}
                    className={`py-1.5 text-[9px] font-bold rounded transition-all ${
                      restockMode === "add"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Restock (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestockMode("reduce")}
                    className={`py-1.5 text-[9px] font-bold rounded transition-all ${
                      restockMode === "reduce"
                        ? "bg-amber-600 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Reduce (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestockMode("wastage")}
                    className={`py-1.5 text-[9px] font-bold rounded transition-all ${
                      restockMode === "wastage"
                        ? "bg-red-600 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Wastage (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Quantity (Units)
                </label>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80 text-[10px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Current Stock:</span>
                  <span className="font-mono font-bold text-slate-300">{showRestockModal.current_stock_qty} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Adjustment:</span>
                  <span className={`font-mono font-bold ${restockMode === "add" ? "text-emerald-400" : "text-red-400"}`}>
                    {restockMode === "add" ? "+" : "-"}{restockQty} units
                  </span>
                </div>
                {restockMode === "wastage" && (
                  <div className="flex justify-between border-b border-slate-800/60 pb-1 mb-1 font-bold text-red-400">
                    <span>Expense Generated:</span>
                    <span className="font-mono">
                      ₹{(restockQty * showRestockModal.purchase_price).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800/60 pt-1 mt-1 font-bold">
                  <span>Expected Stock:</span>
                  <span className="font-mono text-white">
                    {restockMode === "add"
                      ? showRestockModal.current_stock_qty + restockQty
                      : Math.max(0, showRestockModal.current_stock_qty - restockQty)}{" "}
                    units
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRestockModal(null)}
                className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                className={`text-white text-xs font-bold px-3 py-2 rounded-lg transition-all ${
                  restockMode === "add" ? "bg-indigo-600 hover:bg-indigo-500" : restockMode === "wastage" ? "bg-red-600 hover:bg-red-500" : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {restockMode === "add" ? "Confirm Add Stock" : restockMode === "wastage" ? "Confirm Log Wastage" : "Confirm Reduce Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LEDGER SETTLEMENT OVERLAY */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Outstanding Settlement
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Pay Credit: {showSettlementModal.customer_name}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Invoice Code: {showSettlementModal.sale_id}
                </p>
              </div>
              <button
                onClick={() => setShowSettlementModal(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Outstanding Balance:</span>
                <span className="font-mono font-bold text-red-400">
                  ₹{(showSettlementModal.net_amount_payable - (showSettlementModal.payment_received || 0)).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Received Amount (₹)
                </label>
                <input
                  type="number"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(Math.min(showSettlementModal.net_amount_payable, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSettlementModal(null)}
                className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSettlement}
                className="bg-[#ffb647] hover:bg-[#e6a33e] text-slate-950 text-xs font-bold px-3 py-2 rounded-lg"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. NEW PRODUCT / ITEM OVERLAY */}
      {showNewItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Catalog Management
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Add New Product / Item
                </h3>
              </div>
              <button
                onClick={() => setShowNewItemModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Product Unique ID Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. party_banner_bday"
                  value={newItem.item_id}
                  onChange={(e) => {
                    setNewItem({ ...newItem, item_id: e.target.value });
                    setIsIdManuallyEdited(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 font-mono"
                />
                {items.some(itm => String(itm?.item_id || "").toLowerCase() === String(newItem.item_id || "").trim().toLowerCase().replace(/\s+/g, "_")) && (
                  <span className="text-[9px] text-red-400 font-semibold mt-1 block">
                    ⚠️ This Product ID already exists and cannot be duplicated.
                  </span>
                )}
              </div>

              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Product Name / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Golden Birthday Foil Banner"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Category Classification
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__MANAGE_CATEGORIES__") {
                      setShowManageCategoriesModal(true);
                      return;
                    }
                    setNewItem({ ...newItem, category: val });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="__MANAGE_CATEGORIES__">-- Manage Categories --</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                    Buy Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newItem.purchase_price || ""}
                    onChange={(e) => setNewItem({ ...newItem, purchase_price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                    Retail Sell (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newItem.selling_price_retail || ""}
                    onChange={(e) => setNewItem({ ...newItem, selling_price_retail: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                    Wholesale (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newItem.selling_price_wholesale || ""}
                    onChange={(e) => setNewItem({ ...newItem, selling_price_wholesale: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    required
                    value={newItem.current_stock_qty || ""}
                    onChange={(e) => setNewItem({ ...newItem, current_stock_qty: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    required
                    value={newItem.min_stock_alert || ""}
                    onChange={(e) => setNewItem({ ...newItem, min_stock_alert: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewItemModal(false)}
                  className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
                >
                  Create Product listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 3.5. MANAGE CATEGORIES OVERLAY */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Catalog Management
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Manage Categories
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowManageCategoriesModal(false);
                  setEditingCategory(null);
                  setNewCategoryName("");
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add New Category */}
            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="New category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700"
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg"
              >
                Add
              </button>
            </form>

            {/* List Existing Categories */}
            <div className="mt-4 border border-slate-800 rounded-lg bg-slate-950/25 overflow-hidden">
              <div className="max-h-60 overflow-y-auto no-scrollbar p-2 space-y-2">
                {categories.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No categories found.</p>
                )}
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {editingCategory === cat ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = (e.target as HTMLFormElement).elements.namedItem("editCat") as HTMLInputElement;
                          handleEditCategory(cat, input.value);
                        }}
                        className="flex flex-1 gap-2 mr-2"
                      >
                        <input
                          type="text"
                          name="editCat"
                          defaultValue={cat}
                          autoFocus
                          className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button type="submit" className="text-indigo-400 hover:text-indigo-300">
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="text-slate-400 hover:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="text-xs text-slate-200">{cat}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingCategory(cat)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1 text-red-400/70 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE EXPENSE CATEGORIES OVERLAY */}
      {showManageExpenseCategoriesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Database Management
                </span>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-1">
                  <Database className="w-5 h-5 text-indigo-500" />
                  Expense Categories
                </h3>
              </div>
              <button
                onClick={() => setShowManageExpenseCategoriesModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              These categories appear in the "Record Company Expense" dropdown. Deletion is restricted if a category has been used in historical records.
            </p>

            <form onSubmit={handleCreateExpenseCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="New category name..."
                value={newExpenseCategoryName}
                onChange={(e) => setNewExpenseCategoryName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newExpenseCategoryName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                Add
              </button>
            </form>

            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
              <div className="divide-y divide-slate-800 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {expenseCategories.map(cat => (
                  <div key={cat} className="flex justify-between items-center p-3 hover:bg-slate-800/30 transition-colors">
                    <span className="text-xs text-slate-200">{cat}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteExpenseCategory(cat)}
                        className="p-1 text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {expenseCategories.length === 0 && (
                  <div className="p-4 text-center text-[10px] text-slate-500">
                    No custom expense categories found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE CUSTOMERS OVERLAY */}
      {showManageCustomersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Database Management
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Manage Customers
                </h3>
              </div>
              <button
                onClick={() => setShowManageCustomersModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 border border-slate-800 rounded-lg bg-slate-950/25 overflow-hidden">
              <div className="max-h-60 overflow-y-auto no-scrollbar p-2 space-y-2">
                {customersList.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No customers found.</p>
                )}
                {customersList.map((cust) => (
                  <div key={cust} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-200">{cust}</span>
                    <button
                      onClick={() => handleDeleteCustomer(cust)}
                      className="p-1 text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE SUPPLIERS OVERLAY */}
      {showManageSuppliersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Database Management
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Manage Suppliers
                </h3>
              </div>
              <button
                onClick={() => setShowManageSuppliersModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 border border-slate-800 rounded-lg bg-slate-950/25 overflow-hidden">
              <div className="max-h-60 overflow-y-auto no-scrollbar p-2 space-y-2">
                {suppliersList.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No suppliers found.</p>
                )}
                {suppliersList.map((supp) => (
                  <div key={supp} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-200">{supp}</span>
                    <button
                      onClick={() => handleDeleteSupplier(supp)}
                      className="p-1 text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {showEditExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Edit Expense Voucher
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Voucher: {showEditExpenseModal.expense_id}
                </p>
              </div>
              <button
                onClick={() => setShowEditExpenseModal(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const category = formData.get("category") as string;
                const amount = Number(formData.get("amount"));
                const remarks = formData.get("remarks") as string;
                const date = formData.get("date") as string;

                if (amount <= 0) {
                  alert("Amount must be greater than 0.");
                  return;
                }

                handleEditExpense({
                  ...showEditExpenseModal,
                  date: new Date(date).toISOString(),
                  category,
                  amount,
                  remarks: remarks.trim()
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Voucher Date
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={showEditExpenseModal.date.slice(0, 10)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Expense Category
                </label>
                <select
                  name="category"
                  required
                  defaultValue={showEditExpenseModal.category}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Rent & Utilities">Rent & Utilities</option>
                  <option value="Staff Salaries">Staff Salaries</option>
                  <option value="Logistics & Freight">Logistics & Freight</option>
                  <option value="Packaging Supplies">Packaging Supplies</option>
                  <option value="Office & Petty Expense">Office & Petty Expense</option>
                  <option value="Government Taxes & Fees">Government Taxes & Fees</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  defaultValue={showEditExpenseModal.amount}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Remarks / Description
                </label>
                <textarea
                  name="remarks"
                  rows={3}
                  defaultValue={showEditExpenseModal.remarks}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditExpenseModal(null)}
                  className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INWARD VOUCHER MODAL */}
      {showEditInwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-2xl w-full space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Edit Inward Purchase Voucher
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Voucher: {showEditInwardModal.inward_id}
                </p>
              </div>
              <button
                onClick={() => setShowEditInwardModal(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                    Voucher Date
                  </label>
                  <input
                    type="date"
                    value={editInwardDate}
                    onChange={(e) => setEditInwardDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={editInwardSupplier}
                    onChange={(e) => setEditInwardSupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Add item to edit-cart section */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-3">
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold block">
                  Add / Edit Items in Voucher
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">Select Catalog Product</label>
                    <select
                      value={selectedEditInwardItem}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedEditInwardItem(val);
                        const matched = items.find(i => i.item_id === val);
                        if (matched) setEditInwardItemRate(matched.purchase_price);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Choose Item --</option>
                      {items.map(itm => (
                        <option key={itm.item_id} value={itm.item_id}>{itm.name} ({itm.item_id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">Purchase Qty</label>
                    <input
                      type="number"
                      value={editInwardItemQty}
                      onChange={(e) => setEditInwardItemQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-500 block mb-0.5">Purchase Rate (₹)</label>
                      <input
                        type="number"
                        value={editInwardItemRate}
                        onChange={(e) => setEditInwardItemRate(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedEditInwardItem) {
                          alert("Select a product to add.");
                          return;
                        }
                        const matched = items.find(i => i.item_id === selectedEditInwardItem);
                        if (!matched) return;

                        const existsIdx = inwardEditCart.findIndex(c => c.item.item_id === selectedEditInwardItem);
                        if (existsIdx > -1) {
                          const updated = [...inwardEditCart];
                          if (editInwardItemQty <= 0) {
                            updated.splice(existsIdx, 1);
                          } else {
                            updated[existsIdx] = { item: matched, qty: editInwardItemQty, rate: editInwardItemRate };
                          }
                          setInwardEditCart(updated);
                        } else {
                          if (editInwardItemQty > 0) {
                            setInwardEditCart([...inwardEditCart, { item: matched, qty: editInwardItemQty, rate: editInwardItemRate }]);
                          }
                        }

                        setSelectedEditInwardItem("");
                        setEditInwardItemQty(1);
                        setEditInwardItemRate(0);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded transition-all shrink-0"
                    >
                      Add/Update
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List in Voucher */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[9px]">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {inwardEditCart.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-slate-500 text-xs font-sans">
                          No items in inward voucher edit cart.
                        </td>
                      </tr>
                    ) : (
                      inwardEditCart.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 text-slate-300">
                          <td className="px-3 py-2 font-sans font-semibold text-slate-200">
                            {c.item.name}
                          </td>
                          <td className="px-3 py-2 text-right text-indigo-300">
                            {c.qty}
                          </td>
                          <td className="px-3 py-2 text-right">
                            ₹{c.rate.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-400 font-bold">
                            ₹{(c.qty * c.rate).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setInwardEditCart(inwardEditCart.filter((_, i) => i !== idx));
                              }}
                              className="text-red-400 hover:text-red-300 p-0.5 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-xs font-mono font-bold bg-slate-950 p-2.5 rounded border border-slate-850">
                <span className="text-slate-400">INVOICE GRAND TOTAL:</span>
                <span className="text-emerald-400 text-sm">
                  ₹{inwardEditCart.reduce((sum, c) => sum + (c.qty * c.rate), 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditInwardModal(null)}
                className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editInwardSupplier.trim()) {
                    alert("Please specify supplier name.");
                    return;
                  }
                  if (inwardEditCart.length === 0) {
                    handleDeleteInward(showEditInwardModal.inward_id);
                    return;
                  }
                  const totalCost = inwardEditCart.reduce((sum, c) => sum + (c.qty * c.rate), 0);
                  if (totalCost <= 0 && inwardEditCart.length > 0) {
                    alert("Total invoice cost must be greater than 0.");
                    return;
                  }

                  handleEditInward({
                    ...showEditInwardModal,
                    date: new Date(editInwardDate).toISOString(),
                    supplier_name: editInwardSupplier.trim(),
                    items_received: inwardEditCart.map(c => ({
                      item_id: c.item.item_id,
                      qty_added: c.qty,
                      purchase_price_at_time: c.rate
                    })),
                    total_invoice_cost: totalCost
                  });
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3B. FINANCIAL LEDGER DRILL-DOWN MODAL */}
      {financialLedgerQuery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-4xl w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Financial Ledger Drill-Down
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  {financialLedgerQuery === "revenue" ? "Total Revenue - Sales Vouchers" : "Outstanding Udhaar - Unpaid Vouchers"}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {financialLedgerQuery === "revenue" 
                    ? "Listing all sales vouchers that contribute to the total revenue for the selected period." 
                    : "Listing all credit sales vouchers with pending balances for the selected period."}
                </p>
              </div>
              <button
                onClick={() => setFinancialLedgerQuery(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar border border-slate-800 rounded-xl bg-slate-950/40">
              {(() => {
                const salesPeriod = getFilteredSales();
                const matchedSales = financialLedgerQuery === "revenue"
                  ? salesPeriod
                  : salesPeriod.filter(s => s.payment_mode === "Credit" && (s.net_amount_payable - (s.payment_received || 0)) > 0);

                if (matchedSales.length === 0) {
                  return (
                    <div className="p-8 text-center text-sm text-slate-500 font-medium">
                      No sales vouchers found for this ledger in the selected period.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="sticky top-0 bg-slate-950 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800/60 z-10">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Voucher ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3 text-right">Items</th>
                        <th className="px-4 py-3 text-right">Net Amount</th>
                        {financialLedgerQuery === "outstanding" && (
                          <th className="px-4 py-3 text-right">Pending Balance</th>
                        )}
                        <th className="px-4 py-3">Mode</th>
                        {financialLedgerQuery === "outstanding" && (
                          <th className="px-4 py-3 text-right">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {matchedSales.map((sal) => {
                        const balance = sal.net_amount_payable - (sal.payment_received || 0);
                        return (
                          <tr key={sal.sale_id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                              {new Date(sal.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                              {sal.sale_id}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-200">{sal.customer_name}</div>
                              <div className="text-[9px] uppercase tracking-wider text-slate-500">{sal.customer_type}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-300">
                              {sal.items_sold.reduce((acc, item) => acc + item.qty_sold, 0)} units
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-white">
                              ₹{sal.net_amount_payable.toFixed(2)}
                            </td>
                            {financialLedgerQuery === "outstanding" && (
                              <td className="px-4 py-3 text-right font-mono font-bold text-red-400">
                                ₹{balance.toFixed(2)}
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                sal.payment_mode === "Cash" ? "bg-emerald-950/60 border border-emerald-800 text-emerald-400" :
                                sal.payment_mode === "UPI" ? "bg-blue-950/60 border border-blue-850 text-blue-400" :
                                "bg-amber-950/60 border border-amber-900 text-amber-400"
                              }`}>
                                {sal.payment_mode}
                              </span>
                            </td>
                            {financialLedgerQuery === "outstanding" && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleWriteOffDebt(sal, balance)}
                                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 px-2 py-1 rounded text-[9px] font-bold tracking-wide uppercase transition-all"
                                  title="Write off this unpaid amount as a bad debt expense"
                                >
                                  Write-off
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setFinancialLedgerQuery(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRODUCT SALES QUERY MODAL (List sales of specific item in selected period) */}
      {showItemSalesModal && selectedReportItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-4xl w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Product Performance Query
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Sales Vouchers: {selectedReportItem.name}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Listing all transactions that contain Product / Item <span className="font-mono text-indigo-400 font-bold">{selectedReportItem.item_id}</span> during the selected timeframe.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowItemSalesModal(false);
                  setSelectedReportItem(null);
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar border border-slate-800 rounded-xl bg-slate-950/40">
              {(() => {
                const salesPeriod = getFilteredSales();
                const matchedSales = salesPeriod.filter((s) => 
                  s.items_sold.some((si) => si.item_id === selectedReportItem.item_id)
                );

                if (matchedSales.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No sales vouchers found for this product in the selected period.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[9px] font-bold border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Invoice Code</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3 text-right">Sold Qty</th>
                        <th className="px-4 py-3 text-right">Rate Charged</th>
                        <th className="px-4 py-3 text-right">Invoice Net</th>
                        <th className="px-4 py-3">Pay Mode</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {matchedSales.map((sal) => {
                        const targetLineItem = sal.items_sold.find((si) => si.item_id === selectedReportItem.item_id);
                        if (!targetLineItem) return null;

                        return (
                          <tr key={sal.sale_id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                              {new Date(sal.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                              {sal.sale_id}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-200">{sal.customer_name}</div>
                              <div className="text-[9px] uppercase tracking-wider text-slate-500">{sal.customer_type}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-indigo-300">
                              {targetLineItem.qty_sold} units
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-300">
                              ₹{targetLineItem.unit_price.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-white">
                              ₹{sal.net_amount_payable.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                sal.payment_mode === "Cash" ? "bg-emerald-950/60 border border-emerald-800 text-emerald-400" :
                                sal.payment_mode === "UPI" ? "bg-blue-950/60 border border-blue-850 text-blue-400" :
                                "bg-amber-950/60 border border-amber-900 text-amber-400"
                              }`}>
                                {sal.payment_mode}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingSaleVoucher({ ...sal })}
                                  className="bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-750 text-indigo-300 px-2 py-1 rounded text-[10px] font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSale(sal.sale_id)}
                                  className="bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 text-red-400 px-2 py-1 rounded text-[10px] font-bold"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowItemSalesModal(false);
                  setSelectedReportItem(null);
                }}
                className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EDIT SALE VOUCHER OVERLAY */}
      {editingSaleVoucher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-2xl w-full space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">
                  Transactional Correction Mode
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Correct Sale Voucher: {editingSaleVoucher.sale_id}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Update customer parameters, line items, and financial values. Stock levels will be auto-calculated.
                </p>
              </div>
              <button
                onClick={() => setEditingSaleVoucher(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                    Customer Name / Reference
                  </label>
                  <input
                    type="text"
                    value={editingSaleVoucher.customer_name}
                    onChange={(e) => setEditingSaleVoucher({ ...editingSaleVoucher, customer_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                    Customer Pricing Tier
                  </label>
                  <select
                    value={editingSaleVoucher.customer_type}
                    onChange={(e) => setEditingSaleVoucher({ ...editingSaleVoucher, customer_type: e.target.value as "Retail" | "Wholesale" })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={editingSaleVoucher.payment_mode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      const payable = editingSaleVoucher.net_amount_payable;
                      setEditingSaleVoucher({ 
                        ...editingSaleVoucher, 
                        payment_mode: mode as any,
                        payment_received: mode === "Credit" ? 0 : payable
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit">Credit (Udhaar Ledger)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                    Voucher Date
                  </label>
                  <input
                    type="date"
                    value={editingSaleVoucher.date.split("T")[0]}
                    onChange={(e) => setEditingSaleVoucher({ ...editingSaleVoucher, date: new Date(e.target.value).toISOString() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Items List inside Voucher */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950/60 p-2.5 border-b border-slate-800 flex justify-between">
                  <span className="font-bold text-slate-300 text-[10px] uppercase">Voucher Line Items</span>
                  <span className="text-slate-500 text-[9px]">Adjust quantites and corrected rates</span>
                </div>
                <div className="divide-y divide-slate-850 max-h-[220px] overflow-y-auto no-scrollbar">
                  {editingSaleVoucher.items_sold.map((si, index) => {
                    const updateLineItem = (qty: number, rate: number) => {
                      let copiedItems = [...editingSaleVoucher.items_sold];
                      
                      if (qty <= 0) {
                        // Remove item completely
                        copiedItems.splice(index, 1);
                      } else {
                        copiedItems[index] = {
                          ...copiedItems[index],
                          qty_sold: qty,
                          unit_price: rate,
                          total_item_price: qty * rate
                        };
                      }

                      const gross = copiedItems.reduce((sum, item) => sum + item.total_item_price, 0);
                      const net = gross - editingSaleVoucher.discount_given;

                      setEditingSaleVoucher({
                        ...editingSaleVoucher,
                        items_sold: copiedItems,
                        gross_total: gross,
                        net_amount_payable: net,
                        payment_received: editingSaleVoucher.payment_mode === "Credit" ? 0 : net
                      });
                    };

                    return (
                      <div key={si.item_id} className="p-3 bg-slate-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1">
                          <span className="font-bold text-slate-200 block">{si.name}</span>
                          <span className="font-mono text-[9px] text-slate-500">ID: {si.item_id}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <label className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">Quantity</label>
                            <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                              <button
                                type="button"
                                onClick={() => updateLineItem(si.qty_sold - 1, si.unit_price)}
                                className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-850 flex items-center justify-center text-slate-400 font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-mono font-bold text-white text-xs">{si.qty_sold}</span>
                              <button
                                type="button"
                                onClick={() => updateLineItem(si.qty_sold + 1, si.unit_price)}
                                className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-850 flex items-center justify-center text-slate-400 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col w-20">
                            <label className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">Rate (₹)</label>
                            <input
                              type="number"
                              value={si.unit_price}
                              onChange={(e) => updateLineItem(si.qty_sold, Math.max(0, Number(e.target.value)))}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>

                          <div className="flex flex-col text-right w-20">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Total</span>
                            <span className="font-mono font-bold text-white pt-1">₹{(si.qty_sold * si.unit_price).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount and Voucher Grand Totals */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                    Voucher Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={editingSaleVoucher.discount_given}
                    onChange={(e) => {
                      const disc = Math.max(0, Number(e.target.value));
                      const net = editingSaleVoucher.gross_total - disc;
                      setEditingSaleVoucher({
                        ...editingSaleVoucher,
                        discount_given: disc,
                        net_amount_payable: net,
                        payment_received: editingSaleVoucher.payment_mode === "Credit" ? 0 : net
                      });
                    }}
                    className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-amber-400 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-4 font-mono text-xs text-right justify-end">
                  <div className="text-slate-500">
                    <div>Gross Total:</div>
                    <div className="mt-1">Discount Given:</div>
                    <div className="mt-1 border-t border-slate-800 pt-1 font-bold text-slate-300">Net Payable:</div>
                  </div>
                  <div className="font-bold text-slate-300">
                    <div>₹{editingSaleVoucher.gross_total.toFixed(2)}</div>
                    <div className="text-amber-400 mt-1">- ₹{editingSaleVoucher.discount_given.toFixed(2)}</div>
                    <div className="text-emerald-400 mt-1 border-t border-slate-800 pt-1 font-black text-sm">₹{editingSaleVoucher.net_amount_payable.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setEditingSaleVoucher(null)}
                className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleEditSale(editingSaleVoucher)}
                className="bg-[#ffb647] hover:bg-[#e6a33e] text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all"
              >
                Save Changes & Correct
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT PRODUCT DETAILS OVERLAY */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                  Catalog Management
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Edit Catalog Item & Pricing Rates
                </h3>
              </div>
              <button
                onClick={() => { setEditingItem(null); setOriginalEditingItemId(null); }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-3 text-xs">
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Product Unique ID Code
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.item_id || ""}
                  onChange={(e) => {
                    setEditingItem({ ...editingItem, item_id: e.target.value });
                    setIsEditIdManuallyEdited(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
                {originalEditingItemId && (editingItem.item_id || "") !== originalEditingItemId && items.some(itm => String(itm?.item_id || "").toLowerCase() === String(editingItem.item_id || "").trim().toLowerCase().replace(/\s+/g, "_")) && (
                  <span className="text-[9px] text-red-400 font-semibold mt-1 block">
                    ⚠️ This Product ID already exists and cannot be duplicated.
                  </span>
                )}
              </div>

              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Product Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ""}
                  onChange={(e) => {
                    const newName = e.target.value;
                    let newItemId = editingItem.item_id;
                    if (!isEditIdManuallyEdited && newName.trim() && editingItem.category) {
                      newItemId = generateSuggestedCode(newName, editingItem.category);
                    } else if (!isEditIdManuallyEdited) {
                      newItemId = "";
                    }
                    setEditingItem({ ...editingItem, name: newName, item_id: newItemId });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Category Classification
                </label>
                <select
                  value={editingItem.category || ""}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    if (newCategory === "__MANAGE_CATEGORIES__") {
                      setShowManageCategoriesModal(true);
                      return;
                    }
                    let newItemId = editingItem.item_id;
                    if (!isEditIdManuallyEdited && editingItem.name?.trim() && newCategory) {
                      newItemId = generateSuggestedCode(editingItem.name, newCategory);
                    } else if (!isEditIdManuallyEdited) {
                      newItemId = "";
                    }
                    setEditingItem({ ...editingItem, category: newCategory, item_id: newItemId });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="__MANAGE_CATEGORIES__">-- Manage Categories --</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                    Purchase Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editingItem.purchase_price}
                      onChange={(e) => setEditingItem({ ...editingItem, purchase_price: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                    Retail Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editingItem.selling_price_retail}
                      onChange={(e) => setEditingItem({ ...editingItem, selling_price_retail: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                    Wholesale Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editingItem.selling_price_wholesale}
                      onChange={(e) => setEditingItem({ ...editingItem, selling_price_wholesale: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                    Min. Stock Alert
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingItem.min_stock_alert}
                    onChange={(e) => setEditingItem({ ...editingItem, min_stock_alert: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(originalEditingItemId || editingItem.item_id)}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-colors text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditingItem(null); setOriginalEditingItemId(null); }}
                    className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Save className="w-3 h-3" />
                    Save Catalog Update
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile slide-in right side navigation drawer overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex justify-end md:hidden">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setShowMobileMenu(false)} />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-[280px] h-full bg-slate-900 border-l border-slate-800 p-5 space-y-5 flex flex-col z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">App Navigation</h3>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stack list of Navigation buttons */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto no-scrollbar">
                {[
                  { id: "pos", name: "POS Sale Billing", desc: "Checkout Terminal", icon: ShoppingCart },
                  { id: "inventory", name: "Inventory Stock", desc: "Catalog & Products", icon: Package },
                  { id: "ledger", name: "Outstanding Ledger", desc: "Credit Accounts", icon: Layers },
                  { id: "expenses", name: "Expenses Log", desc: "Log Store Costs", icon: DollarSign },
                  { id: "purchases", name: "Stock Purchases", desc: "Register Inwards", icon: Truck },
                  { id: "reports", name: "Financial Reports", desc: "Ledger Analytics", icon: PieChart },
                  { id: "online_orders", name: "Online Orders", desc: "Customer Requests", icon: Smartphone }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setShowMobileMenu(false);
                      }}
                      className={`flex flex-row items-center gap-3 p-3 rounded-xl border text-left transition-all w-full shrink-0 ${
                        isActive
                          ? "bg-indigo-600/90 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                          : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-slate-900 text-indigo-400"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black tracking-wide leading-snug">{item.name}</div>
                        <div className={`text-[9px] mt-0.5 leading-tight ${isActive ? "text-indigo-200" : "text-slate-500"} truncate`}>{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom footer text inside drawer */}
              <div className="pt-3 border-t border-slate-800/60 text-[9px] font-mono text-slate-500 text-center">
                Swamidatta Traders v2.1.0
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
