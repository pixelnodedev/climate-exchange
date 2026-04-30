import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Package, ShoppingCart, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "listings");
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchListings = async () => {
      try {
        const { data } = await axios.get(`${API}/api/profile/listings`, { withCredentials: true });
        setListings(data.listings || []);
      } catch { /* ignore */ }
      setLoadingListings(false);
    };
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(`${API}/api/orders`, { withCredentials: true });
        setOrders(data.orders || []);
      } catch { /* ignore */ }
      setLoadingOrders(false);
    };
    fetchListings();
    fetchOrders();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Загрузка...</div></div>;
  if (!user) return null;

  const handleDelete = async (productId) => {
    if (!window.confirm("Вы уверены, что хотите удалить это объявление?")) return;
    try {
      await axios.delete(`${API}/api/products/${productId}`, { withCredentials: true });
      setListings((prev) => prev.filter((l) => l.id !== productId));
      toast.success("Объявление удалено");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Не удалось удалить");
    }
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-sky-100 text-sky-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    pending: "В ожидании",
    confirmed: "Подтверждён",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменён",
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="profile-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-8 flex items-center gap-4" data-testid="profile-header">
          <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center">
            <User className="w-7 h-7 text-sky-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-['Outfit']" data-testid="profile-name">{user.name}</h1>
            <p className="text-sm text-slate-500" data-testid="profile-email">{user.email}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-100 shadow-sm rounded-lg mb-6 h-10" data-testid="profile-tabs">
            <TabsTrigger value="listings" className="rounded-md data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 text-sm font-medium px-4" data-testid="tab-listings">
              <Package className="w-4 h-4 mr-1.5" /> Мои объявления
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-md data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 text-sm font-medium px-4" data-testid="tab-orders">
              <ShoppingCart className="w-4 h-4 mr-1.5" /> Мои заказы
            </TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings" data-testid="listings-tab-content">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900 font-['Outfit']">Ваши объявления ({listings.length})</h2>
              <Link to="/sell">
                <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium text-sm shadow-sm" data-testid="new-listing-button">
                  <Plus className="w-4 h-4 mr-1" /> New Listing
                </Button>
              </Link>
            </div>

            {loadingListings ? (
              <div className="text-center py-8 text-slate-400">Загрузка...</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Пока нет объявлений</h3>
                <p className="text-xs text-slate-500 mb-4">Начните продавать ваши кондиционеры</p>
                <Link to="/sell">
                  <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm">
                    Создать объявление
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => {
                  const image = listing.images?.[0] ? `${API}${listing.images[0]}` : "https://images.unsplash.com/photo-1631567091196-a5b0e3740bcd?w=200&fit=crop";
                  return (
                    <div key={listing.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex gap-4 items-center" data-testid={`listing-${listing.id}`}>
                      <Link to={`/product/${listing.id}`} className="w-20 h-20 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                        <img src={image} alt={listing.title} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${listing.id}`} className="text-sm font-semibold text-slate-900 hover:text-sky-600 line-clamp-1">
                          {listing.title}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">{listing.brand} &middot; {listing.condition === "new" ? "Новый" : "Б/у"}</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">${listing.price?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/edit/${listing.id}`)} className="rounded-lg text-sm h-8" data-testid={`edit-listing-${listing.id}`}>
                          <Edit className="w-3.5 h-3.5 mr-1" /> Редактировать
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(listing.id)} className="rounded-lg text-sm h-8 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" data-testid={`delete-listing-${listing.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" data-testid="orders-tab-content">
            <h2 className="text-lg font-semibold text-slate-900 font-['Outfit'] mb-4">Ваши заказы ({orders.length})</h2>

            {loadingOrders ? (
              <div className="text-center py-8 text-slate-400">Загрузка...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Пока нет заказов</h3>
                <p className="text-xs text-slate-500 mb-4">Просмотрите товары и оформите первый заказ</p>
                <Link to="/catalog">
                  <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm">
                    Просмотреть товары
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5" data-testid={`order-${order.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-slate-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[11px] text-slate-400">{new Date(order.created_at).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${statusColors[order.status] || "bg-slate-100 text-slate-700"} rounded-full text-[11px] font-medium border-0 capitalize`}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                        <span className="text-base font-bold text-slate-900">${order.total?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5 border-t border-slate-50 first:border-0">
                          {item.image && (
                            <img src={`${API}${item.image}`} alt="" className="w-10 h-10 rounded-md object-cover bg-slate-50" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 line-clamp-1">{item.title}</p>
                            <p className="text-xs text-slate-400">Кол-во: {item.quantity} &middot; ${item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
