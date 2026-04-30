import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Snowflake, Shield, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.REACT_APP_BACKEND_URL;

export default function HomePage() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, statsRes] = await Promise.all([
          axios.get(`${API}/api/products?limit=6`),
          axios.get(`${API}/api/stats`),
        ]);
        setFeatured(prodRes.data.products || []);
        setStats(statsRes.data);
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/afe97433-58e4-4957-8e25-88b8c4574108/images/1d57196f141452b7d5e555497aa27030b28b623aeebea54dec02c0a08489799f.png"
            alt="Modern room with AC"
            className="w-full h-full object-cover"
          />
          <div className="hero-gradient absolute inset-0" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl animate-fade-in-up">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300 mb-4">Премиум-рынок кондиционеров</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6 font-['Outfit']">
              Покупайте и продавайте кондиционеры с уверенностью
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
              Найдите лучшие предложения на сплит-системы, портативные и промышленные кондиционеры от проверенных продавцов.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-md" data-testid="hero-search-form">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Поиск кондиционеров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-white/95 border-0 rounded-lg shadow-lg text-sm"
                  data-testid="hero-search-input"
                />
              </div>
              <Button type="submit" className="h-11 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-lg font-medium" data-testid="hero-search-button">
                Поиск
              </Button>
            </form>

            <div className="flex items-center gap-4">
              <Link to="/catalog" data-testid="hero-browse-button">
                <Button className="bg-sky-500 hover:bg-sky-600 text-white h-11 px-6 rounded-lg font-medium shadow-lg hover:shadow-xl hover:shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 btn-primary-glow">
                  Просмотреть всё <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {!user && (
                <Link to="/register" data-testid="hero-sell-button">
                  <Button variant="outline" className="h-11 px-6 rounded-lg font-medium border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-200">
                    Начать продажу
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div data-testid="stat-products">
              <p className="text-2xl font-bold text-slate-900 font-['Outfit']">{stats.total_products || 0}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Товары</p>
            </div>
            <div data-testid="stat-users">
              <p className="text-2xl font-bold text-slate-900 font-['Outfit']">{stats.total_users || 0}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Пользователи</p>
            </div>
            <div data-testid="stat-orders">
              <p className="text-2xl font-bold text-slate-900 font-['Outfit']">{stats.total_orders || 0}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Заказы</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-2">Почему мы</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight font-['Outfit']">
              Удобный способ торговли кондиционерами
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Snowflake, title: "Проверенное качество", desc: "Каждое объявление проверяется для точного описания и честного ценообразования." },
              { icon: Shield, title: "Безопасные транзакции", desc: "Покупайте с уверенностью — ваши покупки защищены." },
              { icon: TrendingUp, title: "Лучшие цены", desc: "Сравнивайте цены у продавцов и находите выгодные предложения." },
            ].map((f, i) => (
              <div key={i} className={`bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-1 animate-fade-in-up stagger-${i + 1}`}>
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-6 h-6 text-sky-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 font-['Outfit']">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-16" data-testid="featured-products-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-1">Рекомендуемые</p>
                <h2 className="text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight font-['Outfit']">
                  Последние объявления
                </h2>
              </div>
              <Link to="/catalog" data-testid="view-all-link">
                <Button variant="outline" className="rounded-lg border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-200 font-medium text-sm">
                  Посмотреть всё <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Browse */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-2">Категории</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight font-['Outfit']">
              Покупайте по типу
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { type: "split", label: "Настенные сплит-системы", img: "https://images.unsplash.com/photo-1761330440311-16e160cad236?w=600&fit=crop", desc: "Настенные блоки для дома и офиса" },
              { type: "portable", label: "Портативные кондиционеры", img: "https://images.unsplash.com/photo-1771371600724-11d064eed375?w=600&fit=crop", desc: "Переносное охлаждение там, где нужно" },
              { type: "industrial", label: "Промышленные установки", img: "https://images.unsplash.com/photo-1761115435501-bebf019aba54?w=600&fit=crop", desc: "Мощные HVAC для больших помещений" },
            ].map((cat) => (
              <Link
                key={cat.type}
                to={`/catalog?ac_type=${cat.type}`}
                className="group relative rounded-xl overflow-hidden aspect-[16/10] shadow-sm hover:shadow-md transition-all duration-300"
                data-testid={`category-${cat.type}`}
              >
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-lg font-semibold text-white font-['Outfit'] mb-1">{cat.label}</h3>
                  <p className="text-xs text-slate-300">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-sky-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-['Outfit'] mb-4">
            Готовы начать торговлю?
          </h2>
          <p className="text-sky-100 mb-8 max-w-md mx-auto">
            Присоединяйтесь к тысячам покупателей и продавцов на ClimateExchange уже сегодня.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/catalog">
              <Button className="bg-white text-sky-600 hover:bg-sky-50 h-11 px-6 rounded-lg font-medium shadow-lg transition-all duration-200">
                Просмотреть товары
              </Button>
            </Link>
            {!user && (
              <Link to="/register">
                <Button className="bg-sky-600 hover:bg-sky-700 text-white h-11 px-6 rounded-lg font-medium border border-sky-400 shadow-lg transition-all duration-200">
                  Создать учётную запись
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
