import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { cartApi, CartItemDto } from '@/services/api';

interface CartStore {
  items: CartItem[];
  cartItemIds: Map<string, string>; // Map productId+formatId to cartItemId
  isLoading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartItemIds: new Map(),
      isLoading: false,
      syncCart: async () => {
        try {
          set({ isLoading: true });
          const currentItems = get().items;
          const response = await cartApi.getCart();
          if (response.data.isSucceeded && response.data.data) {
            const cart = response.data.data;
            const items: CartItem[] = [];
            const cartItemIds = new Map<string, string>();
            
            // Load items from database
            for (const cartItem of cart.cartItems) {
              const productId = cartItem.productId;
              const formatId = cartItem.productFormatId;
              const key = `${productId}_${formatId}`;
              cartItemIds.set(key, cartItem.id);
              
              // Create product object from cart item
              const product: Product = {
                id: cartItem.productId,
                title: cartItem.productTitle || '',
                selectedFormat: {
                  id: cartItem.productFormatId,
                  formatType: cartItem.formatType || '',
                  price: cartItem.price || 0,
                  finalPrice: cartItem.finalPrice || cartItem.price || 0,
                }
              } as unknown as Product;
              
              items.push({ product, quantity: cartItem.quantity });
            }
            
            // Upload localStorage items that aren't in database
            for (const localItem of currentItems) {
              const formatId = (localItem.product as any).selectedFormat?.id || localItem.product.id;
              const key = `${localItem.product.id}_${formatId}`;
              
              if (!cartItemIds.has(key)) {
                try {
                  const response = await cartApi.addItem({
                    productId: localItem.product.id,
                    productFormatId: formatId,
                    quantity: localItem.quantity
                  });
                  if (response.data.isSucceeded && response.data.data) {
                    cartItemIds.set(key, response.data.data.id);
                    // Item already added to items array above via sync, so no need to add again
                  }
                } catch (error) {
                  // Continue with other items
                }
              }
            }
            
            // Reload cart from database after uploading localStorage items
            const finalResponse = await cartApi.getCart();
            if (finalResponse.data.isSucceeded && finalResponse.data.data) {
              const finalCart = finalResponse.data.data;
              const finalItems: CartItem[] = [];
              const finalCartItemIds = new Map<string, string>();
              
              for (const cartItem of finalCart.cartItems) {
                const productId = cartItem.productId;
                const formatId = cartItem.productFormatId;
                const key = `${productId}_${formatId}`;
                finalCartItemIds.set(key, cartItem.id);
                
                const product: Product = {
                  id: cartItem.productId,
                  title: cartItem.productTitle || '',
                  selectedFormat: {
                    id: cartItem.productFormatId,
                    formatType: cartItem.formatType || '',
                    price: cartItem.price || 0,
                    finalPrice: cartItem.finalPrice || cartItem.price || 0,
                  }
                } as unknown as Product;
                
                finalItems.push({ product, quantity: cartItem.quantity });
              }
              
              set({ items: finalItems, cartItemIds: finalCartItemIds, isLoading: false });
            } else {
              set({ items, cartItemIds, isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },
      addItem: async (product, quantity = 1) => {
        const items = get().items;
        const formatId = (product as any).selectedFormat?.id || product.id;
        const key = `${product.id}_${formatId}`;
        const existingCartItemId = get().cartItemIds.get(key);
        
        try {
          if (existingCartItemId) {
            // Update existing item via API
            const currentItem = items.find(item => 
              item.product.id === product.id && 
              (item.product as any).selectedFormat?.id === formatId
            );
            const newQuantity = (currentItem?.quantity || 0) + quantity;
            await cartApi.updateItem({ cartItemId: existingCartItemId, quantity: newQuantity });
          } else {
            // Add new item via API
            const response = await cartApi.addItem({
              productId: product.id,
              productFormatId: formatId,
              quantity
            });
            if (response.data.isSucceeded && response.data.data) {
              get().cartItemIds.set(key, response.data.data.id);
            }
          }
          
          // Update local state
          const existingItem = items.find(item => 
            item.product.id === product.id && 
            (item.product as any).selectedFormat?.id === formatId
          );
          
          if (existingItem) {
            set({
              items: items.map(item =>
                item.product.id === product.id && (item.product as any).selectedFormat?.id === formatId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            });
          } else {
            set({
              items: [...items, { product, quantity }]
            });
          }
        } catch (error) {
          // Fallback to local storage only
          const existingItem = items.find(item => item.product.id === product.id);
          if (existingItem) {
            set({
              items: items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            });
          } else {
            set({
              items: [...items, { product, quantity }]
            });
          }
        }
      },
      removeItem: async (productId) => {
        const items = get().items;
        const itemToRemove = items.find(item => item.product.id === productId);
        
        if (itemToRemove) {
          const formatId = (itemToRemove.product as any).selectedFormat?.id || itemToRemove.product.id;
          const key = `${productId}_${formatId}`;
          const cartItemId = get().cartItemIds.get(key);
          
          try {
            if (cartItemId) {
              await cartApi.removeItem(cartItemId);
              get().cartItemIds.delete(key);
            }
          } catch (error) {
            // Continue with local removal
          }
        }
        
        set({
          items: items.filter(item => item.product.id !== productId)
        });
      },
      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }
        
        const items = get().items;
        const item = items.find(item => item.product.id === productId);
        
        if (item) {
          const formatId = (item.product as any).selectedFormat?.id || item.product.id;
          const key = `${productId}_${formatId}`;
          const cartItemId = get().cartItemIds.get(key);
          
          try {
            if (cartItemId) {
              await cartApi.updateItem({ cartItemId, quantity });
            }
          } catch (error) {
            // Continue with local update
          }
        }
        
        set({
          items: items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        });
      },
      clearCart: async () => {
        try {
          await cartApi.clearCart();
          get().cartItemIds.clear();
        } catch (error) {
          // Continue with local clear
        }
        set({ items: [] });
      },
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const productPrice = (item.product as any).price || (item.product as any).selectedFormat?.finalPrice || (item.product as any).selectedFormat?.price || 0;
          return total + (productPrice * item.quantity);
        }, 0);
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items, cartItemIds: Array.from(state.cartItemIds.entries()) }),
      merge: (persistedState: any, currentState) => {
        const cartItemIds = new Map(persistedState?.cartItemIds || []);
        return { ...currentState, ...persistedState, cartItemIds };
      },
    }
  )
);

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => {
        set((state) => ({ isDark: !state.isDark }));
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
