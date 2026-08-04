import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, X, Plus, Minus, Check, Flame } from 'lucide-react';
import { useCartStore, CartItem } from '../store/cartStore';

// Delicious mock menu items for fallback
const MOCK_MENU = [
  {
    _id: "m1",
    name: "Truffle Parmesan Fries",
    category: "Starters",
    base_price: 8.0,
    description: "Crispy hand-cut fries tossed in white truffle oil, aged parmesan, and fresh herbs, served with garlic aioli.",
    image_url: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=600",
    dietary_tags: ["Vegetarian", "Gluten-Free"],
    is_available: true,
    customization_groups: [
      {
        name: "Sauce Option",
        required: true,
        max_selected: 1,
        options: [
          { name: "Garlic Aioli", price_modifier: 0.0 },
          { name: "Spicy Sriracha Mayo", price_modifier: 0.50 },
          { name: "Truffle Ketchup", price_modifier: 1.00 }
        ]
      },
      {
        name: "Extra Toppings",
        required: false,
        max_selected: 2,
        options: [
          { name: "Extra Parmesan", price_modifier: 1.50 },
          { name: "Crispy Bacon Bits", price_modifier: 2.00 }
        ]
      }
    ]
  },
  {
    _id: "m2",
    name: "Classic Wagyu Burger",
    category: "Mains",
    base_price: 16.0,
    description: "Premium Wagyu beef patty, mature cheddar, caramelized balsamic onions, butter lettuce, and tomato on brioche.",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
    dietary_tags: ["Spicy"],
    is_available: true,
    customization_groups: [
      {
        name: "Meat Doneness",
        required: true,
        max_selected: 1,
        options: [
          { name: "Medium Rare", price_modifier: 0.0 },
          { name: "Medium", price_modifier: 0.0 },
          { name: "Well Done", price_modifier: 0.0 }
        ]
      },
      {
        name: "Cheese Option",
        required: true,
        max_selected: 1,
        options: [
          { name: "Cheddar", price_modifier: 0.0 },
          { name: "Swiss Gruyere", price_modifier: 1.00 },
          { name: "Gorogonzola Blue", price_modifier: 2.00 }
        ]
      },
      {
        name: "Add-ons",
        required: false,
        max_selected: 3,
        options: [
          { name: "Avocado Slices", price_modifier: 2.00 },
          { name: "Fried Organic Egg", price_modifier: 1.50 },
          { name: "Applewood Bacon", price_modifier: 2.00 }
        ]
      }
    ]
  },
  {
    _id: "m3",
    name: "Garden Harvest Salad",
    category: "Starters",
    base_price: 12.0,
    description: "Tender baby greens, sliced Hass avocado, organic cucumber, toasted sunflower seeds, with a zesty lemon-dill dressing.",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
    dietary_tags: ["Vegan", "Gluten-Free", "Vegetarian"],
    is_available: true,
    customization_groups: [
      {
        name: "Add Protein",
        required: false,
        max_selected: 1,
        options: [
          { name: "Grilled Herb Chicken", price_modifier: 4.00 },
          { name: "Pan-Seared Organic Tofu", price_modifier: 3.00 },
          { name: "Butter Garlic Shrimp", price_modifier: 5.00 }
        ]
      }
    ]
  },
  {
    _id: "m4",
    name: "Espresso Martini",
    category: "Drinks",
    base_price: 14.0,
    description: "Single-origin double espresso, grey goose vodka, coffee liqueur shaken vigorously with ice until thick and frothy.",
    image_url: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=600",
    dietary_tags: [],
    is_available: true,
    customization_groups: [
      {
        name: "Sweetness",
        required: true,
        max_selected: 1,
        options: [
          { name: "Standard Sweetness", price_modifier: 0.0 },
          { name: "Slightly Dry (Less Sweet)", price_modifier: 0.0 },
          { name: "Extra Sweet", price_modifier: 0.0 }
        ]
      }
    ]
  },
  {
    _id: "m5",
    name: "Fresh Strawberry Lemonade",
    category: "Drinks",
    base_price: 5.0,
    description: "Freshly squeezed lemon juice, homemade strawberry compote, filtered water, served ice-cold with fresh mint.",
    image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    dietary_tags: ["Vegan", "Gluten-Free", "Vegetarian"],
    is_available: true,
    customization_groups: [
      {
        name: "Ice Level",
        required: true,
        max_selected: 1,
        options: [
          { name: "Regular Ice", price_modifier: 0.0 },
          { name: "Light Ice", price_modifier: 0.0 },
          { name: "No Ice", price_modifier: 0.0 }
        ]
      }
    ]
  }
];

export default function MenuPage() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('Starters');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);

  // Modal and Drawer States
  const [customizingItem, setCustomizingItem] = useState<any | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Zustand Store
  const cartItems = useCartStore((state) => state.items);
  const addItemToCart = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const tableNumber = useCartStore((state) => state.tableNumber);
  const setTableNumber = useCartStore((state) => state.setTableNumber);
  const notes = useCartStore((state) => state.notes);
  const setNotes = useCartStore((state) => state.setNotes);
  const clearCart = useCartStore((state) => state.clearCart);
  const totals = useCartStore((state) => state.getTotals)();

  // Fetch Menu from Backend
  useEffect(() => {
    fetch('/api/v1/menu')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMenuItems(data);
        } else {
          setMenuItems(MOCK_MENU);
        }
      })
      .catch(() => {
        setMenuItems(MOCK_MENU);
      });
  }, []);

  // Filter Menu List
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiet = selectedDiet ? item.dietary_tags.includes(selectedDiet) : true;
    return matchesCategory && matchesSearch && matchesDiet && item.is_available;
  });

  // Calculate customization price
  const getCustomizationPrice = () => {
    if (!customizingItem) return 0;
    let extra = 0;
    Object.entries(selectedOptions).forEach(([groupName, val]) => {
      const group = customizingItem.customization_groups.find((g: any) => g.name === groupName);
      if (group) {
        const selections = Array.isArray(val) ? val : [val];
        selections.forEach((optName) => {
          const opt = group.options.find((o: any) => o.name === optName);
          if (opt) extra += opt.price_modifier;
        });
      }
    });
    return extra;
  };

  // Open Customization Modal and set Defaults
  const handleOpenCustomizer = (item: any) => {
    setCustomizingItem(item);
    const defaults: Record<string, any> = {};
    item.customization_groups.forEach((group: any) => {
      if (group.required && group.options.length > 0) {
        defaults[group.name] = group.options[0].name;
      }
    });
    setSelectedOptions(defaults);
  };

  // Toggle selection on Option Group click
  const handleOptionToggle = (groupName: string, optionName: string, maxSelected: number) => {
    setSelectedOptions((prev) => {
      const current = prev[groupName];
      if (maxSelected === 1) {
        return { ...prev, [groupName]: optionName };
      }

      const list = Array.isArray(current) ? [...current] : current ? [current] : [];
      if (list.includes(optionName)) {
        return { ...prev, [groupName]: list.filter((n) => n !== optionName) };
      } else {
        if (list.length < maxSelected) {
          list.push(optionName);
        }
        return { ...prev, [groupName]: list };
      }
    });
  };

  // Add Item to cart
  const handleAddToCart = () => {
    if (!customizingItem) return;
    const optionsPrice = getCustomizationPrice();
    addItemToCart({
      menu_item_id: customizingItem._id,
      name: customizingItem.name,
      base_price: customizingItem.base_price,
      options_price: optionsPrice,
      selected_options: { ...selectedOptions }
    });
    setCustomizingItem(null);
  };

  // Check out Order
  const handleCheckout = async () => {
    if (!tableNumber) {
      alert("Please enter a valid Table Number to complete your order.");
      return;
    }
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    const orderPayload = {
      table_number: Number(tableNumber),
      order_type: "DINE_IN",
      items: cartItems.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        selected_options: item.selected_options
      }))
    };

    try {
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await response.json();
      if (response.ok && data.id) {
        clearCart();
        setIsCartOpen(false);
        navigate(`/order/${data.id}`);
      } else {
        alert(data.detail || "Something went wrong during checkout.");
      }
    } catch (e) {
      alert("Failed to submit order. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-brand-50 min-h-screen pb-24 shadow-xl border-x border-brand-200/40 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-50/80 backdrop-blur-md border-b border-brand-200/50 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-2xl tracking-tight text-brand-900 font-brand">BISTRO GOURMET</h1>
          <p className="text-xs text-brand-900/60 font-medium">Fine Dining, Cooked Live</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative bg-brand-900 text-brand-50 p-2.5 rounded-full hover:bg-brand-900/90 transition-colors shadow-md"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-brand-900 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center border border-brand-50 animate-bounce">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Hero Banner */}
      <div className="mx-4 my-4 h-36 rounded-2xl overflow-hidden relative shadow-sm border border-brand-200/30 bg-brand-900">
        <img 
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800" 
          alt="Bistro"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/30 to-transparent flex flex-col justify-end p-4">
          <span className="text-[10px] bg-brand-500 text-brand-900 font-bold px-2 py-0.5 rounded-full w-max mb-1.5 tracking-wider uppercase">Welcome</span>
          <h2 className="text-brand-50 font-bold text-lg font-brand leading-tight">Authentic Taste directly to your table</h2>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-900/40 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search our delicious items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-brand-200/70 py-2.5 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder-brand-900/30 text-brand-900"
          />
        </div>

        {/* Dietary Badges */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["Vegan", "Vegetarian", "Gluten-Free", "Spicy"].map((tag) => {
            const isSelected = selectedDiet === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedDiet(isSelected ? null : tag)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected 
                    ? 'bg-brand-900 text-brand-50 border-brand-900 shadow-sm' 
                    : 'bg-white text-brand-900/70 border-brand-200/75 hover:bg-brand-100'
                }`}
              >
                {tag === 'Spicy' && <Flame className="w-3.5 h-3.5 text-orange-500" />}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky Categories */}
      <div className="sticky top-[77px] z-30 bg-brand-50 border-y border-brand-200/50 py-3 mt-4 overflow-x-auto no-scrollbar px-4 flex gap-2">
        {['Starters', 'Mains', 'Drinks'].map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-sm font-bold tracking-tight transition-all shrink-0 ${
                isActive 
                  ? 'bg-brand-900 text-brand-50 shadow-sm shadow-brand-900/20' 
                  : 'bg-white text-brand-900/60 border border-brand-200/60 hover:text-brand-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Menu Cards */}
      <div className="px-4 py-4 space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item._id} 
              className="bg-white border border-brand-200/50 rounded-2xl overflow-hidden p-3 flex gap-3 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {item.image_url && (
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-24 h-24 rounded-xl object-cover shrink-0 border border-brand-200/20"
                />
              )}
              <div className="flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-sm text-brand-900 font-brand">{item.name}</h3>
                    {item.dietary_tags.includes('Spicy') && <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-xs text-brand-900/50 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-brand-200/40">
                  <span className="font-extrabold text-sm text-brand-900">${item.base_price.toFixed(2)}</span>
                  <button 
                    onClick={() => handleOpenCustomizer(item)}
                    className="bg-brand-900 text-brand-50 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-900/90 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-brand-900/40 text-sm font-medium">
            No items available in this category.
          </div>
        )}
      </div>

      {/* Item Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-slide-up border-t border-brand-200/50">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-brand-200/50 flex items-start justify-between relative bg-brand-50/50">
              <div>
                <h3 className="font-extrabold text-brand-900 text-base font-brand leading-snug">{customizingItem.name}</h3>
                <p className="text-xs text-brand-900/50 font-semibold mt-0.5">${customizingItem.base_price.toFixed(2)}</p>
              </div>
              <button 
                onClick={() => setCustomizingItem(null)}
                className="bg-white border border-brand-200 p-1.5 rounded-full hover:bg-brand-100 transition-colors"
              >
                <X className="w-4 h-4 text-brand-900/80" />
              </button>
            </div>

            {/* Customization Details */}
            <div className="overflow-y-auto p-5 space-y-5 flex-grow">
              {customizingItem.customization_groups.map((group: any) => (
                <div key={group.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-brand-900 uppercase tracking-wider">{group.name}</span>
                    <span className="text-[10px] bg-brand-100 text-brand-900 font-bold px-2 py-0.5 rounded-md">
                      {group.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map((opt: any) => {
                      const isSelected = Array.isArray(selectedOptions[group.name]) 
                        ? selectedOptions[group.name].includes(opt.name)
                        : selectedOptions[group.name] === opt.name;

                      return (
                        <button
                          key={opt.name}
                          onClick={() => handleOptionToggle(group.name, opt.name, group.max_selected)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected 
                              ? 'bg-brand-100/40 border-brand-500 text-brand-900' 
                              : 'bg-white border-brand-200/60 text-brand-900/80 hover:bg-brand-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-brand-500 border-brand-500 text-brand-900' : 'border-brand-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>
                          {opt.price_modifier > 0 && (
                            <span className="font-bold text-brand-900/60">+${opt.price_modifier.toFixed(2)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Preview & Cart Add */}
            <div className="p-5 border-t border-brand-200/50 bg-brand-50/50">
              <button
                onClick={handleAddToCart}
                className="w-full bg-brand-900 text-brand-50 py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-brand-900/90 transition-colors flex items-center justify-center gap-2"
              >
                Add to Order - ${(customizingItem.base_price + getCustomizationPrice()).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-brand-900/40 backdrop-blur-sm">
          <div className="bg-brand-50 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left relative border-l border-brand-200/50">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-brand-200/50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-900" />
                <h3 className="font-extrabold text-brand-900 text-base font-brand">Your Dining Basket</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="bg-brand-100 hover:bg-brand-200/70 p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-brand-900/80" />
              </button>
            </div>

            {/* Items Breakdown */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {cartItems.length > 0 ? (
                cartItems.map((item, idx) => (
                  <div key={idx} className="bg-white border border-brand-200/40 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex-grow space-y-1">
                      <h4 className="font-bold text-xs text-brand-900">{item.name}</h4>
                      {Object.keys(item.selected_options).length > 0 && (
                        <div className="text-[10px] text-brand-900/50 flex flex-wrap gap-1 leading-relaxed">
                          {Object.entries(item.selected_options).map(([grp, opt]) => (
                            <span key={grp} className="bg-brand-100 px-1.5 py-0.5 rounded">
                              {grp}: {Array.isArray(opt) ? opt.join(', ') : opt}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="font-bold text-xs text-brand-900 pt-0.5">
                        ${((item.base_price + item.options_price) * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity adjusters */}
                    <div className="flex items-center gap-2 border border-brand-200 rounded-lg p-1 shrink-0 bg-brand-50/50">
                      <button 
                        onClick={() => updateQuantity(item.menu_item_id, item.selected_options, -1)}
                        className="bg-white hover:bg-brand-100 p-1 rounded transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-brand-900/80" />
                      </button>
                      <span className="font-bold text-xs text-brand-900 w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.menu_item_id, item.selected_options, 1)}
                        className="bg-white hover:bg-brand-100 p-1 rounded transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-brand-900/80" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 text-brand-900/40 text-xs font-semibold">
                  Your basket is currently empty.
                </div>
              )}
            </div>

            {/* Checkout Form */}
            <div className="p-4 border-t border-brand-200/50 bg-white space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-brand-900/60 uppercase tracking-wider mb-1">Table Number</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 5"
                    value={tableNumber || ''}
                    onChange={(e) => setTableNumber(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-brand-50 border border-brand-200/80 py-2 px-3 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 text-brand-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-900/60 uppercase tracking-wider mb-1">Order Type</label>
                  <div className="bg-brand-50 border border-brand-200/80 py-2 px-3 rounded-lg text-xs font-bold text-brand-900/85">
                    Dine-in Order
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-900/60 uppercase tracking-wider mb-1">Special Notes</label>
                <textarea 
                  placeholder="Allergies, extra sauce, cooking requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-brand-50 border border-brand-200/80 py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 text-brand-900 placeholder-brand-900/30"
                  rows={2}
                />
              </div>

              {/* Totals & Submit */}
              <div className="space-y-1 text-xs border-t border-dashed border-brand-200 pt-3">
                <div className="flex justify-between text-brand-900/60">
                  <span>Subtotal</span>
                  <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-900/60">
                  <span>Sales Tax (10%)</span>
                  <span className="font-semibold">${totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-900 font-bold text-sm pt-1.5 border-t border-brand-100">
                  <span>Grand Total</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || isSubmitting}
                className="w-full bg-brand-900 text-brand-50 py-3.5 rounded-xl font-extrabold text-sm shadow-md hover:bg-brand-900/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Sending Order...' : `Confirm & Place Order`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
