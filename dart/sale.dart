/// sale.dart
///
/// Model representing a Customer Sales Invoice transaction in Swamidatta Traders.
/// Handles nested array conversions cleanly for seamless Firestore database usage.

import 'package:cloud_firestore/cloud_firestore.dart';

class SoldItem {
  final String itemId;
  final String name;
  final int qtySold;
  final double unitPrice;
  final double totalItemPrice;

  SoldItem({
    required this.itemId,
    required this.name,
    required this.qtySold,
    required this.unitPrice,
    required this.totalItemPrice,
  });

  factory SoldItem.fromMap(Map<String, dynamic> map) {
    return SoldItem(
      itemId: map['item_id'] ?? '',
      name: map['name'] ?? '',
      qtySold: (map['qty_sold'] as num?)?.toInt() ?? 0,
      unitPrice: (map['unit_price'] as num?)?.toDouble() ?? 0.0,
      totalItemPrice: (map['total_item_price'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'item_id': itemId,
      'name': name,
      'qty_sold': qtySold,
      'unit_price': unitPrice,
      'total_item_price': totalItemPrice,
    };
  }
}

class Sale {
  final String saleId;
  final DateTime date;
  final String customerName;
  final String customerType; // 'Retail' or 'Wholesale'
  final List<SoldItem> itemsSold;
  final double grossTotal;
  final double discountGiven;
  final double netAmountPayable;
  final String paymentMode; // e.g., 'Cash', 'UPI', 'Credit'

  Sale({
    required this.saleId,
    required this.date,
    required this.customerName,
    required this.customerType,
    required this.itemsSold,
    required this.grossTotal,
    required this.discountGiven,
    required this.netAmountPayable,
    required this.paymentMode,
  });

  /// Factory constructor to parse document Map loaded from Cloud Firestore.
  /// Converts Firestore's [Timestamp] to Dart [DateTime] safely.
  factory Sale.fromMap(Map<String, dynamic> map) {
    var list = map['items_sold'] as List? ?? [];
    List<SoldItem> items = list.map((item) => SoldItem.fromMap(Map<String, dynamic>.from(item))).toList();

    DateTime parsedDate;
    if (map['date'] is Timestamp) {
      parsedDate = (map['date'] as Timestamp).toDate();
    } else if (map['date'] is String) {
      parsedDate = DateTime.tryParse(map['date']) ?? DateTime.now();
    } else {
      parsedDate = DateTime.now();
    }

    return Sale(
      saleId: map['sale_id'] ?? '',
      date: parsedDate,
      customerName: map['customer_name'] ?? 'Walk-in Customer',
      customerType: map['customer_type'] ?? 'Retail',
      itemsSold: items,
      grossTotal: (map['gross_total'] as num?)?.toDouble() ?? 0.0,
      discountGiven: (map['discount_given'] as num?)?.toDouble() ?? 0.0,
      netAmountPayable: (map['net_amount_payable'] as num?)?.toDouble() ?? 0.0,
      paymentMode: map['payment_mode'] ?? 'Cash',
    );
  }

  /// Converts this [Sale] instance into a Map for Firestore write transactions.
  Map<String, dynamic> toMap() {
    return {
      'sale_id': saleId,
      'date': Timestamp.fromDate(date),
      'customer_name': customerName,
      'customer_type': customerType,
      'items_sold': itemsSold.map((i) => i.toMap()).toList(),
      'gross_total': grossTotal,
      'discount_given': discountGiven,
      'net_amount_payable': netAmountPayable,
      'payment_mode': paymentMode,
    };
  }
}
