import { defineStore } from 'pinia'
import type { ProductBundle } from '~/types/product'

export interface CartItem {
  product: ProductBundle;
  variants: Record<number, string>; 
  quantity: number;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
  getters: {
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0)
    },
    totalPrice: (state) => {
      return state.items.reduce((total, item) => total + item.product.price * item.quantity, 0)
    },
  },
  actions: {
    updateQuantity(productId: number, newQuantity: number){
      const existingItem = this.items.find((item)=>item.product.id == productId)

      if(existingItem) {
        if(newQuantity <= 0)this.removeProduct(productId)
        else{
          existingItem.quantity = newQuantity
        }
      }
    },
    addProduct(product: ProductBundle, variants: Record<number, string>, quantity: number) {
      const existingItem = this.items.find(item => item.product.id === product.id);
      if (existingItem) existingItem.quantity += quantity;
      else this.items.push({ product, variants, quantity });
    },
    removeProduct(productId: number) {
      this.items = this.items.filter(item => item.product.id !== productId);
    },
  },
})