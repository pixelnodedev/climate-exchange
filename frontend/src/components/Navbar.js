import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, User, Wind, Menu, X, Plus, Package, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="glass-nav sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="navbar-logo">
            <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center transition-all duration-200 group-hover:bg-sky-600 group-hover:shadow-lg group-hover:shadow-sky-500/30">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 font-['Outfit'] tracking-tight hidden sm:block">
              Climate<span className="text-sky-500">Exchange</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/catalog" data-testid="nav-catalog">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm">
                Каталог
              </Button>
            </Link>
            {user && (
              <Link to="/sell" data-testid="nav-sell">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm">
                  <Plus className="w-4 h-4 mr-1" /> Продать
                </Button>
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/cart" data-testid="nav-cart">
                  <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-sky-600 hover:bg-sky-50">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-sky-500 hover:bg-sky-500 text-white border-0" data-testid="cart-count-badge">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100" data-testid="user-menu-trigger">
                      <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-sky-600" />
                      </div>
                      <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/profile")} data-testid="nav-profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" /> Мой профиль
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile?tab=listings")} data-testid="nav-my-listings" className="cursor-pointer">
                      <Package className="w-4 h-4 mr-2" /> Мои объявления
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile?tab=orders")} data-testid="nav-my-orders" className="cursor-pointer">
                      <ShoppingCart className="w-4 h-4 mr-2" /> Мои заказы
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="nav-logout" className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="w-4 h-4 mr-2" /> Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" data-testid="nav-login">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium text-sm">
                    Войти
                  </Button>
                </Link>
                <Link to="/register" data-testid="nav-register">
                  <Button className="bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow-md hover:shadow-sky-500/20 transition-all duration-200">
                    Зарегистрироваться
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden text-slate-600" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-toggle">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 pt-3 space-y-1" data-testid="mobile-menu">
            <Link to="/catalog" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium">
              Каталог
            </Link>
            {user && (
              <Link to="/sell" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium">
                Продать
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
