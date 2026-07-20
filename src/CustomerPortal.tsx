import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Search, User, Smartphone, Send, Check, X, Sparkles } from 'lucide-react';
import { Item, CustomerOrderItem, Offer } from './types';

interface CustomerPortalProps {
  items: Item[];
  customersList: string[];
  offers: Offer[];
}

export default function CustomerPortal({ items, customersList, offers }: CustomerPortalProps) {
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [cart, setCart] = useState<CustomerOrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showItemSelectorModal, setShowItemSelectorModal] = useState(false);
  
  // Group items by category for the modal
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  const orderedCategories = useMemo(() => {
    const keys = Object.keys(groupedItems);
    const priority = ["Single use", "Mangal Puja", "Party decoration"];
    
    // Custom sort: prioritized first, then alphabetical for the rest
    return keys.sort((a, b) => {
      const aIndex = priority.findIndex(p => p.toLowerCase() === a.toLowerCase());
      const bIndex = priority.findIndex(p => p.toLowerCase() === b.toLowerCase());
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      return a.localeCompare(b);
    });
  }, [groupedItems]);

  const toggleCartSelection = (item: Item) => {
    const existing = cart.find((c) => c.item_id === item.item_id);
    if (existing) {
      setCart(cart.filter((c) => c.item_id !== item.item_id));
    } else {
      setCart([...cart, { item_id: item.item_id, name: item.name, qty: 1 }]);
    }
  };

  const addToCart = (item: Item) => {
    const existing = cart.find((c) => c.item_id === item.item_id);
    if (existing) {
      setCart(cart.map((c) => c.item_id === item.item_id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { item_id: item.item_id, name: item.name, qty: 1 }]);
    }
  };

  const setCartItemQty = (itemId: string, newQty: number) => {
    setCart(
      cart
        .map((c) => (c.item_id === itemId ? { ...c, qty: newQty } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !contactNumber.trim() || cart.length === 0) {
      alert("Please provide your name, contact number, and add items to your cart.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder = {
        order_id: `ORD_${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customer_name: customerName.trim(),
        contact_number: contactNumber.trim(),
        items: cart,
        status: 'pending'
      };

      const res = await fetch("/api/customer-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      
      if (res.ok) {
        setSubmitted(true);
        setCart([]);
      } else {
        alert("There was an error placing your order. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("There was an error placing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Order Received!</h2>
          <p className="text-sm text-slate-400">
            Thank you, {customerName}. Your order has been successfully placed and sent to the store.
          </p>
          <button 
            onClick={() => { setSubmitted(false); setCustomerName(""); setContactNumber(""); }}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg w-full transition-colors"
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 p-4 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white tracking-wide">
              Swamidatta <span className="text-indigo-400">Orders</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Place your order online</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Customer Details */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Your Details <span className="text-rose-500">*</span>
            </h3>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Full Name (Required)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-10"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              
              {/* Autocomplete for known customers */}
              {customerName.length > 1 && !customersList.includes(customerName) && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                  {customersList
                    .filter(c => c.toLowerCase().includes(customerName.toLowerCase()))
                    .slice(0, 3)
                    .map(suggested => (
                      <div
                        key={suggested}
                        onClick={() => setCustomerName(suggested)}
                        className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer"
                      >
                        {suggested}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="tel"
                placeholder="Contact Number (Required)"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-10"
              />
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Item Selection Button */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 text-center">
          <p className="text-xs text-slate-400 mb-2">Ready to order? Browse our full catalog.</p>
          <button
            onClick={() => setShowItemSelectorModal(true)}
            className="w-full bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-600/40 text-indigo-300 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Find Items to Add
          </button>
        </div>

        {/* Cart */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-400" />
            Your Order ({cart.reduce((sum, c) => sum + c.qty, 0)} items)
          </h3>
          
          {cart.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Your cart is empty. Click "Find Items" above to add products.
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(c => (
                <div key={c.item_id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex-1 pr-3 truncate">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{c.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setCartItemQty(c.item_id, c.qty - 1)}
                      className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={c.qty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setCartItemQty(c.item_id, val);
                      }}
                      onBlur={(e) => {
                        if (!e.target.value || parseInt(e.target.value, 10) <= 0) {
                          setCartItemQty(c.item_id, 1);
                        }
                      }}
                      className="text-sm font-bold w-14 text-center text-white font-mono bg-slate-900 border border-slate-700 rounded px-1 py-1 focus:outline-none focus:border-indigo-500 hide-number-spinners"
                    />
                    <button
                      onClick={() => setCartItemQty(c.item_id, c.qty + 1)}
                      className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-40 pb-8">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !customerName.trim() || !contactNumber.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg py-4 rounded-xl shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Place Order Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Find Items Modal Popup */}
      {showItemSelectorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex flex-col items-center p-4 sm:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                Select Items
              </h2>
              <button 
                onClick={() => setShowItemSelectorModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              
              {/* Special Offers Section */}
              {offers.length > 0 && (
                <div className="space-y-3 mb-6">
                  {offers.map(offer => (
                    <div key={offer.offer_id} className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 text-center shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse">
                      <h3 className="text-yellow-400 font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {offer.text}
                        <Sparkles className="w-4 h-4" />
                      </h3>
                    </div>
                  ))}
                </div>
              )}

              {/* Categorized Items */}
              {orderedCategories.map(category => (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {groupedItems[category].map(item => {
                      const isSelected = !!cart.find(c => c.item_id === item.item_id);
                      return (
                        <div 
                          key={item.item_id} 
                          onClick={() => toggleCartSelection(item)}
                          className={`border p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-indigo-900/40 border-indigo-500' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="pr-2 truncate">
                            <h4 className="text-sm font-bold text-slate-200 truncate">{item.name}</h4>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'bg-slate-900 border-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 shrink-0">
              <button 
                onClick={() => setShowItemSelectorModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Done (View Cart)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
