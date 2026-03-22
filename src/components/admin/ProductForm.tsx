
"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Sparkles, Loader2, Save, ShoppingBag, ListPlus, Image as ImageIcon, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const CATEGORY_GROUPS = [
  {
    label: "Digital & Tech",
    items: ["Laptops", "Mobiles", "Audio", "Gaming", "Electronics"]
  },
  {
    label: "Style & Trend",
    items: ["Men's Clothing", "Women's Clothing", "Accessories", "Watches", "Fashion"]
  },
  {
    label: "Home & Life",
    items: ["Appliances", "Furniture", "Decor", "Garden", "Home & Kitchen"]
  },
  {
    label: "Beauty & Wellness",
    items: ["Skincare", "Makeup", "Haircare", "Personal Care", "Beauty"]
  },
  {
    label: "Media",
    items: ["Books", "Movies", "Music"]
  }
];

export function ProductForm({ initialData }: { initialData?: any }) {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    originalPrice: initialData?.originalPrice?.toString() || '',
    category: initialData?.category || '',
    stock: initialData?.stock?.toString() || '',
    features: Array.isArray(initialData?.features) ? initialData.features.join(', ') : (initialData?.features || ''),
    imageUrls: (() => {
      const urls = Array.isArray(initialData?.imageUrls)
        ? initialData.imageUrls
        : [initialData?.imageUrl || ""];
      return [...urls, "", "", ""].slice(0, 4);
    })(),
  });



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsLoading(true);
    
    const productData = {
      name: formData.name,
      description: formData.description || "No description provided.",
      price: parseFloat(formData.price) || 0,
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : (parseFloat(formData.price) || 0) * 1.2,
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      features: formData.features.split(',').map((f: string) => f.trim()).filter(Boolean),
      imageUrl: formData.imageUrls[0] || `https://picsum.photos/seed/${Math.floor(Math.random() * 1000000)}/600/600`,
      imageUrls: formData.imageUrls.filter(Boolean),
      updatedAt: serverTimestamp(),
    };

    if (initialData?.id) {
      updateDoc(doc(db, 'products', initialData.id), productData)
        .then(() => {
          toast({ title: "Product Updated", description: "Your changes have been saved." });
          router.push('/admin/products');
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: `products/${initialData.id}`,
            operation: 'update',
            requestResourceData: productData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsLoading(false));
    } else {
      const newProductData = {
        ...productData,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 500),
        isDeal: true,
        createdAt: serverTimestamp(),
      };

      addDoc(collection(db, 'products'), newProductData)
        .then(() => {
          toast({ title: "Product Added", description: "Your item is now live in the store." });
          router.push('/admin/products');
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: 'products',
            operation: 'create',
            requestResourceData: newProductData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsLoading(false));
    }
  };

  const fieldLabelClass = "text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 inline-block";
  const inputClass = "bg-slate-50 border-slate-200 rounded-xl h-12 focus:ring-primary/20 focus:border-primary px-5 text-sm font-bold placeholder:text-slate-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-5xl mx-auto py-8">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Product Info</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className={fieldLabelClass}>Product Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Ultra-X Wireless Gaming Mouse" 
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="price" className={fieldLabelClass}>Price (₹)</Label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <Input 
                    id="price" 
                    type="number" 
                    step="1" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0" 
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className={fieldLabelClass}>Stock Level</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  placeholder="0" 
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className={fieldLabelClass}>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({...formData, category: val})}
                required
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  {CATEGORY_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-2 border-b border-slate-50 mb-1">{group.label}</SelectLabel>
                      {group.items.map((item) => (
                        <SelectItem key={item} value={item} className="font-bold py-3 pl-8">
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className={fieldLabelClass}>Product Images (4)</Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.imageUrls.map((url, idx) => (
                  <div key={idx} className="space-y-2">
                    <Label htmlFor={`imageUrl-${idx}`} className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {idx === 0 ? "Image 1 (Main)" : `Image ${idx + 1}`}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`imageUrl-${idx}`}
                        value={url}
                        onChange={(e) => {
                          const next = [...formData.imageUrls];
                          next[idx] = e.target.value;
                          setFormData({ ...formData, imageUrls: next });
                        }}
                        placeholder="Paste an image URL (e.g., https://...)"
                        className={inputClass}
                      />
                      {url && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...formData.imageUrls];
                            next[idx] = "";
                            setFormData({ ...formData, imageUrls: next });
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Image Preview</p>
                <div className="grid grid-cols-2 gap-3">
                  {formData.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
                      {url ? (
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                          }}
                        />
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Empty</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
                <ListPlus className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Description</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features" className={fieldLabelClass}>Key Features (comma separated)</Label>
              <Input 
                id="features" 
                value={formData.features}
                onChange={(e) => setFormData({...formData, features: e.target.value})}
                placeholder="Lightweight, 40h Battery, RGB..." 
                className={inputClass}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className={fieldLabelClass}>Full Description</Label>
              </div>
              <Textarea 
                id="description" 
                rows={10} 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your product..."
                className={`${inputClass} min-h-[280px] py-4 resize-none leading-relaxed`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-12 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={() => router.back()} className="text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl px-10 h-14 order-2 md:order-1">Cancel</Button>
        <Button type="submit" disabled={isLoading} className="gap-3 px-12 h-14 bg-slate-900 hover:bg-primary font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-slate-900/10 order-1 md:order-2 active:scale-95 transition-all">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {initialData?.id ? "Update Product" : "Add Product"}
        </Button>
      </div>
    </form>
  );
}
