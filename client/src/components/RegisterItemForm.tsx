import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";

const API_BASE = (import.meta?.env?.VITE_API_BASE as string) ?? "http://localhost:4000";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  status: string;
  images: string[];
};

export function RegisterItemForm({ onSuccess, showTitle = true }: { onSuccess?: (product?: Product) => void; showTitle?: boolean }) {
  const [form, setForm] = useState({ name: "", category: "", description: "", price: "" });
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        price: parseFloat(form.price || "0"),
        images,
      };
      const res = await axios.post(`${API_BASE}/api/register`, payload);
      const product: Product | undefined = res.data?.product;
      onSuccess?.(product);
      setForm({ name: "", category: "", description: "", price: "" });
      setImages([]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Register error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-0">
      {showTitle && <h2 className="text-2xl font-bold mb-6">Register New Item</h2>}
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reg-name">Item Name</Label>
            <Input
              id="reg-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., USB-C Cable 2m"
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-category">Category</Label>
            <Input
              id="reg-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g., Electronics"
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-description">Description</Label>
            <Textarea
              id="reg-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the item"
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-price">Price (USD)</Label>
            <Input
              id="reg-price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-images">Product Images</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  id="reg-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("reg-images")?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} alt={`Upload ${index + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Registering..." : "Register Item"}
        </Button>
      </form>
    </div>
  );
}
