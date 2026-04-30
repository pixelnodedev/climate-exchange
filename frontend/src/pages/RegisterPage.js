import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wind, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать не менее 6 символов");
      return;
    }
    setLoading(true);
    const result = await register(email, password, name, phone);
    setLoading(false);
    if (result.success) {
      toast.success("Аккаунт создан! Добро пожаловать на ClimateExchange.");
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 px-4 py-12" data-testid="register-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center mx-auto mb-4">
            <Wind className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Outfit']">Создать аккаунт</h1>
          <p className="text-sm text-slate-500 mt-1">Присоединяйтесь к ClimateExchange как покупатель или продавец</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm" data-testid="register-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">Полное имя</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="register-name-input" />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="register-email-input" />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Телефон (необязательно)</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="register-phone-input" />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Пароль</Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" required className="h-10 rounded-lg border-slate-200 pr-10" data-testid="register-password-input" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Подтвердите пароль</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" required className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="register-confirm-password-input" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:shadow-sky-500/20 transition-all duration-200" data-testid="register-submit-button">
              {loading ? "Создание аккаунта..." : "Создать аккаунт"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-sky-600 hover:text-sky-700 font-medium" data-testid="register-login-link">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
