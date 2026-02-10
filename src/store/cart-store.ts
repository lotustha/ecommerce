import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Define the shape of a Cart Item
export interface CartItem {
    productId: string;
    variantId?: string | null;
    name: string;
    price: number;
    image?: string;
    quantity: number;
    stock: number;
    categoryName?: string;
}

// 2. Define the Store Actions & State
interface CartState {
    items: CartItem[];
    checkoutIds: string[]; // 🆕 IDs selected for checkout

    // Actions
    addItem: (item: CartItem) => void;
    removeItem: (productId: string, variantId?: string | null) => void;
    updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
    clearCart: () => void;
    setCheckoutIds: (ids: string[]) => void; // 🆕 Action to set checkout items

    // Computed (Getters)
    getTotalItems: () => number;
    getSubTotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            checkoutIds: [],

            addItem: (newItem) => {
                const currentItems = get().items;
                // Check if item already exists (same Product ID AND same Variant ID)
                const existingItemIndex = currentItems.findIndex(
                    (item) => item.productId === newItem.productId && item.variantId === newItem.variantId
                );

                if (existingItemIndex > -1) {
                    // If exists, just increase quantity
                    const updatedItems = [...currentItems];
                    const existingItem = updatedItems[existingItemIndex];

                    // Don't exceed stock
                    const newQuantity = Math.min(existingItem.quantity + newItem.quantity, existingItem.stock);

                    updatedItems[existingItemIndex] = {
                        ...existingItem,
                        quantity: newQuantity,
                    };

                    set({ items: updatedItems });
                } else {
                    // If new, add to array
                    set({ items: [...currentItems, newItem] });
                }
            },

            removeItem: (productId, variantId = null) => {
                set((state) => ({
                    items: state.items.filter(
                        (item) => !(item.productId === productId && item.variantId === variantId)
                    ),
                }));
            },

            updateQuantity: (productId, variantId, quantity) => {
                set((state) => ({
                    items: state.items.map((item) => {
                        if (item.productId === productId && item.variantId === variantId) {
                            // Ensure quantity is at least 1 and doesn't exceed stock
                            const validQuantity = Math.max(1, Math.min(quantity, item.stock));
                            return { ...item, quantity: validQuantity };
                        }
                        return item;
                    }),
                }));
            },

            clearCart: () => set({ items: [], checkoutIds: [] }),

            // 🆕 Set the items to be checked out
            setCheckoutIds: (ids) => set({ checkoutIds: ids }),

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getSubTotal: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },
        }),
        {
            name: 'nepal-ecom-cart', // Unique key for localStorage
            storage: createJSONStorage(() => localStorage),
            // Persist both items and checkoutIds
            partialize: (state) => ({ items: state.items, checkoutIds: state.checkoutIds }),
        }
    )
);