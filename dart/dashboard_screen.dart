/// dashboard_screen.dart
///
/// Central Data Entry Terminal for Swamidatta Traders operators.
/// Contains the dynamic Sales Counter Form, Warehouse Inward restock form,
/// and the Expense Tracking form.
/// Integrates atomic Cloud Firestore transaction batches to guarantee correct
/// stock increment/decrement math during transactions.

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'item.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Catalog loaded from Firestore for dropdowns
  List<Item> _catalog = [];
  bool _isLoadingCatalog = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _listenToCatalog();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _listenToCatalog() {
    _firestore.collection('items').snapshots().listen((snapshot) {
      if (!mounted) return;
      setState(() {
        _catalog = snapshot.docs.map((doc) => Item.fromMap(doc.data())).toList();
        _isLoadingCatalog = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Swamidatta Operators Terminal'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.point_of_sale_rounded), text: 'Sales Counter'),
            Tab(icon: Icon(Icons.warehouse_rounded), text: 'Warehouse Inward'),
            Tab(icon: Icon(Icons.payment_rounded), text: 'Log Expense'),
          ],
        ),
      ),
      body: _isLoadingCatalog
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _SalesCounterView(catalog: _catalog, firestore: _firestore),
                _WarehouseInwardView(catalog: _catalog, firestore: _firestore),
                _ExpenseTrackerView(firestore: _firestore),
              ],
            ),
    );
  }
}

// ==========================================
// 1. SALES COUNTER COMPONENT
// ==========================================
class _SalesCounterView extends StatefulWidget {
  final List<Item> catalog;
  final FirebaseFirestore firestore;

  const _SalesCounterView({required this.catalog, required this.firestore});

  @override
  State<_SalesCounterView> createState() => _SalesCounterViewState();
}

class _SalesCounterViewState extends State<_SalesCounterView> {
  final _formKey = GlobalKey<FormState>();
  final _customerNameController = TextEditingController(text: 'Walk-in Customer');
  final _discountController = TextEditingController(text: '0.00');
  
  String _customerType = 'Retail'; // 'Retail' or 'Wholesale'
  String _paymentMode = 'Cash'; // 'Cash', 'UPI', 'Credit'

  // Current items being added to invoice
  final List<Map<String, dynamic>> _salesCart = []; // {item_id, name, qty_sold, unit_price, total_item_price}
  
  Item? _selectedItem;
  final _qtyController = TextEditingController(text: '1');

  double get _grossTotal => _salesCart.fold(0.0, (sum, elem) => sum + (elem['total_item_price'] as double));
  double get _discount => double.tryParse(_discountController.text) ?? 0.0;
  double get _netPayable => (_grossTotal - _discount) < 0 ? 0.0 : (_grossTotal - _discount);

  void _addItemToCart() {
    if (_selectedItem == null) return;
    final qty = int.tryParse(_qtyController.text) ?? 1;
    if (qty <= 0) return;

    // Determine pricing tier (wholesale vs retail)
    final price = _customerType == 'Wholesale'
        ? _selectedItem!.sellingPriceWholesale
        : _selectedItem!.sellingPriceRetail;

    setState(() {
      // Check if item already exists in cart, update qty instead of duplicates
      final existingIndex = _salesCart.indexWhere((e) => e['item_id'] == _selectedItem!.itemId);
      if (existingIndex >= 0) {
        final newQty = _salesCart[existingIndex]['qty_sold'] + qty;
        _salesCart[existingIndex]['qty_sold'] = newQty;
        _salesCart[existingIndex]['total_item_price'] = newQty * price;
      } else {
        _salesCart.add({
          'item_id': _selectedItem!.itemId,
          'name': _selectedItem!.name,
          'qty_sold': qty,
          'unit_price': price,
          'total_item_price': qty * price,
        });
      }
    });
  }

  Future<void> _submitSale() async {
    if (_salesCart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot log empty invoice. Add items first.')),
      );
      return;
    }

    // Atomic Transaction to secure mathematical stock decrementation
    final WriteBatch batch = widget.firestore.batch();
    final String saleId = 'SALE_${DateTime.now().millisecondsSinceEpoch}';

    try {
      // 1. Queue Sales Invoice Record
      final saleRef = widget.firestore.collection('sales').doc(saleId);
      final salePayload = {
        'sale_id': saleId,
        'date': FieldValue.serverTimestamp(),
        'customer_name': _customerNameController.text.trim(),
        'customer_type': _customerType,
        'items_sold': _salesCart,
        'gross_total': _grossTotal,
        'discount_given': _discount,
        'net_amount_payable': _netPayable,
        'payment_mode': _paymentMode,
      };
      batch.set(saleRef, salePayload);

      // 2. Queue stock decrement updates for each sold product
      for (var cartItem in _salesCart) {
        final itemRef = widget.firestore.collection('items').doc(cartItem['item_id']);
        
        // Decrement on the server safely
        batch.update(itemRef, {
          'current_stock_qty': FieldValue.increment(-cartItem['qty_sold']),
        });
      }

      // 3. Commit Atomic Batch
      await batch.commit();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sale completed successfully! Invoice ID: $saleId')),
      );

      setState(() {
        _salesCart.clear();
        _customerNameController.text = 'Walk-in Customer';
        _discountController.text = '0.00';
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to complete sale transaction: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Text('Sales Invoice Details', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _customerNameController,
                      decoration: const InputDecoration(labelText: 'Customer Name'),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _customerType,
                            decoration: const InputDecoration(labelText: 'Customer Tier'),
                            items: const [
                              DropdownMenuItem(value: 'Retail', child: Text('Retail Pricing')),
                              DropdownMenuItem(value: 'Wholesale', child: Text('Wholesale Pricing')),
                            ],
                            onChanged: (val) {
                              setState(() {
                                _customerType = val!;
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _paymentMode,
                            decoration: const InputDecoration(labelText: 'Payment Mode'),
                            items: const [
                              DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                              DropdownMenuItem(value: 'UPI', child: Text('UPI / Scan')),
                              DropdownMenuItem(value: 'Card', child: Text('Credit/Debit Card')),
                              DropdownMenuItem(value: 'Credit', child: Text('Unpaid Credit Ledger')),
                            ],
                            onChanged: (val) => setState(() => _paymentMode = val!),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              color: theme.colorScheme.primaryContainer.withOpacity(0.3),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Text('Add Product Line', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<Item>(
                      value: _selectedItem,
                      decoration: const InputDecoration(labelText: 'Select Catalog Item'),
                      items: widget.catalog.map((item) {
                        return DropdownMenuItem<Item>(
                          value: item,
                          child: Text('${item.name} (${item.currentStockQty} left)'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedItem = val;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _qtyController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Quantity to Sell'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: _addItemToCart,
                          icon: const Icon(Icons.add),
                          label: const Text('Add to cart'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('Invoice Cart Items', style: theme.textTheme.titleMedium),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _salesCart.length,
              itemBuilder: (context, idx) {
                final c = _salesCart[idx];
                return ListTile(
                  title: Text(c['name']),
                  subtitle: Text('Qty: ${c['qty_sold']} @ ₹${c['unit_price']} each'),
                  trailing: Text('₹${c['total_item_price']}'),
                  onDelete: () {
                    setState(() {
                      _salesCart.removeAt(idx);
                    });
                  },
                );
              },
            ),
            const Divider(),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Gross Subtotal:'),
                  Text('₹$_grossTotal', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            TextFormField(
              controller: _discountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Invoice Cash Discount Given (₹)'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Net Payable Amount:', style: theme.textTheme.titleMedium),
                Text('₹$_netPayable', style: theme.textTheme.titleLarge?.copyWith(color: Colors.green, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _submitSale,
              icon: const Icon(Icons.print_outlined),
              label: const Text('Complete & Dispatch Sale Invoice'),
            ),
          ],
        ),
      ),
    );
  }
}

// ==========================================
// 2. WAREHOUSE INWARD Restocking Form
// ==========================================
class _WarehouseInwardView extends StatefulWidget {
  final List<Item> catalog;
  final FirebaseFirestore firestore;

  const _WarehouseInwardView({required this.catalog, required this.firestore});

  @override
  State<_WarehouseInwardView> createState() => _WarehouseInwardViewState();
}

class _WarehouseInwardViewState extends State<_WarehouseInwardView> {
  final _formKey = GlobalKey<FormState>();
  final _supplierController = TextEditingController();
  final _costController = TextEditingController();

  Item? _selectedItem;
  final _qtyController = TextEditingController();

  final List<Map<String, dynamic>> _receivedItems = []; // {item_id, qty_added, purchase_price_at_time}

  void _addInwardItem() {
    if (_selectedItem == null) return;
    final qty = int.tryParse(_qtyController.text) ?? 0;
    if (qty <= 0) return;

    setState(() {
      _receivedItems.add({
        'item_id': _selectedItem!.itemId,
        'qty_added': qty,
        'purchase_price_at_time': _selectedItem!.purchasePrice,
      });
      _selectedItem = null;
      _qtyController.clear();
    });
  }

  Future<void> _submitInward() async {
    if (!_formKey.currentState!.validate() || _receivedItems.isEmpty) return;

    final WriteBatch batch = widget.firestore.batch();
    final String inwardId = 'INWARD_${DateTime.now().millisecondsSinceEpoch}';

    try {
      final inwardRef = widget.firestore.collection('warehouse_inward').doc(inwardId);
      final inwardPayload = {
        'inward_id': inwardId,
        'date': FieldValue.serverTimestamp(),
        'supplier_name': _supplierController.text.trim(),
        'items_received': _receivedItems,
        'total_invoice_cost': double.parse(_costController.text),
      };
      batch.set(inwardRef, inwardPayload);

      // Stock Incrementation Engine
      for (var inwardItem in _receivedItems) {
        final itemRef = widget.firestore.collection('items').doc(inwardItem['item_id']);
        batch.update(itemRef, {
          'current_stock_qty': FieldValue.increment(inwardItem['qty_added']),
        });
      }

      await batch.commit();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Restocked Warehouse. Log ID: $inwardId')),
      );

      setState(() {
        _receivedItems.clear();
        _supplierController.clear();
        _costController.clear();
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to process restock: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _supplierController,
              decoration: const InputDecoration(labelText: 'Supplier Name / Agency'),
              validator: (v) => v!.isEmpty ? 'Supplier required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _costController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Total Invoiced restock cost (₹)'),
              validator: (v) => v!.isEmpty ? 'Cost required' : null,
            ),
            const Divider(height: 32),
            DropdownButtonFormField<Item>(
              value: _selectedItem,
              decoration: const InputDecoration(labelText: 'Select Restocking Product'),
              items: widget.catalog.map((i) {
                return DropdownMenuItem<Item>(value: i, child: Text(i.name));
              }).toList(),
              onChanged: (v) => setState(() => _selectedItem = v),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _qtyController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Count Added'),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(onPressed: _addInwardItem, child: const Text('Add to Batch')),
              ],
            ),
            const SizedBox(height: 16),
            Text('Consignment restock list', style: Theme.of(context).textTheme.titleMedium),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _receivedItems.length,
              itemBuilder: (context, idx) {
                final i = _receivedItems[idx];
                return ListTile(
                  title: Text(i['item_id']),
                  subtitle: Text('Qty added: +${i['qty_added']}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () => setState(() => _receivedItems.removeAt(idx)),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: _submitInward, child: const Text('Register Warehouse restock')),
          ],
        ),
      ),
    );
  }
}

// ==========================================
// 3. EXPENSE LOGS Form
// ==========================================
class _ExpenseTrackerView extends StatefulWidget {
  final FirebaseFirestore firestore;

  const _ExpenseTrackerView({required this.firestore});

  @override
  State<_ExpenseTrackerView> createState() => _ExpenseTrackerViewState();
}

class _ExpenseTrackerViewState extends State<_ExpenseTrackerView> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _remarksController = TextEditingController();
  String _category = 'Freight';

  Future<void> _submitExpense() async {
    if (!_formKey.currentState!.validate()) return;

    final String expenseId = 'EXPENSE_${DateTime.now().millisecondsSinceEpoch}';

    try {
      await widget.firestore.collection('expenses').doc(expenseId).set({
        'expense_id': expenseId,
        'date': FieldValue.serverTimestamp(),
        'category': _category,
        'amount': double.parse(_amountController.text),
        'remarks': _remarksController.text.trim(),
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Expense logged. ID: $expenseId')),
      );

      _amountController.clear();
      _remarksController.clear();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to log expense: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Expense Category'),
              items: const [
                DropdownMenuItem(value: 'Freight', child: Text('Freight & Transport Charges')),
                DropdownMenuItem(value: 'Utilities', child: Text('Electricity / Rent / Water')),
                DropdownMenuItem(value: 'Rent', child: Text('Warehouse Rental')),
                DropdownMenuItem(value: 'Staff Welfare', child: Text('Staff Wages / Snacks')),
                DropdownMenuItem(value: 'Puja Supplies', child: Text('Restocking Puja Essentials')),
                DropdownMenuItem(value: 'Misc', child: Text('Miscellaneous Cost')),
              ],
              onChanged: (v) => setState(() => _category = v!),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount Paid (₹)'),
              validator: (v) => v!.isEmpty ? 'Please enter payout amount' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _remarksController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Voucher Audit Remarks'),
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: _submitExpense, child: const Text('Post expense voucher')),
          ],
        ),
      ),
    );
  }
}
