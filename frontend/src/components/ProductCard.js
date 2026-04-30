import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const mainImage = product.images && product.images.length > 0
    ? `${API}${product.images[0]}`
    : "https://images.unsplash.com/photo-1631567091196-a5b0e3740bcd?w=400&fit=crop";

  const typeLabels = { split: "Сплит-система", portable: "Портативный", industrial: "Промышленный" };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Пожалуйста, войдите, чтобы добавить товар в корзину");
      return;
    }
    const result = await addToCart(product.id);
    if (result.success) {
      toast.success("Добавлено в корзину!");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="block product-card" data-testid={`product-card-${product.id}`}>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1631567091196-a5b0e3740bcd?w=400&fit=crop"; }}
          />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className={`${product.condition === "new" ? "bg-sky-100 text-sky-800 hover:bg-sky-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"} rounded-full text-[11px] font-medium border-0 shadow-sm`}>
                {product.condition === "new" ? "Новый" : "Б/у"}
            </Badge>
            <Badge className="bg-white/90 backdrop-blur-sm text-slate-600 hover:bg-white/90 rounded-full text-[11px] font-medium border-0 shadow-sm">
              {typeLabels[product.ac_type] || product.ac_type}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <p className="text-xs font-medium text-sky-600 uppercase tracking-wide mb-1">{product.brand}</p>
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2 leading-snug">{product.title}</h3>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-lg font-bold text-slate-900">${product.price?.toLocaleString()}</span>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg h-8 px-3 text-xs font-medium shadow-sm hover:shadow-md hover:shadow-sky-500/20 transition-all duration-200"
              data-testid={`add-to-cart-${product.id}`}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Добавить
            </Button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">от {product.seller_name}</p>
        </div>
      </div>
    </Link>
  );
}
