/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Item {
  item_id: string;
  name: string;
  category: string;
  purchase_price: number;
  selling_price_retail: number;
  selling_price_wholesale: number;
  current_stock_qty: number;
  min_stock_alert: number;
}

export interface SoldItem {
  item_id: string;
  name: string;
  qty_sold: number;
  unit_price: number;
  total_item_price: number;
}

export interface Sale {
  sale_id: string;
  date: string; // ISO String
  customer_name: string;
  customer_type: 'Retail' | 'Wholesale';
  items_sold: SoldItem[];
  gross_total: number;
  discount_given: number;
  net_amount_payable: number;
  payment_mode: string;
  payment_received?: number;
}

export interface InwardItem {
  item_id: string;
  qty_added: number;
  purchase_price_at_time: number;
}

export interface Inward {
  inward_id: string;
  date: string; // ISO String
  supplier_name: string;
  items_received: InwardItem[];
  total_invoice_cost: number;
}

export interface Expense {
  expense_id: string;
  date: string; // ISO String
  category: string;
  amount: number;
  remarks: string;
}

export interface CustomerOrderItem {
  item_id: string;
  name: string;
  qty: number;
}

export interface CustomerOrder {
  order_id: string;
  date: string; // ISO String
  customer_name: string;
  contact_number: string;
  items: CustomerOrderItem[];
  status: 'pending' | 'fulfilled' | 'cancelled';
}

export type WorkbenchTab = 'simulator' | 'rules' | 'models' | 'flutter_ui';
export type SimulatorView = 'login' | 'sales' | 'inward' | 'expense' | 'reports' | 'inventory' | 'analytics_reports';
export interface Offer {
  offer_id: string;
  text: string;
  created_at: string;
}
