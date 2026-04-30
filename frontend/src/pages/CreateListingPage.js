import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

export default function CreateListingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    brand: "",
    ac_type: "split",
    condition: "new",
    price: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Загрузка...</div></div>;
  if (!user) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error("Максимум 5 изображений");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.brand || !form.price) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      let imageUrls = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append("files", img));
        const uploadRes = await axios.post(`${API}/api/upload`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrls = uploadRes.data.files.map((f) => f.url);
      }

      await axios.post(
        `${API}/api/products`,
        { ...form, price: parseFloat(form.price), images: imageUrls },
        { withCredentials: true }
      );

      toast.success("Объявление успешно создано!");
      navigate("/profile?tab=listings");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Не удалось создать объявление");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="create-listing-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight mb-2">
          Создать новое объявление
        </h1>
        <p className="text-sm text-slate-500 mb-8">Разместите объявление о продаже кондиционера</p>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="create-listing-form">
          {/* Image Upload */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <Label className="text-sm font-semibold text-slate-900 mb-3 block">Фотографии (до 5)</Label>
            <div className="flex flex-wrap gap-3">
              {previews.map((preview, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`remove-image-${i}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all" data-testid="upload-image-button">
                  <Plus className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 mt-1">Добавить фото</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Заголовок *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: Samsung Split AC 1.5 Ton Inverter"
                required
                className="mt-1.5 h-10 rounded-lg border-slate-200"
                data-testid="listing-title-input"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Описание *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Опишите ваш кондиционер - модель, мощность, класс энергии, возраст и т.д."
                rows={4}
                required
                className="mt-1.5 rounded-lg border-slate-200"
                data-testid="listing-description-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Бренд *</Label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Например: Samsung, Daikin, LG"
                  required
                  className="mt-1.5 h-10 rounded-lg border-slate-200"
                  data-testid="listing-brand-input"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Цена ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  required
                  className="mt-1.5 h-10 rounded-lg border-slate-200"
                  data-testid="listing-price-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Type</Label>
                <Select value={form.ac_type} onValueChange={(v) => setForm({ ...form, ac_type: v })}>
                  <SelectTrigger className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="listing-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="split">Сплит-система</SelectItem>
                    <SelectItem value="portable">Портативный</SelectItem>
                    <SelectItem value="industrial">Промышленный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Condition</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="listing-condition-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новый</SelectItem>
                    <SelectItem value="used">Б/у</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200"
            data-testid="create-listing-submit"
          >
            <Upload className="w-4 h-4 mr-2" />
            {loading ? "Публикация..." : "Опубликовать объявление"}
          </Button>
        </form>
      </div>
    </div>
  );
}
