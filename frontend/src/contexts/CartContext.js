import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const API = process.env.REACT_APP_BACKEND_URL;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [], total: 0 }); setCartCount(0); return; }
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/cart`, { withCredentials: true });
      setCart(data);
      setCartCount(data.items?.reduce((sum, i) => sum + i.quantity, 0) || 0);
    } catch {
      setCart({ items: [], total: 0 });
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(`${API}/api/cart/add`, { product_id: productId, quantity }, { withCredentials: true });
      await fetchCart();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.detail || "Не удалось добавить в корзину" };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      await axios.put(`${API}/api/cart/update`, { product_id: productId, quantity }, { withCredentials: true });
      await fetchCart();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.detail || "Не удалось обновить корзину" };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.post(`${API}/api/cart/remove`, { product_id: productId }, { withCredentials: true });
      await fetchCart();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.detail || "Не удалось удалить из корзины" };
    }
  };

  const clearCart = () => {
    setCart({ items: [], total: 0 });
    setCartCount(0);
  };

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, addToCart, updateCartItem, removeFromCart, fetchCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
