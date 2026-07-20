import express from "express";
import path from "path";
import fs from "fs";
import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Seed data definitions
const SEED_ITEMS = [
  { item_id: "disp_plate_6", name: "Paper Plates - 6 Inch (Pack of 50)", category: "Disposables", purchase_price: 35.0, selling_price_retail: 50.0, selling_price_wholesale: 42.0, current_stock_qty: 120, min_stock_alert: 30 },
  { item_id: "disp_plate_8", name: "Paper Plates - 8 Inch (Pack of 50)", category: "Disposables", purchase_price: 45.0, selling_price_retail: 65.0, selling_price_wholesale: 52.0, current_stock_qty: 90, min_stock_alert: 25 },
  { item_id: "disp_plate_12", name: "Paper Plates - 12 Inch (Pack of 50)", category: "Disposables", purchase_price: 65.0, selling_price_retail: 95.0, selling_price_wholesale: 78.0, current_stock_qty: 12, min_stock_alert: 20 },
  { item_id: "disp_cup_60", name: "Paper Cups - 60ml (Pack of 100)", category: "Disposables", purchase_price: 22.0, selling_price_retail: 35.0, selling_price_wholesale: 28.0, current_stock_qty: 250, min_stock_alert: 50 },
  { item_id: "disp_cup_150", name: "Paper Cups - 150ml (Pack of 100)", category: "Disposables", purchase_price: 32.0, selling_price_retail: 50.0, selling_price_wholesale: 40.0, current_stock_qty: 180, min_stock_alert: 40 },
  { item_id: "disp_cup_250", name: "Paper Cups - 250ml (Pack of 100)", category: "Disposables", purchase_price: 45.0, selling_price_retail: 70.0, selling_price_wholesale: 55.0, current_stock_qty: 140, min_stock_alert: 35 },
  { item_id: "disp_glasses", name: "Paper/Plastic Glasses (Pack of 50)", category: "Disposables", purchase_price: 28.0, selling_price_retail: 45.0, selling_price_wholesale: 34.0, current_stock_qty: 5, min_stock_alert: 15 },
  { item_id: "disp_tissue_napkin", name: "Tissue Papers (Napkins - Pack of 100)", category: "Disposables", purchase_price: 18.0, selling_price_retail: 30.0, selling_price_wholesale: 22.0, current_stock_qty: 300, min_stock_alert: 50 },
  { item_id: "disp_tissue_roll", name: "Tissue Papers (Table Roll - 50m)", category: "Disposables", purchase_price: 55.0, selling_price_retail: 80.0, selling_price_wholesale: 65.0, current_stock_qty: 45, min_stock_alert: 10 },
  { item_id: "disp_foil_roll", name: "Aluminum Foil Roll (18 Meters)", category: "Disposables", purchase_price: 85.0, selling_price_retail: 120.0, selling_price_wholesale: 98.0, current_stock_qty: 60, min_stock_alert: 15 },
  { item_id: "disp_container_250", name: "Aluminum Foil Containers with Lids - 250ml (Pack of 50)", category: "Disposables", purchase_price: 110.0, selling_price_retail: 160.0, selling_price_wholesale: 130.0, current_stock_qty: 85, min_stock_alert: 20 },
  { item_id: "disp_container_450", name: "Aluminum Foil Containers with Lids - 450ml (Pack of 50)", category: "Disposables", purchase_price: 140.0, selling_price_retail: 200.0, selling_price_wholesale: 165.0, current_stock_qty: 70, min_stock_alert: 15 },
  { item_id: "disp_container_750", name: "Aluminum Foil Containers with Lids - 750ml (Pack of 50)", category: "Disposables", purchase_price: 180.0, selling_price_retail: 260.0, selling_price_wholesale: 210.0, current_stock_qty: 40, min_stock_alert: 10 },
  { item_id: "disp_container_3c", name: "Aluminum Foil Containers - 3-Compartment (Pack of 50)", category: "Disposables", purchase_price: 240.0, selling_price_retail: 350.0, selling_price_wholesale: 285.0, current_stock_qty: 30, min_stock_alert: 8 },
  { item_id: "disp_spoons", name: "Wooden/Plastic Spoons (Pack of 100)", category: "Disposables", purchase_price: 40.0, selling_price_retail: 60.0, selling_price_wholesale: 48.0, current_stock_qty: 150, min_stock_alert: 30 },
  { item_id: "disp_garbage_bags", name: "Garbage Bags (Pack of 30 - Large)", category: "Disposables", purchase_price: 50.0, selling_price_retail: 80.0, selling_price_wholesale: 60.0, current_stock_qty: 95, min_stock_alert: 15 },
  { item_id: "puja_agarbatti_sandal", name: "Sandalwood Agarbatti (Incense Sticks)", category: "Mangal Puja Samagri", purchase_price: 25.0, selling_price_retail: 40.0, selling_price_wholesale: 30.0, current_stock_qty: 200, min_stock_alert: 40 },
  { item_id: "puja_agarbatti_rose", name: "Rose Agarbatti (Incense Sticks)", category: "Mangal Puja Samagri", purchase_price: 25.0, selling_price_retail: 40.0, selling_price_wholesale: 30.0, current_stock_qty: 150, min_stock_alert: 30 },
  { item_id: "puja_dhoop_cones", name: "Dhoop Cones (Gubbare Premium - Pack of 20)", category: "Mangal Puja Samagri", purchase_price: 30.0, selling_price_retail: 50.0, selling_price_wholesale: 38.0, current_stock_qty: 110, min_stock_alert: 20 },
  { item_id: "puja_camphor_tablets", name: "Camphor Tablets (Kapoor - 50g)", category: "Mangal Puja Samagri", purchase_price: 35.0, selling_price_retail: 60.0, selling_price_wholesale: 45.0, current_stock_qty: 8, min_stock_alert: 25 },
  { item_id: "puja_wicks_round", name: "Cotton Wicks - Round (Pack of 200)", category: "Mangal Puja Samagri", purchase_price: 15.0, selling_price_retail: 25.0, selling_price_wholesale: 18.0, current_stock_qty: 300, min_stock_alert: 50 },
  { item_id: "puja_oil_1l", name: "Pure Puja Oil (Til/Sesame - 1 Litre)", category: "Mangal Puja Samagri", purchase_price: 140.0, selling_price_retail: 180.0, selling_price_wholesale: 155.0, current_stock_qty: 55, min_stock_alert: 15 },
  { item_id: "puja_ghee_packet", name: "Pure Ghee Puja Packet (200g)", category: "Mangal Puja Samagri", purchase_price: 110.0, selling_price_retail: 140.0, selling_price_wholesale: 122.0, current_stock_qty: 65, min_stock_alert: 12 },
  { item_id: "puja_kumkum_powder", name: "Roli/Kumkum Powder (100g Box)", category: "Mangal Puja Samagri", purchase_price: 12.0, selling_price_retail: 20.0, selling_price_wholesale: 15.0, current_stock_qty: 140, min_stock_alert: 30 },
  { item_id: "puja_mauli_threads", name: "Mauli/Kalawa Threads (Pack of 10 Rolls)", category: "Mangal Puja Samagri", purchase_price: 45.0, selling_price_retail: 70.0, selling_price_wholesale: 54.0, current_stock_qty: 120, min_stock_alert: 20 },
  { item_id: "puja_supari", name: "Pooja Betel Nuts (Supari - 250g)", category: "Mangal Puja Samagri", purchase_price: 90.0, selling_price_retail: 130.0, selling_price_wholesale: 105.0, current_stock_qty: 40, min_stock_alert: 10 },
  { item_id: "party_balloons_metallic", name: "Metallic Balloons (Pack of 100 - Multi)", category: "Party Decoration Articles", purchase_price: 60.0, selling_price_retail: 100.0, selling_price_wholesale: 75.0, current_stock_qty: 85, min_stock_alert: 20 },
  { item_id: "party_poppers_large", name: "Party Poppers (Large - Pack of 5)", category: "Party Decoration Articles", purchase_price: 120.0, selling_price_retail: 180.0, selling_price_wholesale: 145.0, current_stock_qty: 4, min_stock_alert: 10 },
  { item_id: "party_snow_spray", name: "Foam/Snow Spray Cans", category: "Party Decoration Articles", purchase_price: 25.0, selling_price_retail: 45.0, selling_price_wholesale: 32.0, current_stock_qty: 115, min_stock_alert: 15 },
  { item_id: "party_sparkling_candles", name: "Sparkling Birthday Candles (Pack of 12)", category: "Party Decoration Articles", purchase_price: 35.0, selling_price_retail: 60.0, selling_price_wholesale: 45.0, current_stock_qty: 130, min_stock_alert: 25 },
  { item_id: "party_led_rice_lights", name: "LED Rice Lights (Warm White - 10 Meters)", category: "Party Decoration Articles", purchase_price: 45.0, selling_price_retail: 80.0, selling_price_wholesale: 55.0, current_stock_qty: 150, min_stock_alert: 30 }
];

const SEED_EXPENSES = [
  { expense_id: "EXP_001", date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), category: "Freight", amount: 1500.0, remarks: "Disposables delivery transport charges from Mumbai warehouse." },
  { expense_id: "EXP_002", date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), category: "Utilities", amount: 3200.0, remarks: "Electricity charges for shop and warehouse air circulation." }
];

const SEED_SALES = [
  { sale_id: "SALE_001", date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), customer_name: "Laxmi Supermarket", customer_type: "Wholesale", items_sold: [{ item_id: "disp_plate_8", name: "Paper Plates - 8 Inch (Pack of 50)", qty_sold: 10, unit_price: 52.0, total_item_price: 520.0 }, { item_id: "disp_cup_150", name: "Paper Cups - 150ml (Pack of 100)", qty_sold: 20, unit_price: 40.0, total_item_price: 800.0 }], gross_total: 1320.0, discount_given: 50.0, net_amount_payable: 1270.0, payment_mode: "UPI", payment_received: 1270.0 },
  { sale_id: "SALE_002", date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), customer_name: "Suresh Patil (Party Order)", customer_type: "Retail", items_sold: [{ item_id: "party_balloons_metallic", name: "Metallic Balloons (Pack of 100 - Multi)", qty_sold: 3, unit_price: 100.0, total_item_price: 300.0 }, { item_id: "party_poppers_large", name: "Party Poppers (Large - Pack of 5)", qty_sold: 2, unit_price: 180.0, total_item_price: 360.0 }], gross_total: 660.0, discount_given: 20.0, net_amount_payable: 640.0, payment_mode: "Cash", payment_received: 640.0 },
  { sale_id: "SALE_003", date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), customer_name: "Sri Lakshmi Traders", customer_type: "Wholesale", items_sold: [{ item_id: "disp_container_750", name: "Aluminum Foil Containers with Lids - 750ml (Pack of 50)", qty_sold: 10, unit_price: 210.0, total_item_price: 2100.0 }, { item_id: "puja_oil_1l", name: "Pure Puja Oil (Til/Sesame - 1 Litre)", qty_sold: 3, unit_price: 155.0, total_item_price: 465.0 }], gross_total: 2565.0, discount_given: 115.0, net_amount_payable: 2450.0, payment_mode: "Credit", payment_received: 0 }
];

const SEED_INWARDS = [
  {
    inward_id: "INW_001",
    date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    supplier_name: "Swastik Disposables Wholesalers Ltd",
    items_received: [
      { item_id: "disp_plate_6", name: "Paper Plates - 6 Inch (Pack of 50)", qty_added: 100, purchase_price_at_time: 35.0 },
      { item_id: "disp_cup_150", name: "Paper Cups - 150ml (Pack of 100)", qty_added: 200, purchase_price_at_time: 32.0 }
    ],
    total_invoice_cost: 9900.0
  }
];

// Local JSON File Path Configurations
const DB_FILES = {
  items: path.join(process.cwd(), "items_db.json"),
  categories: path.join(process.cwd(), "categories_db.json"),
  expenses: path.join(process.cwd(), "expenses_db.json"),
  sales: path.join(process.cwd(), "sales_db.json"),
  inwards: path.join(process.cwd(), "inwards_db.json"),
  customers: path.join(process.cwd(), "customers_db.json"),
  suppliers: path.join(process.cwd(), "suppliers_db.json"),
  expense_categories: path.join(process.cwd(), "expense_categories_db.json"),
  customer_orders: path.join(process.cwd(), "customer_orders_db.json"),
  offers: path.join(process.cwd(), "offers_db.json"),
};

function readLocalData(key: "items" | "categories" | "expenses" | "sales" | "inwards" | "customers" | "suppliers" | "expense_categories" | "customer_orders" | "offers") {
  const filePath = DB_FILES[key];
  if (!fs.existsSync(filePath)) {
    let initial;
    if (key === "items") initial = SEED_ITEMS;
    else if (key === "categories") {
      const uniqueCats = Array.from(new Set(SEED_ITEMS.map((item: any) => item.category))).filter(Boolean);
      initial = uniqueCats.map(c => ({ name: c }));
    }
    else if (key === "expenses") initial = SEED_EXPENSES;
    else if (key === "sales") initial = SEED_SALES;
    else if (key === "customers") {
      const uniqueCusts = Array.from(new Set(SEED_SALES.map((s: any) => s.customer_name))).filter(Boolean);
      initial = uniqueCusts.map(c => ({ name: c }));
    }
    else if (key === "suppliers") {
      const uniqueSupps = Array.from(new Set(SEED_INWARDS.map((i: any) => i.supplier_name))).filter(Boolean);
      initial = uniqueSupps.map(s => ({ name: s }));
    }
    else if (key === "expense_categories") {
      const uniqueExpCats = Array.from(new Set(SEED_EXPENSES.map((e: any) => e.category))).filter(Boolean);
      initial = uniqueExpCats.map(c => ({ name: c }));
    }
    else if (key === "customer_orders") initial = [];
    else if (key === "offers") initial = [];
    else initial = SEED_INWARDS;
    
    // Check if we are running in Vercel to avoid read-only system errors
    if (!process.env.VERCEL) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), "utf8");
      } catch (e) {
        console.error("Local file system write ignored:", e);
      }
    }
    return initial;
  }
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${key} JSON file:`, err);
    return [];
  }
}

function writeLocalData(key: "items" | "categories" | "expenses" | "sales" | "inwards" | "customers" | "suppliers" | "expense_categories" | "customer_orders" | "offers", data: any) {
  try {
    // Check if we are running in Vercel to avoid read-only system errors
    if (process.env.VERCEL) {
      console.log(`Running on Vercel. Local file system write for ${key} ignored.`);
      return;
    }
    fs.writeFileSync(DB_FILES[key], JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Error writing ${key} JSON file:`, err);
  }
}

// Lazy-loaded MongoDB Connection Managers
let mongoClient: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnecting = false;
let lastConnectionAttemptTime = 0;
let lastConnectionError: any = null;
const CONNECTION_COOLDOWN_MS = 25000; // 25 seconds cooldown before retrying connection to prevent blocking requests

async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null; // Return null so we fallback gracefully
  }
  if (dbInstance) {
    return dbInstance;
  }
  if (isConnecting) {
    return null; // Don't trigger multiple connections simultaneously
  }

  // If we recently failed to connect, don't try again immediately to avoid hanging the app/Vercel functions
  if (lastConnectionError && (Date.now() - lastConnectionAttemptTime < CONNECTION_COOLDOWN_MS)) {
    return null;
  }

  try {
    isConnecting = true;
    lastConnectionAttemptTime = Date.now();
    console.log("Connecting to MongoDB Atlas...");
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000, // Fail fast (4 seconds) instead of hanging the serverless environment
      connectTimeoutMS: 4000,
    });
    await mongoClient.connect();
    dbInstance = mongoClient.db();
    lastConnectionError = null; // Clear any previous error on success
    console.log("MongoDB connection established.");

    // Seed collections if they are empty
    const collections = await dbInstance.listCollections().toArray();
    const hasItems = collections.some(c => c.name === "items");
    const hasCategories = collections.some(c => c.name === "categories");
    const hasExpenses = collections.some(c => c.name === "expenses");
    const hasSales = collections.some(c => c.name === "sales");
    const hasInwards = collections.some(c => c.name === "inwards");
    const hasCustomers = collections.some(c => c.name === "customers");
    const hasSuppliers = collections.some(c => c.name === "suppliers");
    const hasExpenseCategories = collections.some(c => c.name === "expense_categories");
    const hasCustomerOrders = collections.some(c => c.name === "customer_orders");
    const hasOffers = collections.some(c => c.name === "offers");

    if (!hasItems || (await dbInstance.collection("items").countDocuments()) === 0) {
      await dbInstance.collection("items").insertMany(SEED_ITEMS);
      console.log("Seeded items into MongoDB Atlas.");
    }
    
    if (!hasCategories || (await dbInstance.collection("categories").countDocuments()) === 0) {
      const allItems = await dbInstance.collection("items").find({}).toArray();
      const uniqueCats = Array.from(new Set(allItems.map((item: any) => item.category))).filter(Boolean);
      if (uniqueCats.length > 0) {
        await dbInstance.collection("categories").insertMany(uniqueCats.map(c => ({ name: c })));
        console.log("Seeded categories into MongoDB Atlas based on existing items.");
      }
    }
    if (!hasExpenses || (await dbInstance.collection("expenses").countDocuments()) === 0) {
      await dbInstance.collection("expenses").insertMany(SEED_EXPENSES);
      console.log("Seeded expenses into MongoDB Atlas.");
    }
    if (!hasSales || (await dbInstance.collection("sales").countDocuments()) === 0) {
      await dbInstance.collection("sales").insertMany(SEED_SALES);
      console.log("Seeded sales transactions into MongoDB Atlas.");
    }
    if (!hasInwards || (await dbInstance.collection("inwards").countDocuments()) === 0) {
      await dbInstance.collection("inwards").insertMany(SEED_INWARDS);
      console.log("Seeded inwards into MongoDB Atlas.");
    }
    
    if (!hasCustomers || (await dbInstance.collection("customers").countDocuments()) === 0) {
      const allSales = await dbInstance.collection("sales").find({}).toArray();
      const uniqueCusts = Array.from(new Set(allSales.map((s: any) => s.customer_name))).filter(Boolean);
      if (uniqueCusts.length > 0) {
        await dbInstance.collection("customers").insertMany(uniqueCusts.map(c => ({ name: c })));
        console.log("Seeded customers into MongoDB Atlas based on existing sales.");
      }
    }
    
    if (!hasSuppliers || (await dbInstance.collection("suppliers").countDocuments()) === 0) {
      const allInwards = await dbInstance.collection("inwards").find({}).toArray();
      const uniqueSupps = Array.from(new Set(allInwards.map((i: any) => i.supplier_name))).filter(Boolean);
      if (uniqueSupps.length > 0) {
        await dbInstance.collection("suppliers").insertMany(uniqueSupps.map(s => ({ name: s })));
        console.log("Seeded suppliers into MongoDB Atlas based on existing inwards.");
      }
    }

    if (!hasExpenseCategories || (await dbInstance.collection("expense_categories").countDocuments()) === 0) {
      const allExps = await dbInstance.collection("expenses").find({}).toArray();
      const uniqueExpCats = Array.from(new Set(allExps.map((e: any) => e.category))).filter(Boolean);
      if (uniqueExpCats.length > 0) {
        await dbInstance.collection("expense_categories").insertMany(uniqueExpCats.map(c => ({ name: c })));
        console.log("Seeded expense categories into MongoDB Atlas based on existing expenses.");
      }
    }
    
    if (!hasCustomerOrders && (await dbInstance.collection("customer_orders").countDocuments()) === 0) {
       // Do nothing, just ensure it exists if we want to initialize it empty
    }
    
    if (!hasOffers && (await dbInstance.collection("offers").countDocuments()) === 0) {
       // Empty init
    }

    console.log("MongoDB Collections Initialized.");
    return dbInstance;
  } catch (err: any) {
    lastConnectionError = err;
    console.error("MongoDB Atlas connection failure:", err);
    return null;
  } finally {
    isConnecting = false;
  }
}

// API: Connection Status
app.get("/api/status", async (req, res) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.json({
      connected: false,
      mode: "Offline/Local Storage",
      details: "No MONGODB_URI found in secrets. Storing data in local JSON files.",
    });
  }

  const db = await getMongoDb();
  if (db) {
    res.json({
      connected: true,
      mode: "MongoDB Atlas",
      details: "Connected and authenticated successfully with your cloud cluster.",
    });
  } else {
    // Check if error is due to SSL restriction / IP Whitelist
    const errMsg = lastConnectionError ? String(lastConnectionError.stack || lastConnectionError.message || lastConnectionError) : "";
    let reasonDetails = "Failed to connect to MongoDB Atlas. Operating on local file fallbacks.";
    
    if (errMsg.includes("SSL alert number 80") || errMsg.includes("tlsv1 alert internal error") || errMsg.includes("MongoServerSelectionError")) {
      reasonDetails = "Network Access Denied (SSL alert 80 / IP Blocked). Your MongoDB Atlas cluster is rejecting the connection because the server's IP address is not whitelisted. To fix this, log in to MongoDB Atlas, navigate to 'Network Access', click 'Add IP Address', and add '0.0.0.0/0' (Allow Access From Anywhere) so that dynamic cloud environments (like Vercel and AI Studio) can connect. In the meantime, the app is running smoothly in Offline mode using local file/in-memory storage fallbacks.";
    }

    res.json({
      connected: false,
      mode: "Offline/Local Storage",
      details: reasonDetails,
      error: errMsg ? errMsg.substring(0, 300) : "Connection timeout / Network unreachable"
    });
  }
});

// API: Get Items List
app.get("/api/items", async (req, res) => {
  const db = await getMongoDb();
  if (db) {
    try {
      const items = await db.collection("items").find({}).toArray();
      return res.json(items);
    } catch (err) {
      console.error("Failed to query items from Atlas:", err);
    }
  }
  res.json(readLocalData("items"));
});

// API: Expense Categories Management
app.get("/api/expense-categories", async (req, res) => {
  const db = await getMongoDb();
  let expenseCats: any[] = [];
  
  if (db) {
    try {
      expenseCats = await db.collection("expense_categories").find({}).toArray();
      const expenses = await db.collection("expenses").find({}).project({ category: 1 }).toArray();
      const activeCats = Array.from(new Set(expenses.map((e: any) => e.category))).filter(Boolean);
      
      activeCats.forEach(ac => {
        if (!expenseCats.some(c => c.name === ac)) {
          expenseCats.push({ name: ac });
          db.collection("expense_categories").insertOne({ name: ac }).catch(() => {});
        }
      });
      return res.json(expenseCats);
    } catch (err) {
      console.error("Failed to query expense categories from Atlas:", err);
    }
  }
  
  // Local Fallback
  expenseCats = readLocalData("expense_categories") || [];
  const localExpenses = readLocalData("expenses") || [];
  const localActiveCats = Array.from(new Set(localExpenses.map((e: any) => e.category))).filter(Boolean);
  
  let localChanged = false;
  localActiveCats.forEach(ac => {
    if (!expenseCats.some(c => c.name === ac)) {
      expenseCats.push({ name: ac });
      localChanged = true;
    }
  });
  
  if (localChanged) {
    writeLocalData("expense_categories", expenseCats);
  }
  
  res.json(expenseCats);
});

app.post("/api/expense-categories", async (req, res) => {
  const { name } = req.body;
  const newCat = { name };
  const db = await getMongoDb();

  if (db) {
    try {
      const existing = await db.collection("expense_categories").findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!existing) {
        await db.collection("expense_categories").insertOne(newCat);
        const allCats = await db.collection("expense_categories").find({}).toArray();
        writeLocalData("expense_categories", allCats);
      }
      return res.json({ success: true, category: newCat });
    } catch (err) {
      console.error("Failed to add expense category to Atlas:", err);
    }
  }

  const localCats = readLocalData("expense_categories") || [];
  if (!localCats.some((c: any) => c.name.toLowerCase() === name.toLowerCase())) {
    localCats.push(newCat);
    writeLocalData("expense_categories", localCats);
  }
  res.json({ success: true, mode: "local", category: newCat });
});

app.delete("/api/expense-categories/:name", async (req, res) => {
  const name = req.params.name;
  const db = await getMongoDb();
  
  // Usage validation check
  if (db) {
    const isUsed = await db.collection("expenses").findOne({ category: name });
    if (isUsed) {
      return res.status(400).json({ error: "Cannot delete this expense category because it is used in historic expense vouchers." });
    }
  } else {
    const localExpenses = readLocalData("expenses") || [];
    const isUsed = localExpenses.some((e: any) => e.category === name);
    if (isUsed) {
      return res.status(400).json({ error: "Cannot delete this expense category because it is used in historic expense vouchers." });
    }
  }

  if (db) {
    try {
      await db.collection("expense_categories").deleteOne({ name });
      const allCats = await db.collection("expense_categories").find({}).toArray();
      writeLocalData("expense_categories", allCats);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete expense category from Atlas:", err);
    }
  }

  let localCats = readLocalData("expense_categories") || [];
  localCats = localCats.filter((c: any) => c.name !== name);
  writeLocalData("expense_categories", localCats);
  res.json({ success: true, mode: "local" });
});

// API: Set/Update Items list (for stock updates/adjustments/creation)
app.post("/api/items", async (req, res) => {
  const items = req.body;
  const db = await getMongoDb();

  if (db) {
    try {
      // Direct replace or transactional overwrite for simplicity
      await db.collection("items").deleteMany({});
      await db.collection("items").insertMany(items);
      writeLocalData("items", items); // also save local copy for fallback consistency
      return res.json({ success: true, count: items.length });
    } catch (err) {
      console.error("Failed to write items to Atlas:", err);
    }
  }

  writeLocalData("items", items);
  res.json({ success: true, mode: "local", count: items.length });
});

// API: Categories Management
app.get("/api/categories", async (req, res) => {
  const db = await getMongoDb();
  if (db) {
    try {
      const categories = await db.collection("categories").find({}).toArray();
      return res.json(categories);
    } catch (err) {
      console.error("Failed to query categories from Atlas:", err);
    }
  }
  res.json(readLocalData("categories"));
});

app.post("/api/categories", async (req, res) => {
  const { name } = req.body;
  const newCat = { name };
  const db = await getMongoDb();

  if (db) {
    try {
      await db.collection("categories").insertOne(newCat);
      const allCats = await db.collection("categories").find({}).toArray();
      writeLocalData("categories", allCats);
      return res.json({ success: true, category: newCat });
    } catch (err) {
      console.error("Failed to add category to Atlas:", err);
    }
  }
  
  const localCats = readLocalData("categories") || [];
  localCats.push(newCat);
  writeLocalData("categories", localCats);
  res.json({ success: true, mode: "local", category: newCat });
});

app.put("/api/categories/:old_name", async (req, res) => {
  const old_name = req.params.old_name;
  const { name: new_name } = req.body;
  const db = await getMongoDb();

  if (db) {
    try {
      await db.collection("categories").updateOne({ name: old_name }, { $set: { name: new_name } });
      // Update all items that used this category
      await db.collection("items").updateMany({ category: old_name }, { $set: { category: new_name } });
      
      const allCats = await db.collection("categories").find({}).toArray();
      const allItems = await db.collection("items").find({}).toArray();
      writeLocalData("categories", allCats);
      writeLocalData("items", allItems);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to rename category in Atlas:", err);
    }
  }
  
  let localCats = readLocalData("categories") || [];
  localCats = localCats.map((c: any) => c.name === old_name ? { name: new_name } : c);
  writeLocalData("categories", localCats);
  
  let localItems = readLocalData("items") || [];
  localItems = localItems.map((i: any) => i.category === old_name ? { ...i, category: new_name } : i);
  writeLocalData("items", localItems);
  
  res.json({ success: true, mode: "local" });
});

app.delete("/api/categories/:name", async (req, res) => {
  const { name } = req.params;
  const db = await getMongoDb();

  if (db) {
    try {
      // Deletion prevention logic should ideally happen on the frontend, but we delete unconditionally here.
      // Assuming frontend handles checks.
      await db.collection("categories").deleteOne({ name });
      const allCats = await db.collection("categories").find({}).toArray();
      writeLocalData("categories", allCats);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete category in Atlas:", err);
    }
  }

  let localCats = readLocalData("categories") || [];
  localCats = localCats.filter((c: any) => c.name !== name);
  writeLocalData("categories", localCats);
  res.json({ success: true, mode: "local" });
});

// API: Customers Management
app.get("/api/customers", async (req, res) => {
  const db = await getMongoDb();
  let customers: any[] = [];
  
  if (db) {
    try {
      customers = await db.collection("customers").find({}).toArray();
      // Dynamically merge from historic sales
      const sales = await db.collection("sales").find({}).project({ customer_name: 1 }).toArray();
      const saleCusts = Array.from(new Set(sales.map((s: any) => s.customer_name))).filter(Boolean);
      
      saleCusts.forEach(sc => {
        if (!customers.some(c => c.name === sc)) {
          customers.push({ name: sc });
          // Background insert for future speed
          db.collection("customers").insertOne({ name: sc }).catch(() => {});
        }
      });
      return res.json(customers);
    } catch (err) {
      console.error("Failed to query customers from Atlas:", err);
    }
  }
  
  // Local Fallback
  customers = readLocalData("customers") || [];
  const localSales = readLocalData("sales") || [];
  const localSaleCusts = Array.from(new Set(localSales.map((s: any) => s.customer_name))).filter(Boolean);
  
  let localChanged = false;
  localSaleCusts.forEach(sc => {
    if (!customers.some(c => c.name === sc)) {
      customers.push({ name: sc });
      localChanged = true;
    }
  });
  
  if (localChanged) {
    writeLocalData("customers", customers);
  }
  
  res.json(customers);
});

app.post("/api/customers", async (req, res) => {
  const { name } = req.body;
  const newCust = { name };
  const db = await getMongoDb();

  if (db) {
    try {
      // Prevent duplicates by checking first (acts like an upsert)
      const existing = await db.collection("customers").findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!existing) {
        await db.collection("customers").insertOne(newCust);
        const allCusts = await db.collection("customers").find({}).toArray();
        writeLocalData("customers", allCusts);
      }
      return res.json({ success: true, customer: newCust });
    } catch (err) {
      console.error("Failed to add customer to Atlas:", err);
    }
  }
  
  const localCusts = readLocalData("customers") || [];
  if (!localCusts.some((c: any) => c.name.toLowerCase() === name.toLowerCase())) {
    localCusts.push(newCust);
    writeLocalData("customers", localCusts);
  }
  res.json({ success: true, mode: "local", customer: newCust });
});

// API: Suppliers Management
app.get("/api/suppliers", async (req, res) => {
  const db = await getMongoDb();
  let suppliers: any[] = [];
  
  if (db) {
    try {
      suppliers = await db.collection("suppliers").find({}).toArray();
      // Dynamically merge from historic inwards
      const inwards = await db.collection("inwards").find({}).project({ supplier_name: 1 }).toArray();
      const inwSupps = Array.from(new Set(inwards.map((i: any) => i.supplier_name))).filter(Boolean);
      
      inwSupps.forEach(is => {
        if (!suppliers.some(s => s.name === is)) {
          suppliers.push({ name: is });
          // Background insert for future speed
          db.collection("suppliers").insertOne({ name: is }).catch(() => {});
        }
      });
      return res.json(suppliers);
    } catch (err) {
      console.error("Failed to query suppliers from Atlas:", err);
    }
  }
  
  // Local Fallback
  suppliers = readLocalData("suppliers") || [];
  const localInwards = readLocalData("inwards") || [];
  const localInwSupps = Array.from(new Set(localInwards.map((i: any) => i.supplier_name))).filter(Boolean);
  
  let localChanged = false;
  localInwSupps.forEach(is => {
    if (!suppliers.some(s => s.name === is)) {
      suppliers.push({ name: is });
      localChanged = true;
    }
  });
  
  if (localChanged) {
    writeLocalData("suppliers", suppliers);
  }
  
  res.json(suppliers);
});

app.post("/api/suppliers", async (req, res) => {
  const { name } = req.body;
  const newSupp = { name };
  const db = await getMongoDb();

  if (db) {
    try {
      // Prevent duplicates
      const existing = await db.collection("suppliers").findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!existing) {
        await db.collection("suppliers").insertOne(newSupp);
        const allSupps = await db.collection("suppliers").find({}).toArray();
        writeLocalData("suppliers", allSupps);
      }
      return res.json({ success: true, supplier: newSupp });
    } catch (err) {
      console.error("Failed to add supplier to Atlas:", err);
    }
  }
  
  const localSupps = readLocalData("suppliers") || [];
  if (!localSupps.some((s: any) => s.name.toLowerCase() === name.toLowerCase())) {
    localSupps.push(newSupp);
    writeLocalData("suppliers", localSupps);
  }
  res.json({ success: true, mode: "local", supplier: newSupp });
});

app.put("/api/items/:old_item_id", async (req, res) => {
  const { old_item_id } = req.params;
  const newItem = req.body;
  const new_item_id = newItem.item_id;

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection("items").updateOne(
        { item_id: old_item_id },
        { $set: newItem }
      );

      if (old_item_id !== new_item_id) {
        await db.collection("sales").updateMany(
          { "items.item_id": old_item_id },
          { $set: { "items.$[elem].item_id": new_item_id } },
          { arrayFilters: [{ "elem.item_id": old_item_id }] }
        );

        await db.collection("inwards").updateMany(
          { "items_received.item_id": old_item_id },
          { $set: { "items_received.$[elem].item_id": new_item_id } },
          { arrayFilters: [{ "elem.item_id": old_item_id }] }
        );
      }

      const localItems = readLocalData("items").map((i: any) => i.item_id === old_item_id ? newItem : i);
      writeLocalData("items", localItems);

      if (old_item_id !== new_item_id) {
        const localSales = readLocalData("sales");
        let salesChanged = false;
        localSales.forEach((s: any) => {
          if (s.items) {
            s.items.forEach((item: any) => {
              if (item.item_id === old_item_id) {
                item.item_id = new_item_id;
                salesChanged = true;
              }
            });
          }
        });
        if (salesChanged) writeLocalData("sales", localSales);

        const localInwards = readLocalData("inwards");
        let inwardsChanged = false;
        localInwards.forEach((inw: any) => {
          if (inw.items_received) {
            inw.items_received.forEach((item: any) => {
              if (item.item_id === old_item_id) {
                item.item_id = new_item_id;
                inwardsChanged = true;
              }
            });
          }
        });
        if (inwardsChanged) writeLocalData("inwards", localInwards);
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to update item in Atlas:", err);
      return res.status(500).json({ error: "Failed to update item in database" });
    }
  }

  const localItems = readLocalData("items").map((i: any) => i.item_id === old_item_id ? newItem : i);
  writeLocalData("items", localItems);

  if (old_item_id !== new_item_id) {
    const localSales = readLocalData("sales");
    let salesChanged = false;
    localSales.forEach((s: any) => {
      if (s.items) {
        s.items.forEach((item: any) => {
          if (item.item_id === old_item_id) {
            item.item_id = new_item_id;
            salesChanged = true;
          }
        });
      }
    });
    if (salesChanged) writeLocalData("sales", localSales);

    const localInwards = readLocalData("inwards");
    let inwardsChanged = false;
    localInwards.forEach((inw: any) => {
      if (inw.items_received) {
        inw.items_received.forEach((item: any) => {
          if (item.item_id === old_item_id) {
            item.item_id = new_item_id;
            inwardsChanged = true;
          }
        });
      }
    });
    if (inwardsChanged) writeLocalData("inwards", localInwards);
  }

  res.json({ success: true, mode: "local" });
});

// API: Get Sales Ledger
app.get("/api/sales", async (req, res) => {
  const db = await getMongoDb();
  if (db) {
    try {
      const sales = await db.collection("sales").find({}).sort({ date: -1 }).toArray();
      return res.json(sales);
    } catch (err) {
      console.error("Failed to query sales ledger from Atlas:", err);
    }
  }
  res.json(readLocalData("sales"));
});

// API: Post Sales Transaction
app.post("/api/sales", async (req, res) => {
  const sale = req.body;
  const db = await getMongoDb();

  if (db) {
    try {
      // Append sale transaction
      await db.collection("sales").insertOne(sale);

      // Decrement inventory stock on sold items
      for (const soldItem of sale.items_sold) {
        await db.collection("items").updateOne(
          { item_id: soldItem.item_id },
          { $inc: { current_stock_qty: -soldItem.qty_sold } }
        );
      }

      // Sync local files for backup
      const localSales = readLocalData("sales");
      localSales.unshift(sale);
      writeLocalData("sales", localSales);

      const localItems = readLocalData("items").map((itm: any) => {
        const matchingSold = sale.items_sold.find((si: any) => si.item_id === itm.item_id);
        if (matchingSold) {
          return { ...itm, current_stock_qty: itm.current_stock_qty - matchingSold.qty_sold };
        }
        return itm;
      });
      writeLocalData("items", localItems);

      return res.json({ success: true, source: "mongodb" });
    } catch (err) {
      console.error("Failed to insert sales invoice in Atlas:", err);
    }
  }

  // Fallback local update
  const localSales = readLocalData("sales");
  localSales.unshift(sale);
  writeLocalData("sales", localSales);

  const localItems = readLocalData("items").map((itm: any) => {
    const matchingSold = sale.items_sold.find((si: any) => si.item_id === itm.item_id);
    if (matchingSold) {
      return { ...itm, current_stock_qty: itm.current_stock_qty - matchingSold.qty_sold };
    }
    return itm;
  });
  writeLocalData("items", localItems);

  res.json({ success: true, mode: "local" });
});

// API: Record credit collections (received payments updates)
app.post("/api/sales/payment", async (req, res) => {
  const { sale_id, payment_received } = req.body;
  const amount = Number(payment_received) || 0;
  const db = await getMongoDb();

  if (db) {
    try {
      await db.collection("sales").updateOne(
        { sale_id: sale_id },
        { $set: { payment_received: amount } }
      );
      
      const localSales = readLocalData("sales").map((s: any) => {
        if (s.sale_id === sale_id) {
          return { ...s, payment_received: amount };
        }
        return s;
      });
      writeLocalData("sales", localSales);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to register settlement in Atlas:", err);
    }
  }

  const localSales = readLocalData("sales").map((s: any) => {
    if (s.sale_id === sale_id) {
      return { ...s, payment_received: amount };
    }
    return s;
  });
  writeLocalData("sales", localSales);
  res.json({ success: true, mode: "local" });
});

// API: Get Expenses List
app.get("/api/expenses", async (req, res) => {
  const db = await getMongoDb();
  if (db) {
    try {
      const expenses = await db.collection("expenses").find({}).sort({ date: -1 }).toArray();
      return res.json(expenses);
    } catch (err) {
      console.error("Failed to query expenses from Atlas:", err);
    }
  }
  res.json(readLocalData("expenses"));
});

// API: Post Operating Expense
app.post("/api/expenses", async (req, res) => {
  const expense = req.body;
  const db = await getMongoDb();

  if (db) {
    try {
      await db.collection("expenses").insertOne(expense);
      const localExpenses = readLocalData("expenses");
      localExpenses.unshift(expense);
      writeLocalData("expenses", localExpenses);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to log expense in Atlas:", err);
    }
  }

  const localExpenses = readLocalData("expenses");
  localExpenses.unshift(expense);
  writeLocalData("expenses", localExpenses);
  res.json({ success: true, mode: "local" });
});

// API: Restock/Inward stock shipment logs (increases current stock)
app.post("/api/items/restock", async (req, res) => {
  const { item_id, qty_to_add } = req.body;
  const qty = Number(qty_to_add) || 0;
  const db = await getMongoDb();

  if (db) {
    try {
      await db.collection("items").updateOne(
        { item_id: item_id },
        { $inc: { current_stock_qty: qty } }
      );
      const localItems = readLocalData("items").map((itm: any) => {
        if (itm.item_id === item_id) {
          return { ...itm, current_stock_qty: itm.current_stock_qty + qty };
        }
        return itm;
      });
      writeLocalData("items", localItems);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to increment stock in Atlas:", err);
    }
  }

  const localItems = readLocalData("items").map((itm: any) => {
    if (itm.item_id === item_id) {
      return { ...itm, current_stock_qty: itm.current_stock_qty + qty };
    }
    return itm;
  });
  writeLocalData("items", localItems);
  res.json({ success: true, mode: "local" });
});

// API: Get Inwards (Purchases) list
app.get("/api/inwards", async (req, res) => {
  const db = await getMongoDb();
  if (db) {
    try {
      const inwards = await db.collection("inwards").find({}).sort({ date: -1 }).toArray();
      return res.json(inwards);
    } catch (err) {
      console.error("Failed to query inwards from Atlas:", err);
    }
  }
  res.json(readLocalData("inwards"));
});

// API: Post Inward Purchase Voucher
app.post("/api/inwards", async (req, res) => {
  const inward = req.body;
  const db = await getMongoDb();

  if (db) {
    try {
      // Save inward
      await db.collection("inwards").insertOne(inward);

      // Increment inventory stock & update purchase price for each inward item
      for (const invItem of inward.items_received) {
        await db.collection("items").updateOne(
          { item_id: invItem.item_id },
          { 
            $inc: { current_stock_qty: invItem.qty_added },
            $set: { purchase_price: invItem.purchase_price_at_time }
          }
        );
      }

      // Sync local files
      const localInwards = readLocalData("inwards");
      localInwards.unshift(inward);
      writeLocalData("inwards", localInwards);

      const localItems = readLocalData("items").map((itm: any) => {
        const matchingAdded = inward.items_received.find((ii: any) => ii.item_id === itm.item_id);
        if (matchingAdded) {
          return { 
            ...itm, 
            current_stock_qty: itm.current_stock_qty + matchingAdded.qty_added,
            purchase_price: matchingAdded.purchase_price_at_time
          };
        }
        return itm;
      });
      writeLocalData("items", localItems);

      return res.json({ success: true, source: "mongodb" });
    } catch (err) {
      console.error("Failed to record inward in Atlas:", err);
    }
  }

  // Fallback local update
  const localInwards = readLocalData("inwards");
  localInwards.unshift(inward);
  writeLocalData("inwards", localInwards);

  const localItems = readLocalData("items").map((itm: any) => {
    const matchingAdded = inward.items_received.find((ii: any) => ii.item_id === itm.item_id);
    if (matchingAdded) {
      return { 
        ...itm, 
        current_stock_qty: itm.current_stock_qty + matchingAdded.qty_added,
        purchase_price: matchingAdded.purchase_price_at_time
      };
    }
    return itm;
  });
  writeLocalData("items", localItems);

  res.json({ success: true, mode: "local" });
});

// API: Delete Sale Voucher (Reverts sold stock back to inventory)
app.delete("/api/sales/:sale_id", async (req, res) => {
  const { sale_id } = req.params;
  const db = await getMongoDb();

  // Find the sale voucher to identify sold item quantities to put back in stock
  let targetSale: any = null;
  if (db) {
    try {
      targetSale = await db.collection("sales").findOne({ sale_id: sale_id });
    } catch (err) {
      console.error("Failed to lookup sale in Atlas:", err);
    }
  }
  if (!targetSale) {
    const localSales = readLocalData("sales");
    targetSale = localSales.find((s: any) => s.sale_id === sale_id);
  }

  if (!targetSale) {
    return res.status(404).json({ success: false, error: "Sale voucher not found." });
  }

  // Restore inventory items
  if (db) {
    try {
      await db.collection("sales").deleteOne({ sale_id: sale_id });

      for (const soldItem of targetSale.items_sold) {
        await db.collection("items").updateOne(
          { item_id: soldItem.item_id },
          { $inc: { current_stock_qty: soldItem.qty_sold } }
        );
      }

      // Sync local
      const localSales = readLocalData("sales").filter((s: any) => s.sale_id !== sale_id);
      writeLocalData("sales", localSales);

      const localItems = readLocalData("items").map((itm: any) => {
        const matchingSold = targetSale.items_sold.find((si: any) => si.item_id === itm.item_id);
        if (matchingSold) {
          return { ...itm, current_stock_qty: itm.current_stock_qty + matchingSold.qty_sold };
        }
        return itm;
      });
      writeLocalData("items", localItems);

      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete sale from Atlas:", err);
    }
  }

  // Fallback local
  const localSales = readLocalData("sales").filter((s: any) => s.sale_id !== sale_id);
  writeLocalData("sales", localSales);

  const localItems = readLocalData("items").map((itm: any) => {
    const matchingSold = targetSale.items_sold.find((si: any) => si.item_id === itm.item_id);
    if (matchingSold) {
      return { ...itm, current_stock_qty: itm.current_stock_qty + matchingSold.qty_sold };
    }
    return itm;
  });
  writeLocalData("items", localItems);

  res.json({ success: true, mode: "local" });
});

// API: Delete Expense Voucher
app.delete("/api/expenses/:expense_id", async (req, res) => {
  const { expense_id } = req.params;
  const db = await getMongoDb();

  if (db) {
    try {
      await db.collection("expenses").deleteOne({ expense_id: expense_id });
      const localExpenses = readLocalData("expenses").filter((e: any) => e.expense_id !== expense_id);
      writeLocalData("expenses", localExpenses);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete expense from Atlas:", err);
    }
  }

  const localExpenses = readLocalData("expenses").filter((e: any) => e.expense_id !== expense_id);
  writeLocalData("expenses", localExpenses);
  res.json({ success: true, mode: "local" });
});

// API: Delete Inward Purchase Voucher
app.delete("/api/inwards/:inward_id", async (req, res) => {
  const { inward_id } = req.params;
  const db = await getMongoDb();

  let targetInward: any = null;
  if (db) {
    try {
      targetInward = await db.collection("inwards").findOne({ inward_id: inward_id });
    } catch (err) {
      console.error("Failed to lookup inward in Atlas:", err);
    }
  }
  if (!targetInward) {
    const localInwards = readLocalData("inwards");
    targetInward = localInwards.find((i: any) => i.inward_id === inward_id);
  }

  if (!targetInward) {
    return res.status(404).json({ success: false, error: "Inward voucher not found." });
  }

  if (db) {
    try {
      await db.collection("inwards").deleteOne({ inward_id: inward_id });

      for (const itemRec of targetInward.items_received) {
        await db.collection("items").updateOne(
          { item_id: itemRec.item_id },
          { $inc: { current_stock_qty: -itemRec.qty_added } }
        );
      }

      const localInwards = readLocalData("inwards").filter((i: any) => i.inward_id !== inward_id);
      writeLocalData("inwards", localInwards);

      const localItems = readLocalData("items").map((itm: any) => {
        const matchingRec = targetInward.items_received.find((r: any) => r.item_id === itm.item_id);
        if (matchingRec) {
          return { ...itm, current_stock_qty: Math.max(0, itm.current_stock_qty - matchingRec.qty_added) };
        }
        return itm;
      });
      writeLocalData("items", localItems);

      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete inward from Atlas:", err);
    }
  }

  const localInwards = readLocalData("inwards").filter((i: any) => i.inward_id !== inward_id);
  writeLocalData("inwards", localInwards);

  const localItems = readLocalData("items").map((itm: any) => {
    const matchingRec = targetInward.items_received.find((r: any) => r.item_id === itm.item_id);
    if (matchingRec) {
      return { ...itm, current_stock_qty: Math.max(0, itm.current_stock_qty - matchingRec.qty_added) };
    }
    return itm;
  });
  writeLocalData("items", localItems);

  res.json({ success: true, mode: "local" });
});

// API: Edit Expense Voucher
app.put("/api/expenses/:expense_id", async (req, res) => {
  const { expense_id } = req.params;
  const updatedExpense = req.body;
  const db = await getMongoDb();

  if (db) {
    try {
      await db.collection("expenses").updateOne(
        { expense_id: expense_id },
        { $set: {
          date: updatedExpense.date,
          category: updatedExpense.category,
          amount: updatedExpense.amount,
          remarks: updatedExpense.remarks
        }}
      );
      const localExpenses = readLocalData("expenses").map((e: any) =>
        e.expense_id === expense_id ? { ...e, ...updatedExpense } : e
      );
      writeLocalData("expenses", localExpenses);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to update expense in Atlas:", err);
    }
  }

  const localExpenses = readLocalData("expenses").map((e: any) =>
    e.expense_id === expense_id ? { ...e, ...updatedExpense } : e
  );
  writeLocalData("expenses", localExpenses);
  res.json({ success: true, mode: "local" });
});

// API: Edit Inward Purchase Voucher
app.put("/api/inwards/:inward_id", async (req, res) => {
  const { inward_id } = req.params;
  const updatedInward = req.body;
  const db = await getMongoDb();

  let oldInward: any = null;
  if (db) {
    try {
      oldInward = await db.collection("inwards").findOne({ inward_id: inward_id });
    } catch (err) {
      console.error("Failed to lookup inward in Atlas:", err);
    }
  }
  if (!oldInward) {
    const localInwards = readLocalData("inwards");
    oldInward = localInwards.find((i: any) => i.inward_id === inward_id);
  }

  if (!oldInward) {
    return res.status(404).json({ success: false, error: "Inward voucher not found." });
  }

  if (db) {
    try {
      await db.collection("inwards").updateOne(
        { inward_id: inward_id },
        { $set: {
          date: updatedInward.date,
          supplier_name: updatedInward.supplier_name,
          items_received: updatedInward.items_received,
          total_invoice_cost: updatedInward.total_invoice_cost
        }}
      );

      for (const oldItem of oldInward.items_received) {
        await db.collection("items").updateOne(
          { item_id: oldItem.item_id },
          { $inc: { current_stock_qty: -oldItem.qty_added } }
        );
      }

      for (const newItem of updatedInward.items_received) {
        await db.collection("items").updateOne(
          { item_id: newItem.item_id },
          { $inc: { current_stock_qty: newItem.qty_added } }
        );
      }

      const localInwards = readLocalData("inwards").map((i: any) =>
        i.inward_id === inward_id ? { ...i, ...updatedInward } : i
      );
      writeLocalData("inwards", localInwards);

      const localItems = readLocalData("items").map((itm: any) => {
        let qty = itm.current_stock_qty;
        const oldRec = oldInward.items_received.find((r: any) => r.item_id === itm.item_id);
        const newRec = updatedInward.items_received.find((r: any) => r.item_id === itm.item_id);
        if (oldRec) qty -= oldRec.qty_added;
        if (newRec) qty += newRec.qty_added;
        return { ...itm, current_stock_qty: Math.max(0, qty) };
      });
      writeLocalData("items", localItems);

      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to update inward in Atlas:", err);
    }
  }

  const localInwards = readLocalData("inwards").map((i: any) =>
    i.inward_id === inward_id ? { ...i, ...updatedInward } : i
  );
  writeLocalData("inwards", localInwards);

  const localItems = readLocalData("items").map((itm: any) => {
    let qty = itm.current_stock_qty;
    const oldRec = oldInward.items_received.find((r: any) => r.item_id === itm.item_id);
    const newRec = updatedInward.items_received.find((r: any) => r.item_id === itm.item_id);
    if (oldRec) qty -= oldRec.qty_added;
    if (newRec) qty += newRec.qty_added;
    return { ...itm, current_stock_qty: Math.max(0, qty) };
  });
  writeLocalData("items", localItems);

  res.json({ success: true, mode: "local" });
});

// API: Edit Sale Voucher (Adjusts sold stock differences)
app.put("/api/sales/:sale_id", async (req, res) => {
  const { sale_id } = req.params;
  const updatedSale = req.body;
  const db = await getMongoDb();

  // Find previous sale voucher to figure out inventory differences
  let oldSale: any = null;
  if (db) {
    try {
      oldSale = await db.collection("sales").findOne({ sale_id: sale_id });
    } catch (err) {
      console.error("Failed to find previous sale in Atlas:", err);
    }
  }
  if (!oldSale) {
    const localSales = readLocalData("sales");
    oldSale = localSales.find((s: any) => s.sale_id === sale_id);
  }

  if (!oldSale) {
    return res.status(404).json({ success: false, error: "Previous sale voucher not found." });
  }

  // Adjust stock levels based on difference between old sale and updated sale
  const stockChanges: Record<string, number> = {}; // item_id -> delta (positive means putting back, negative means drawing out)
  
  // Revert all old quantities (put them back temporarily)
  oldSale.items_sold.forEach((si: any) => {
    stockChanges[si.item_id] = (stockChanges[si.item_id] || 0) + si.qty_sold;
  });

  // Subtract all new quantities
  updatedSale.items_sold.forEach((si: any) => {
    stockChanges[si.item_id] = (stockChanges[si.item_id] || 0) - si.qty_sold;
  });

  if (db) {
    try {
      await db.collection("sales").replaceOne({ sale_id: sale_id }, updatedSale);

      for (const [itemId, qtyChange] of Object.entries(stockChanges)) {
        if (qtyChange !== 0) {
          await db.collection("items").updateOne(
            { item_id: itemId },
            { $inc: { current_stock_qty: qtyChange } }
          );
        }
      }

      // Sync local
      const localSales = readLocalData("sales").map((s: any) => s.sale_id === sale_id ? updatedSale : s);
      writeLocalData("sales", localSales);

      const localItems = readLocalData("items").map((itm: any) => {
        const change = stockChanges[itm.item_id];
        if (change) {
          return { ...itm, current_stock_qty: itm.current_stock_qty + change };
        }
        return itm;
      });
      writeLocalData("items", localItems);

      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to replace sale in Atlas:", err);
    }
  }

  // Fallback local
  const localSales = readLocalData("sales").map((s: any) => s.sale_id === sale_id ? updatedSale : s);
  writeLocalData("sales", localSales);

  const localItems = readLocalData("items").map((itm: any) => {
    const change = stockChanges[itm.item_id];
    if (change) {
      return { ...itm, current_stock_qty: itm.current_stock_qty + change };
    }
    return itm;
  });
  writeLocalData("items", localItems);

  res.json({ success: true, mode: "local" });
});

// API: Reset Database to Seed Parameters
app.post("/api/reset", async (req, res) => {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection("items").deleteMany({});
      await db.collection("expenses").deleteMany({});
      await db.collection("sales").deleteMany({});

      await db.collection("items").insertMany(SEED_ITEMS);
      await db.collection("expenses").insertMany(SEED_EXPENSES);
      await db.collection("sales").insertMany(SEED_SALES);
    } catch (err) {
      console.error("Failed to perform complete Atlas reset:", err);
    }
  }

  writeLocalData("items", SEED_ITEMS);
  writeLocalData("expenses", SEED_EXPENSES);
  writeLocalData("sales", SEED_SALES);

  res.json({ success: true, message: "System datasets reset to default seed parameters." });
});

// Delete Product
app.delete("/api/items/:item_id", async (req, res) => {
  const { item_id } = req.params;
  const db = await getMongoDb();
  
  if (db) {
    const saleMatch = await db.collection("sales").findOne({ "items.item_id": item_id });
    const inwardMatch = await db.collection("inwards").findOne({ "items_received.item_id": item_id });
    
    if (saleMatch || inwardMatch) {
      return res.status(400).json({ error: "Cannot delete this Product because it is used in essential invoice databases (Sales or Inwards)." });
    }
    
    await db.collection("items").deleteOne({ item_id });
  }
  
  const localSales = readLocalData("sales");
  const localInwards = readLocalData("inwards");
  
  const usedInLocalSales = localSales.some((s: any) => s.items && s.items.some((i: any) => i.item_id === item_id));
  const usedInLocalInwards = localInwards.some((i: any) => i.items_received && i.items_received.some((it: any) => it.item_id === item_id));
  
  if (usedInLocalSales || usedInLocalInwards) {
    return res.status(400).json({ error: "Cannot delete this Product because it is used in essential invoice databases (Sales or Inwards)." });
  }

  const items = readLocalData("items");
  const newItems = items.filter((i: any) => i.item_id !== item_id);
  writeLocalData("items", newItems);
  
  res.json({ success: true, message: "Item deleted successfully" });
});

// Delete Customer
app.delete("/api/customers/:name", async (req, res) => {
  const { name } = req.params;
  const db = await getMongoDb();
  
  if (db) {
    const saleMatch = await db.collection("sales").findOne({ customer_name: name });
    if (saleMatch) {
      return res.status(400).json({ error: "Cannot delete this Customer because they are used in essential invoice databases (Sales)." });
    }
    await db.collection("customers").deleteOne({ name });
  }
  
  const localSales = readLocalData("sales");
  const usedInLocalSales = localSales.some((s: any) => s.customer_name === name);
  if (usedInLocalSales) {
    return res.status(400).json({ error: "Cannot delete this Customer because they are used in essential invoice databases (Sales)." });
  }
  
  const customers = readLocalData("customers");
  const newCustomers = customers.filter((c: any) => c.name !== name);
  writeLocalData("customers", newCustomers);
  
  res.json({ success: true, message: "Customer deleted successfully" });
});

// Delete Supplier
app.delete("/api/suppliers/:name", async (req, res) => {
  const { name } = req.params;
  const db = await getMongoDb();
  
  if (db) {
    const inwardMatch = await db.collection("inwards").findOne({ supplier_name: name });
    if (inwardMatch) {
      return res.status(400).json({ error: "Cannot delete this Supplier because they are used in essential invoice databases (Inwards)." });
    }
    await db.collection("suppliers").deleteOne({ name });
  }
  
  const localInwards = readLocalData("inwards");
  const usedInLocalInwards = localInwards.some((i: any) => i.supplier_name === name);
  if (usedInLocalInwards) {
    return res.status(400).json({ error: "Cannot delete this Supplier because they are used in essential invoice databases (Inwards)." });
  }
  
  const suppliers = readLocalData("suppliers");
  const newSuppliers = suppliers.filter((s: any) => s.name !== name);
  writeLocalData("suppliers", newSuppliers);
  
  res.json({ success: true, message: "Supplier deleted successfully" });
});

// CUSTOMER ORDERS ROUTES
app.get("/api/customer-orders", async (req, res) => {
  const db = await getMongoDb();
  if (db) {
    try {
      const orders = await db.collection("customer_orders").find({}).toArray();
      res.json(orders);
      return;
    } catch (e) {
      console.error("MongoDB read error for customer_orders, falling back to local file", e);
    }
  }
  res.json(readLocalData("customer_orders"));
});

app.post("/api/customer-orders", async (req, res) => {
  const newOrder = req.body;
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection("customer_orders").insertOne(newOrder);
      const orders = await db.collection("customer_orders").find({}).toArray();
      res.json(orders);
      return;
    } catch (e) {
      console.error("MongoDB write error for customer_orders", e);
    }
  }
  const orders = readLocalData("customer_orders");
  orders.push(newOrder);
  writeLocalData("customer_orders", orders);
  res.json(orders);
});

app.put("/api/customer-orders/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection("customer_orders").updateOne({ order_id: id }, { $set: updatedData });
      const orders = await db.collection("customer_orders").find({}).toArray();
      res.json(orders);
      return;
    } catch (e) {
      console.error("MongoDB update error for customer_orders", e);
    }
  }
  const orders = readLocalData("customer_orders");
  const updatedOrders = orders.map((o: any) => o.order_id === id ? { ...o, ...updatedData } : o);
  writeLocalData("customer_orders", updatedOrders);
  res.json(updatedOrders);
});

app.delete("/api/customer-orders/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection("customer_orders").deleteOne({ order_id: id });
      const orders = await db.collection("customer_orders").find({}).toArray();
      res.json(orders);
      return;
    } catch (e) {
      console.error("MongoDB delete error for customer_orders", e);
    }
  }
  const orders = readLocalData("customer_orders");
  const filtered = orders.filter((o: any) => o.order_id !== id);
  writeLocalData("customer_orders", filtered);
  res.json(filtered);
});

// ----------------------------------------------------
// Special Offers Endpoints
// ----------------------------------------------------

app.get("/api/offers", async (req, res) => {
  const db = await getMongoDb();
  if (db) {
    try {
      const offers = await db.collection("offers").find({}).toArray();
      return res.json(offers);
    } catch (e) {
      console.error("Error fetching offers from Mongo", e);
    }
  }
  const localData = readLocalData("offers");
  res.json(localData);
});

app.post("/api/offers", async (req, res) => {
  const newOffer = req.body;
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection("offers").insertOne(newOffer);
      const offers = await db.collection("offers").find({}).toArray();
      return res.json(offers);
    } catch (e) {
      console.error("Error adding offer to Mongo", e);
    }
  }
  const offers = readLocalData("offers");
  offers.push(newOffer);
  writeLocalData("offers", offers);
  res.json(offers);
});

app.delete("/api/offers/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection("offers").deleteOne({ offer_id: id });
      const offers = await db.collection("offers").find({}).toArray();
      return res.json(offers);
    } catch (e) {
      console.error("Error deleting offer from Mongo", e);
    }
  }
  const offers = readLocalData("offers");
  const filtered = offers.filter((o: any) => o.offer_id !== id);
  writeLocalData("offers", filtered);
  res.json(filtered);
});

// Mount Vite middleware / Production build static assets
const isProd = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  if (!isProd) {
    import("vite").then(({ createServer }) => {
      createServer({
        server: { middlewareMode: true },
        appType: "spa",
      }).then((vite) => {
        app.use(vite.middlewares);
        
        // Fallback wildcard for local SPA rendering
        app.get("*", (req, res) => {
          const htmlPath = path.join(process.cwd(), "index.html");
          res.status(200).set({ "Content-Type": "text/html" }).send(fs.readFileSync(htmlPath, "utf8"));
        });

        app.listen(PORT, "0.0.0.0", () => {
          console.log(`Development Server running on http://localhost:${PORT}`);
        });
      });
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Production Server running on port ${PORT}`);
    });
  }
}

export default app;
