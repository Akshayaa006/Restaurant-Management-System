import { create } from 'zustand';

export interface CartItem {
  menu_item_id: string;
  name: string;
  base_price: number;
  quantity: number;
  options_price: number;
  selected_options: Record<string, any>;
}

interface CartState {
  items: CartItem[];
  tableNumber: number | null;
  notes: string;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menu_item_id: string, selected_options: Record<string, any>) => void;
  updateQuantity: (
    menu_item_id: string,
    selected_options: Record<string, any>,
    delta: number
  ) => void;
  clearCart: () => void;
  setTableNumber: (table: number | null) => void;
  setNotes: (notes: string) => void;
  getTotals: () => { subtotal: number; tax: number; total: number };
}

// Deep sorting utility to ensure key order does not block equality match
const sortObj = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObj).sort();
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObj(obj[key]);
      return acc;
    }, {} as any);
};

const areOptionsEqual = (a: any, b: any) => {
  return JSON.stringify(sortObj(a)) === JSON.stringify(sortObj(b));
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableNumber: null,
  notes: '',

  addItem: (newItem) =>
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.menu_item_id === newItem.menu_item_id &&
          areOptionsEqual(item.selected_options, newItem.selected_options)
      );

      if (existingItemIndex > -1) {
        // Increment quantity of existing item
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += 1;
        return { items: updatedItems };
      } else {
        // Add new item with initial quantity of 1
        return { items: [...state.items, { ...newItem, quantity: 1 }] };
      }
    }),

  removeItem: (menu_item_id, selected_options) =>
    set((state) => ({
      items: state.items.filter(
        (item) =>
          !(
            item.menu_item_id === menu_item_id &&
            areOptionsEqual(item.selected_options, selected_options)
          )
      ),
    })),

  updateQuantity: (menu_item_id, selected_options, delta) =>
    set((state) => {
      const updatedItems = state.items
        .map((item) => {
          if (
            item.menu_item_id === menu_item_id &&
            areOptionsEqual(item.selected_options, selected_options)
          ) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      return { items: updatedItems };
    }),

  clearCart: () => set({ items: [], notes: '' }),

  setTableNumber: (tableNumber) => set({ tableNumber }),

  setNotes: (notes) => set({ notes }),

  getTotals: () => {
    const items = get().items;
    const subtotal = items.reduce(
      (sum, item) => sum + (item.base_price + item.options_price) * item.quantity,
      0
    );
    const tax = subtotal * 0.10; // 10% tax rate
    const total = subtotal + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  },
}));
