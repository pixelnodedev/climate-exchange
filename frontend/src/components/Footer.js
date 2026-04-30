import { Wind } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                <Wind className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white font-['Outfit']">Climate<span className="text-sky-400">Exchange</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Премиум-площадка для систем кондиционирования. Покупайте и продавайте сплит-системы, портативные и промышленные кондиционеры.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Быстрые ссылки</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/catalog" className="hover:text-sky-400 transition-colors">Просмотреть товары</Link></li>
              <li><Link to="/sell" className="hover:text-sky-400 transition-colors">Продать кондиционер</Link></li>
              <li><Link to="/catalog?ac_type=split" className="hover:text-sky-400 transition-colors">Сплит-системы</Link></li>
              <li><Link to="/catalog?ac_type=portable" className="hover:text-sky-400 transition-colors">Портативные кондиционеры</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Поддержка</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-sky-400 transition-colors cursor-pointer">Центр помощи</span></li>
              <li><span className="hover:text-sky-400 transition-colors cursor-pointer">Связаться с нами</span></li>
              <li><span className="hover:text-sky-400 transition-colors cursor-pointer">Условия использования</span></li>
              <li><span className="hover:text-sky-400 transition-colors cursor-pointer">Политика конфиденциальности</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ClimateExchange. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
