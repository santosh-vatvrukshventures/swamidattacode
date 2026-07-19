/// expense.dart
///
/// Model representing operating expenditures (outward shop costs) for Swamidatta Traders.
/// Serializes operating cost entries for safe cloud bookkeeping.

import 'package:cloud_firestore/cloud_firestore.dart';

class Expense {
  final String expenseId;
  final DateTime date;
  final String category; // e.g., 'Freight', 'Utilities', 'Rent', 'Salary'
  final double amount;
  final String remarks;

  Expense({
    required this.expenseId,
    required this.date,
    required this.category,
    required this.amount,
    required this.remarks,
  });

  /// Factory constructor to parse document Map loaded from Cloud Firestore.
  /// Resolves Firestore [Timestamp] safely.
  factory Expense.fromMap(Map<String, dynamic> map) {
    DateTime parsedDate;
    if (map['date'] is Timestamp) {
      parsedDate = (map['date'] as Timestamp).toDate();
    } else if (map['date'] is String) {
      parsedDate = DateTime.tryParse(map['date']) ?? DateTime.now();
    } else {
      parsedDate = DateTime.now();
    }

    return Expense(
      expenseId: map['expense_id'] ?? '',
      date: parsedDate,
      category: map['category'] ?? 'Miscellaneous',
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
      remarks: map['remarks'] ?? '',
    );
  }

  /// Converts this [Expense] instance into a Map for Firestore write transactions.
  Map<String, dynamic> toMap() {
    return {
      'expense_id': expenseId,
      'date': Timestamp.fromDate(date),
      'category': category,
      'amount': amount,
      'remarks': remarks,
    };
  }
}
