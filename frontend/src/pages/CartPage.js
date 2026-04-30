import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, updateCartItem, removeFromCart, fetchCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const getItemWord = (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return "товар";
    if ([2, 3, 4].includes(n % 10) && !(n % 100 >= 12 && n % 100 <= 14)) return "товара";
    return "товаров";
  };

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Загрузка...</div></div>;
  if (!user) return null;

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      await axios.post(`${API}/api/orders`, {}, { withCredentials: true });
      clearCart();
      await fetchCart();
      toast.success("Заказ успешно оформлен!");
      navigate("/profile?tab=orders");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Не удалось оформить заказ");
    }
    setPlacingOrder(false);
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="cart-empty">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Ваша корзина пуста</h2>
          <p className="text-sm text-slate-500 mb-4">Просмотрите товары и добавьте их в корзину</p>
          <Link to="/catalog">
              <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium" data-testid="browse-products-button">
              Просмотреть товары <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="cart-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/catalog" className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Продолжить покупки
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight mb-6">
          Shopping Cart ({cart.items.length} {getItemWord(cart.items.length)})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4" data-testid="cart-items-list">
            {cart.items.map((item) => {
              const product = item.product;
              const image = product?.images?.[0] ? `${API}${product.images[0]}` : "https://images.unsplash.com/photo-1631567091196-a5b0e3740bcd?w=200&fit=crop";

              return (
                <div key={item.product_id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex gap-4" data-testid={`cart-item-${item.product_id}`}>
                  <Link to={`/product/${item.product_id}`} className="w-24 h-24 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                    <img src={image} alt={product?.title} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product_id}`} className="text-sm font-semibold text-slate-900 hover:text-sky-600 line-clamp-1 transition-colors">
                      {product?.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{product?.brand} &middot; {product?.condition === "new" ? "Новый" : "Б/у"}</p>
                    <p className="text-base font-bold text-slate-900 mt-1">${product?.price?.toLocaleString()}</p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md border-slate-200"
                          onClick={() => updateCartItem(item.product_id, item.quantity - 1)}
                          data-testid={`decrease-qty-${item.product_id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium text-slate-700" data-testid={`qty-${item.product_id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md border-slate-200"
                          onClick={() => updateCartItem(item.product_id, item.quantity + 1)}
                          data-testid={`increase-qty-${item.product_id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                        data-testid={`remove-item-${item.product_id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 sticky top-24" data-testid="order-summary">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Сводка заказа</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Промежуточный итог</span>
                  <span>${cart.total?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Доставка</span>
                  <span className="text-sky-600 font-medium">Бесплатно</span>
                </div>
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-slate-900 text-base">
                    <span>Итого</span>
                    <span data-testid="cart-total">${cart.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full h-11 mt-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200"
                data-testid="place-order-button"
              >
                {placingOrder ? "Оформление заказа..." : "Оформить заказ"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
