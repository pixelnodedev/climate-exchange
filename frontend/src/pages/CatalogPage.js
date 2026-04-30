import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";

const API = process.env.REACT_APP_BACKEND_URL;

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    brand: searchParams.get("brand") || "",
    ac_type: searchParams.get("ac_type") || "",
    condition: searchParams.get("condition") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    page: parseInt(searchParams.get("page") || "1"),
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.ac_type) params.set("ac_type", filters.ac_type);
      if (filters.condition) params.set("condition", filters.condition);
      if (filters.min_price) params.set("min_price", filters.min_price);
      if (filters.max_price) params.set("max_price", filters.max_price);
      params.set("page", filters.page.toString());
      params.set("limit", "12");

      const { data } = await axios.get(`${API}/api/products?${params.toString()}`);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    axios.get(`${API}/api/brands`).then(r => setBrands(r.data.brands || [])).catch(() => {});
  }, []);

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params.set(k, v.toString()); });
    setSearchParams(params);
  };

  const clearFilters = () => {
    const cleared = { search: "", brand: "", ac_type: "", condition: "", min_price: "", max_price: "", page: 1 };
    setFilters(cleared);
    setSearchParams({});
  };

  const hasActiveFilters = filters.brand || filters.ac_type || filters.condition || filters.min_price || filters.max_price;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="catalog-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight">
                Каталог кондиционеров
              </h1>
              <p className="text-sm text-slate-500 mt-1">{total} товаров</p>
            </div>
              <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden rounded-lg border-slate-200 text-sm"
              data-testid="toggle-filters-button"
            >
              <SlidersHorizontal className="w-4 h-4 mr-1" /> Filters
            </Button>
          </div>

          {/* Search */}
          <div className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                placeholder="Поиск товаров..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10 h-10 rounded-lg border-slate-200 text-sm"
                data-testid="catalog-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`w-64 shrink-0 ${showFilters ? "block" : "hidden"} md:block`} data-testid="filter-sidebar">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Фильтры</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-sky-600 hover:text-sky-700 h-auto p-0" data-testid="clear-filters-button">
                    <X className="w-3 h-3 mr-1" /> Очистить
                  </Button>
                )}
              </div>

              <div className="space-y-5">
                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Тип</label>
                  <Select value={filters.ac_type} onValueChange={(v) => updateFilter("ac_type", v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9 rounded-lg border-slate-200 text-sm" data-testid="filter-type-select">
                      <SelectValue placeholder="Все типы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="split">Сплит-система</SelectItem>
                      <SelectItem value="portable">Портативный</SelectItem>
                      <SelectItem value="industrial">Промышленный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Состояние</label>
                  <Select value={filters.condition} onValueChange={(v) => updateFilter("condition", v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9 rounded-lg border-slate-200 text-sm" data-testid="filter-condition-select">
                      <SelectValue placeholder="Любое состояние" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Любое состояние</SelectItem>
                      <SelectItem value="new">Новый</SelectItem>
                      <SelectItem value="used">Б/у</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Бренд</label>
                  <Select value={filters.brand} onValueChange={(v) => updateFilter("brand", v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9 rounded-lg border-slate-200 text-sm" data-testid="filter-brand-select">
                      <SelectValue placeholder="Все бренды" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все бренды</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Диапазон цен</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Мин"
                      value={filters.min_price}
                      onChange={(e) => updateFilter("min_price", e.target.value)}
                      className="h-9 rounded-lg border-slate-200 text-sm"
                      data-testid="filter-min-price"
                    />
                    <Input
                      type="number"
                      placeholder="Макс"
                      value={filters.max_price}
                      onChange={(e) => updateFilter("max_price", e.target.value)}
                      className="h-9 rounded-lg border-slate-200 text-sm"
                      data-testid="filter-max-price"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 animate-pulse">
                    <div className="aspect-[4/3] bg-slate-100 rounded-t-xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-5 bg-slate-100 rounded w-20 mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16" data-testid="no-products-message">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">Товары не найдены</h3>
                <p className="text-sm text-slate-500">Попробуйте изменить фильтры или запрос</p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-lg text-sm" data-testid="clear-filters-empty">
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="product-grid">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8" data-testid="pagination">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page <= 1}
                      onClick={() => updateFilter("page", filters.page - 1)}
                      className="rounded-lg text-sm"
                      data-testid="prev-page-button"
                    >
                      Назад
                    </Button>
                    <span className="text-sm text-slate-500 px-3">
                      Страница {filters.page} из {pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page >= pages}
                      onClick={() => updateFilter("page", filters.page + 1)}
                      className="rounded-lg text-sm"
                      data-testid="next-page-button"
                    >
                      Вперед
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
