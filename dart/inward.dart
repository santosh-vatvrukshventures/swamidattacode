/// inward.dart
///
/// Model representing a Warehouse Inward restock shipment at Swamidatta Traders.
/// Translates incoming vendor invoice lists to Firestore-compatible structures.

import 'package:cloud_firestore/cloud_firestore.dart';

class InwardItem {
  final String itemId;
  final int qtyAdded;
  final double purchasePriceAtTime;

  InwardItem({
    required this.itemId,
    required this.qtyAdded,
    required this.purchasePriceAtTime,
  });

  factory InwardItem.fromMap(Map<String, dynamic> map) {
    return InwardItem(
      itemId: map['item_id'] ?? '',
      qtyAdded: (map['qty_added'] as num?)?.toInt() ?? 0,
      purchasePriceAtTime: (map['purchase_price_at_time'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'item_id': itemId,
      'qty_added': qtyAdded,
      'purchase_price_at_time': purchasePriceAtTime,
    };
  }
}

class Inward {
  final String inwardId;
  final DateTime date;
  final String supplierName;
  final List<InwardItem> itemsReceived;
  final double totalInvoiceCost;

  Inward({
    required this.inwardId,
    required this.date,
    required this.supplierName,
    required this.itemsReceived,
    required this.totalInvoiceCost,
  });

  /// Factory constructor to parse document Map loaded from Cloud Firestore.
  /// Safely resolves Firestore [Timestamp] representations.
  factory Inward.fromMap(Map<String, dynamic> map) {
    var list = map['items_received'] as List? ?? [];
    List<InwardItem> items = list.map((item) => InwardItem.fromMap(Map<String, dynamic>.from(item))).toList();

    DateTime parsedDate;
    if (map['date'] is Timestamp) {
      parsedDate = (map['date'] as Timestamp).toDate();
    } else if (map['date'] is String) {
      parsedDate = DateTime.tryParse(map['date']) ?? DateTime.now();
    } else {
      parsedDate = DateTime.now();
    }

    return Inward(
      inwardId: map['inward_id'] ?? '',
      date: parsedDate,
      supplierName: map['supplier_name'] ?? 'Generic Supplier',
      itemsReceived: items,
      totalInvoiceCost: (map['total_invoice_cost'] as num?)?.toDouble() ?? 0.0,
    );
  }

  /// Converts this [Inward] shipment into a Map for Firestore write transactions.
  Map<String, dynamic> toMap() {
    return {
      'inward_id': inwardId,
      'date': Timestamp.fromDate(date),
      'supplier_name': supplierName,
      'items_received': itemsReceived.map((i) => i.toMap()).toList(),
      'total_invoice_cost': totalInvoiceCost,
    };
  }
}
