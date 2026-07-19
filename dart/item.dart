/// item.dart
///
/// Model representing an Inventory Item in the Swamidatta Traders catalog.
/// Supports Firebase Firestore serialization/deserialization with sound null safety.

class Item {
  final String itemId;
  final String name;
  final String category;
  final double purchasePrice;
  final double sellingPriceRetail;
  final double sellingPriceWholesale;
  final int currentStockQty;
  final int minStockAlert;

  Item({
    required this.itemId,
    required this.name,
    required this.category,
    required this.purchasePrice,
    required this.sellingPriceRetail,
    required this.sellingPriceWholesale,
    required this.currentStockQty,
    required this.minStockAlert,
  });

  /// Factory constructor to build an [Item] from a Firestore document map.
  factory Item.fromMap(Map<String, dynamic> map) {
    return Item(
      itemId: map['item_id'] ?? '',
      name: map['name'] ?? '',
      category: map['category'] ?? '',
      purchasePrice: (map['purchase_price'] as num?)?.toDouble() ?? 0.0,
      sellingPriceRetail: (map['selling_price_retail'] as num?)?.toDouble() ?? 0.0,
      sellingPriceWholesale: (map['selling_price_wholesale'] as num?)?.toDouble() ?? 0.0,
      currentStockQty: (map['current_stock_qty'] as num?)?.toInt() ?? 0,
      minStockAlert: (map['min_stock_alert'] as num?)?.toInt() ?? 0,
    );
  }

  /// Converts this [Item] instance into a Map for Firestore write operations.
  Map<String, dynamic> toMap() {
    return {
      'item_id': itemId,
      'name': name,
      'category': category,
      'purchase_price': purchasePrice,
      'selling_price_retail': sellingPriceRetail,
      'selling_price_wholesale': sellingPriceWholesale,
      'current_stock_qty': currentStockQty,
      'min_stock_alert': minStockAlert,
    };
  }

  /// Creates a copy of this [Item] but with the given fields replaced with the new values.
  Item copyWith({
    String? itemId,
    String? name,
    String? category,
    double? purchasePrice,
    double? sellingPriceRetail,
    double? sellingPriceWholesale,
    int? currentStockQty,
    int? minStockAlert,
  }) {
    return Item(
      itemId: itemId ?? this.itemId,
      name: name ?? this.name,
      category: category ?? this.category,
      purchasePrice: purchasePrice ?? this.purchasePrice,
      sellingPriceRetail: sellingPriceRetail ?? this.sellingPriceRetail,
      sellingPriceWholesale: sellingPriceWholesale ?? this.sellingPriceWholesale,
      currentStockQty: currentStockQty ?? this.currentStockQty,
      minStockAlert: minStockAlert ?? this.minStockAlert,
    );
  }

  /// Checks if the item is running low on stock.
  bool get isLowStock => currentStockQty <= minStockAlert;
}
