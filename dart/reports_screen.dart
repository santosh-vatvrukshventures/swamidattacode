/// reports_screen.dart
///
/// Analytical Report & Financial Accounting Engine Dashboard for Swamidatta Traders.
/// Dynamically calculates Total Revenue, Operating Expenses, Cost of Goods Sold (COGS),
/// and Net Profit/Loss over a customized date-range using Firestore aggregations.
/// Highlights real-time inventory levels below the safety 'min_stock_alert' threshold.

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'item.dart';
import 'sale.dart';
import 'expense.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();

  bool _calculating = true;
  double _totalRevenue = 0.0;
  double _totalExpenses = 0.0;
  double _totalCOGS = 0.0;
  double _netProfit = 0.0;

  List<Item> _lowStockItems = [];

  @override
  void initState() {
    super.initState();
    _loadAllMetrics();
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2025),
      lastDate: DateTime.now().add(const Duration(days: 1)),
      initialDateRange: DateTimeRange(start: _startDate, end: _endDate),
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
        _calculating = true;
      });
      _loadAllMetrics();
    }
  }

  Future<void> _loadAllMetrics() async {
    try {
      // 1. Fetch entire catalog to look up purchase prices for COGS calculation
      final catalogSnapshot = await _firestore.collection('items').get();
      final Map<String, double> itemPurchasePrices = {};
      final List<Item> lowStockList = [];

      for (var doc in catalogSnapshot.docs) {
        final item = Item.fromMap(doc.data());
        itemPurchasePrices[item.itemId] = item.purchasePrice;
        if (item.isLowStock) {
          lowStockList.add(item);
        }
      }

      // 2. Query Sales within Selected Date Range
      final salesSnapshot = await _firestore
          .collection('sales')
          .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(_startDate))
          .where('date', isLessThanOrEqualTo: Timestamp.fromDate(_endDate))
          .get();

      double revAccumulator = 0.0;
      double cogsAccumulator = 0.0;

      for (var doc in salesSnapshot.docs) {
        final sale = Sale.fromMap(doc.data());
        revAccumulator += sale.netAmountPayable;

        // Calculate Cost of Goods Sold (COGS) dynamically based on item purchase price
        for (var soldItem in sale.itemsSold) {
          final purchasePrice = itemPurchasePrices[soldItem.itemId] ?? 0.0;
          cogsAccumulator += (soldItem.qtySold * purchasePrice);
        }
      }

      // 3. Query Operating Expenses within Selected Date Range
      final expenseSnapshot = await _firestore
          .collection('expenses')
          .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(_startDate))
          .where('date', isLessThanOrEqualTo: Timestamp.fromDate(_endDate))
          .get();

      double expenseAccumulator = 0.0;
      for (var doc in expenseSnapshot.docs) {
        final exp = Expense.fromMap(doc.data());
        expenseAccumulator += exp.amount;
      }

      // 4. Calculate Net Profit/Loss
      double netProfitLoss = revAccumulator - (cogsAccumulator + expenseAccumulator);

      setState(() {
        _totalRevenue = revAccumulator;
        _totalExpenses = expenseAccumulator;
        _totalCOGS = cogsAccumulator;
        _netProfit = netProfitLoss;
        _lowStockItems = lowStockList;
        _calculating = false;
      });
    } catch (e) {
      setState(() {
        _calculating = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Financial analysis error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytical Reports & Accounting'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _calculating = true);
              _loadAllMetrics();
            },
          )
        ],
      ),
      body: _calculating
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Date Picker Card
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.date_range),
                      title: const Text('Accounting Period'),
                      subtitle: Text(
                        '${_startDate.day}/${_startDate.month}/${_startDate.year} to ${_endDate.day}/${_endDate.month}/${_endDate.year}',
                      ),
                      trailing: const Icon(Icons.edit_calendar_rounded),
                      onTap: _selectDateRange,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Financial Accounting Summary Cards
                  Text('Business Profitability Ledger', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _FinancialCard(
                          title: 'Sales Revenue',
                          amount: _totalRevenue,
                          color: Colors.green,
                          icon: Icons.trending_up,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _FinancialCard(
                          title: 'Operating Expenses',
                          amount: _totalExpenses,
                          color: Colors.red,
                          icon: Icons.trending_down,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _FinancialCard(
                          title: 'Cost of Goods (COGS)',
                          amount: _totalCOGS,
                          color: Colors.orange,
                          icon: Icons.inventory_2_outlined,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _FinancialCard(
                          title: 'Net Profit / Loss',
                          amount: _netProfit,
                          color: _netProfit >= 0 ? Colors.blue : Colors.deepOrange,
                          icon: _netProfit >= 0 ? Icons.account_balance_wallet_outlined : Icons.warning_amber,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Critical Stock Warning Panel
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Critical Stock Levels (${_lowStockItems.length})',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: _lowStockItems.isNotEmpty ? theme.colorScheme.error : null,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (_lowStockItems.isNotEmpty)
                        const Icon(Icons.warning, color: Colors.red),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_lowStockItems.isEmpty)
                    Card(
                      color: Colors.green.shade50,
                      child: const Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle, color: Colors.green),
                            SizedBox(width: 12),
                            Text(
                              'Inventory levels stable. All items above threshold!',
                              style: TextStyle(color: Colors.green, fontWeight: FontWeight.w500),
                            )
                          ],
                        ),
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _lowStockItems.length,
                      itemBuilder: (context, idx) {
                        final item = _lowStockItems[idx];
                        return Card(
                          color: Colors.red.shade50,
                          margin: const EdgeInsets.symmetric(vertical: 4.0),
                          child: ListTile(
                            leading: const Icon(Icons.crisis_alert, color: Colors.red),
                            title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                            subtitle: Text('Category: ${item.category}'),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'Stock: ${item.currentStockQty}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 14),
                                ),
                                Text(
                                  'Min threshold: ${item.minStockAlert}',
                                  style: const TextStyle(color: Colors.black54, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
    );
  }
}

class _FinancialCard extends StatelessWidget {
  final String title;
  final double amount;
  final Color color;
  final IconData icon;

  const _FinancialCard({
    required this.title,
    required this.amount,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 24),
                Text(
                  title,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.outline,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '₹ ${amount.toStringAsFixed(2)}',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
