import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, ArrowLeft, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${API}/api/products/${id}`);
        setProduct(data);
      } catch {
        navigate("/catalog");
      }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Пожалуйста, войдите, чтобы добавить товар в корзину");
      navigate("/login");
      return;
    }
    setAdding(true);
    const result = await addToCart(product.id);
    setAdding(false);
    if (result.success) {
      toast.success("Добавлено в корзину!");
    } else {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Загрузка...</div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images.map((img) => `${API}${img}`)
    : ["https://images.unsplash.com/photo-1631567091196-a5b0e3740bcd?w=800&fit=crop"];

  const typeLabels = { split: "Сплит-система", portable: "Портативный", industrial: "Промышленный" };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/catalog" className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 font-medium" data-testid="back-to-catalog">
            <ArrowLeft className="w-4 h-4 mr-1" /> Назад к каталогу
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div data-testid="product-image-gallery">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm">
              <img
                src={images[activeImage]}
                alt={product.title}
                className="w-full h-full object-contain"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1631567091196-a5b0e3740bcd?w=800&fit=crop"; }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-all"
                    data-testid="prev-image-button"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-all"
                    data-testid="next-image-button"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === activeImage ? "border-sky-500 shadow-md" : "border-slate-100 hover:border-slate-300"}`}
                    data-testid={`thumbnail-${i}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div data-testid="product-details">
            <div className="flex gap-2 mb-3">
              <Badge className={`${product.condition === "new" ? "bg-sky-100 text-sky-800 hover:bg-sky-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"} rounded-full text-xs font-medium border-0`}>
                {product.condition === "new" ? "Новый" : "Б/у"}
              </Badge>
              <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 rounded-full text-xs font-medium border-0">
                {typeLabels[product.ac_type] || product.ac_type}
              </Badge>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-1">{product.brand}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight mb-4" data-testid="product-title">
              {product.title}
            </h1>

            <div className="text-3xl font-bold text-slate-900 mb-6" data-testid="product-price">
              ${product.price?.toLocaleString()}
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Описание</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap" data-testid="product-description">
                {product.description}
              </p>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                <User className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900" data-testid="seller-name">{product.seller_name}</p>
                <p className="text-xs text-slate-500">Продавец</p>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full h-12 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium text-base shadow-md hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 btn-primary-glow"
              data-testid="add-to-cart-button"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {adding ? "Добавление..." : "Добавить в корзину"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
