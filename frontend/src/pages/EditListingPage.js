import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Save, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

export default function EditListingPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", brand: "", ac_type: "split", condition: "new", price: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${API}/api/products/${id}`);
        setForm({
          title: data.title,
          description: data.description,
          brand: data.brand,
          ac_type: data.ac_type,
          condition: data.condition,
          price: data.price.toString(),
        });
        setExistingImages(data.images || []);
      } catch {
        navigate("/profile?tab=listings");
      }
      setFetching(false);
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Загрузка...</div></div>;
  if (!user) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const total = existingImages.length + newImages.length + files.length;
    if (total > 5) { toast.error("Максимум 5 изображений"); return; }
    setNewImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setNewPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index) => setExistingImages((prev) => prev.filter((_, i) => i !== index));
  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let uploadedUrls = [];
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((img) => formData.append("files", img));
        const uploadRes = await axios.post(`${API}/api/upload`, formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
        uploadedUrls = uploadRes.data.files.map((f) => f.url);
      }
      const allImages = [...existingImages, ...uploadedUrls];
      await axios.put(`${API}/api/products/${id}`, { ...form, price: parseFloat(form.price), images: allImages }, { withCredentials: true });
      toast.success("Объявление обновлено!");
      navigate("/profile?tab=listings");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Не удалось обновить объявление");
    }
    setLoading(false);
  };

  if (fetching) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Загрузка...</div></div>;

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="edit-listing-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight mb-2">Редактировать объявление</h1>
        <p className="text-sm text-slate-500 mb-8">Обновите объявление о кондиционере</p>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="edit-listing-form">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <Label className="text-sm font-semibold text-slate-900 mb-3 block">Photos (up to 5)</Label>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((url, i) => (
                <div key={`existing-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={`${API}${url}`} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newPreviews.map((preview, i) => (
                <div key={`new-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {totalImages < 5 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all">
                  <Plus className="w-5 h-5 text-slate-400" /><span className="text-[10px] text-slate-400 mt-1">Добавить фото</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Заголовок *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="edit-title-input" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Описание *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required className="mt-1.5 rounded-lg border-slate-200" data-testid="edit-description-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Бренд *</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="edit-brand-input" />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Цена ($) *</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="edit-price-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Тип</Label>
                <Select value={form.ac_type} onValueChange={(v) => setForm({ ...form, ac_type: v })}>
                  <SelectTrigger className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="edit-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="split">Сплит-система</SelectItem><SelectItem value="portable">Портативный</SelectItem><SelectItem value="industrial">Промышленный</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Состояние</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger className="mt-1.5 h-10 rounded-lg border-slate-200" data-testid="edit-condition-select"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="new">Новый</SelectItem><SelectItem value="used">Б/у</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200" data-testid="edit-listing-submit">
            <Save className="w-4 h-4 mr-2" /> {loading ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </form>
      </div>
    </div>
  );
}
