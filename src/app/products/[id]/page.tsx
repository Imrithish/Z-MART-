"use client"

import { Footer } from "@/components/storefront/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, CheckCircle2, Zap, Info, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/mock-data";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { use, useMemo, useState, useEffect } from "react";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { collection, doc, orderBy, query } from "firebase/firestore";
import { WishlistButton } from "@/components/storefront/WishlistButton";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const ratingStars = (rating?: number) => {
  const value = Math.floor(rating || 0);
  return [1, 2, 3, 4, 5].map((i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i <= value ? 'text-[#ffa41c] fill-[#ffa41c]' : 'text-slate-200'}`}
    />
  ));
};

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  const productRef = useMemo(
    () => (db ? doc(db, 'products', resolvedParams.id) : null),
    [db, resolvedParams.id]
  );
  const { data: productData, loading } = useDoc(productRef);
  const product = productData as Product | undefined;

  const suggestionsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: allProducts } = useCollection(suggestionsQuery);

  const suggestions = useMemo(() => {
    if (!allProducts || !product) return [];
    const filtered = allProducts.filter((p: any) => p.id !== product.id);
    const byCategory: Record<string, any[]> = {};
    filtered.forEach((p: any) => {
      const cat = p.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    });
    const picked: any[] = [];
    Object.keys(byCategory).forEach((cat) => {
      if (picked.length < 4 && byCategory[cat].length > 0) {
        picked.push(byCategory[cat][0]);
      }
    });
    if (picked.length < 4) {
      for (const p of filtered) {
        if (picked.length >= 4) break;
        if (!picked.find((x) => x.id === p.id)) picked.push(p);
      }
    }
    return picked.slice(0, 4);
  }, [allProducts, product]);

  const productImages = useMemo(() => {
    if (!product) return [];
    return Array.isArray((product as any).imageUrls) && (product as any).imageUrls.length > 0
      ? (product as any).imageUrls
      : [product.imageUrl];
  }, [product]);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    if (productImages.length > 0) {
      setActiveImage(productImages[0]);
    }
  }, [productImages]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Product...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Product Not Found</h2>
          <Button asChild className="rounded-none bg-slate-900 font-bold uppercase tracking-widest text-xs">
            <Link href="/products">Back to Store</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = (productToAdd: any = product) => {
    addItem(productToAdd);
    
    // figure out image for the added product
    const addedImage = productToAdd?.id === product?.id 
        ? (productImages[0] || product?.imageUrl) 
        : productToAdd?.imageUrl;

    toast({
      title: (
        <div className="flex items-center gap-2 text-green-600 font-black uppercase tracking-widest text-[10px]">
          <CheckCircle2 className="h-4 w-4" /> Added to Cart
        </div>
      ) as any,
      description: (
        <div className="flex items-center gap-3 mt-2">
          <div className="relative h-12 w-12 rounded-[0.5rem] bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
            <Image src={addedImage} alt={productToAdd?.name || "Product"} fill className="object-contain p-1 mix-blend-multiply" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-black text-slate-900 line-clamp-1">{productToAdd?.name || "Product"}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ready for checkout</p>
          </div>
        </div>
      ) as any,
      action: (
        <ToastAction altText="View Cart" asChild>
          <Link href="/cart" className="amazon-btn-primary text-[10px] px-4 py-2 rounded-md">
            View Cart
          </Link>
        </ToastAction>
      ),
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use Buy Now.",
      });
      router.push('/login');
      return;
    }
    router.push(`/checkout?productId=${product.id}`);
  };


  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f6f1eb] via-[#f8f5f1] to-[#efe8e1] relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-[520px] w-[520px] bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.12),_transparent_60%)] pointer-events-none" />
      <div className="absolute -bottom-56 -left-40 h-[620px] w-[620px] bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.10),_transparent_60%)] pointer-events-none" />

      <div className="w-full bg-white/70 backdrop-blur border-b border-black/10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:text-slate-700">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-slate-700">Products</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-700 line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="w-full px-0 md:px-8 py-0 md:py-10 min-h-[calc(100dvh-120px)]">
        <div className="w-full h-full bg-white/70 border border-black/10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur min-h-[calc(100dvh-120px)]">
          <div className="flex items-center justify-start px-3 md:px-8 pt-5">
            <button
              onClick={() => router.back()}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 hover:text-black inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-3 w-3" /> Go Back
            </button>
          </div>
          <div className="grid w-full h-full grid-cols-1 lg:grid-cols-[520px_1fr] gap-6 md:gap-8 px-3 md:px-8 pb-6 md:pb-8 pt-4 min-h-[calc(100dvh-200px)]">
            {/* Image Gallery (Left) */}
            <div className="bg-white/60 border border-black/10 flex flex-col">
            <div className="relative aspect-square w-full bg-gradient-to-br from-white via-[#fbf9f6] to-[#f1ece6] overflow-hidden group">
              <Image src={activeImage || product.imageUrl} alt={product.name} fill className="object-contain p-2 transition-transform duration-700 group-hover:scale-[1.06]" priority />
              {product.isDeal && (
                <Badge className="absolute top-4 left-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.2em] px-3 py-1.5 border-none rounded-full shadow">
                  Limited Time Deal
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-2 border-t border-black/10 bg-white/60">
              {((productImages.length > 0 ? productImages : [product.imageUrl]).length >= 4
                ? (productImages.length > 0 ? productImages : [product.imageUrl]).slice(0, 4)
                : [...(productImages.length > 0 ? productImages : [product.imageUrl]), ...Array(4 - (productImages.length > 0 ? productImages : [product.imageUrl]).length).fill((productImages.length > 0 ? productImages : [product.imageUrl])[0] || product.imageUrl)]
              ).map((img: string, i: number) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-square bg-white/80 border transition-all duration-200 hover:border-black/20 hover:shadow-sm ${
                    activeImage === img ? "border-black/40 shadow-sm" : "border-black/10"
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-contain p-2 transition-transform duration-300 hover:scale-105" />
                </button>
              ))}
            </div>
            </div>

            {/* Right Column: Title, About, Buy */}
            <div className="space-y-4 md:space-y-6">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-slate-700 cursor-pointer">
              Visit the {product.brand || "Z-MART"} Store
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 pb-4 border-b border-black/10">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">{product.rating || 0}</span>
                <div className="flex">{ratingStars(product.rating)}</div>
              </div>
              <span className="text-slate-600 text-sm font-bold">{(product.reviews || 0).toLocaleString()} ratings</span>
            </div>

            <div>
              <div className="flex items-end gap-4">
                {discountPercentage > 0 && (
                  <span className="text-3xl font-light text-black">-{discountPercentage}%</span>
                )}
                <div className="flex items-start">
                  <span className="text-sm font-bold mt-1">₹</span>
                  <span className="text-4xl font-black tracking-tight">{(product.price || 0).toLocaleString()}</span>
                </div>
              </div>
              {product.originalPrice && (
                <p className="text-sm text-slate-500 mt-1">
                  M.R.P.: <span className="line-through">{formatCurrency(product.originalPrice)}</span>
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Inclusive of all taxes</p>
            </div>

            <div className="border-t border-black/10 pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4">
                <WishlistButton
                  product={product}
                  className="h-11 w-11 rounded-full bg-[#0a2a5e] hover:bg-[#0a2a5e] text-white border border-[#0a2a5e] shadow-sm flex items-center justify-center"
                />
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 h-11 bg-transparent hover:bg-black/5 text-black border border-black/20 shadow-sm rounded-lg font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 h-11 bg-[#ffd814] hover:bg-[#0a2a5e] hover:text-white text-black border border-[#fcd200] hover:border-[#0a2a5e] shadow-sm rounded-lg font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] sm:pr-6"
                >
                  <Zap className="h-4 w-4 mr-2" /> Buy Now
                </Button>
              </div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Product code: {product.id}
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-400" />
                <span><span className="font-bold text-slate-900">FREE delivery</span> by Tomorrow, 11 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-slate-400" />
                <span className="text-[#007185] font-bold">10 days Returnable</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <span className="text-[#007185] font-bold">Secure transaction</span>
              </div>
            </div>

            <div className="border-t border-black/10 pt-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Info className="h-4 w-4 text-slate-400" />
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px]">Key Features</h3>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {product.features && product.features.length > 0 ? (
                  product.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx}>• {feature}</div>
                  ))
                ) : (
                  <>
                    <div>• Premium quality item curated for Z-MART.</div>
                    <div>• Carefully packaged for safe delivery.</div>
                    <div>• Quality-checked before dispatch.</div>
                    <div>• Designed for everyday reliability.</div>
                  </>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Full-width Description */}
          <div className="border-t border-black/10 px-3 md:px-8 pt-5 md:pt-8 pb-5 md:pb-8">
            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-600">Description</h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {product.description || "Premium quality item curated for Z-MART. Carefully packaged and strictly inspected for the highest customer satisfaction."}
            </p>
          </div>

          {/* Suggestions */}
          <div className="border-t border-black/10 px-3 md:px-8 pt-5 md:pt-8 pb-5 md:pb-8">
            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-600">Suggestions</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {(suggestions.length > 0 ? suggestions : [product, product, product, product]).map((item: any, i: number) => (
                <div
                  key={`${item?.id || 'fallback'}-${i}`}
                  className="group cursor-pointer flex flex-col h-full bg-white rounded-2xl md:rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/50 hover:border-primary/20 relative overflow-hidden"
                  onClick={() => router.push(`/products/${item?.id || product.id}`)}
                >
                  <div className="flex flex-row md:flex-col h-full p-2 md:p-4">
                    <div className="relative w-2/5 md:w-full min-h-[160px] md:aspect-square overflow-hidden bg-slate-50/50 p-2 md:p-4 md:mb-4 shrink-0 rounded-xl group-hover:bg-white transition-colors duration-500">
                      <Image
                        src={item?.imageUrl || product.imageUrl}
                        alt={item?.name || product.name}
                        fill
                        sizes="(max-width: 768px) 40vw, 25vw"
                        className="object-contain p-2 md:p-0 transition-transform duration-700 ease-out group-hover:scale-105 mix-blend-multiply"
                      />
                    </div>

                    <div className="flex flex-col flex-1 pl-3 md:pl-0 pt-2 pb-2 md:min-w-0">
                      <div className="flex-1 space-y-1 md:space-y-1.5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase md:text-primary md:tracking-[0.2em]">
                          {item?.category || product.category}
                        </p>
                        <h3 className="text-sm md:text-base font-medium md:font-black text-slate-900 line-clamp-2 md:tracking-tight md:uppercase leading-tight md:leading-tight group-hover:text-primary transition-colors md:min-h-[2.5rem]">
                          {item?.name || product.name}
                        </h3>
                        
                        <div className="flex flex-col gap-0.5 pt-1 md:pt-0">
                          <div className="flex items-center gap-1 md:gap-2">
                            <span className="text-[11px] font-bold text-slate-700 md:hidden">{item?.rating || product.rating || "4.5"}</span>
                            <div className="flex items-center gap-1 md:hidden">
                              {[1,2,3,4,5].map(j => (
                                <Star key={j} className={`h-3 w-3 ${j <= Math.floor(item?.rating || product.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                              ))}
                            </div>
                            
                            <div className="hidden md:flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-[11px] font-black text-slate-900">{item?.rating || product.rating || "4.5"}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 md:font-bold md:text-slate-300 md:uppercase md:tracking-widest">
                              ({(item?.reviews || product.reviews || 70).toLocaleString()})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 md:hidden">1K+ bought in past month</span>
                        </div>

                        <div className="pt-2 flex items-baseline gap-1.5 flex-wrap md:hidden">
                          <span className="text-lg font-medium text-slate-900 tracking-tight">₹{(item?.price || product.price).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-500 line-through decoration-slate-400">M.R.P: ₹{Math.floor((item?.price || product.price) * 1.2).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-600">(20% off)</span>
                        </div>

                        <div className="space-y-0.5 pt-1 pb-2 md:hidden">
                          <p className="text-[10px] text-slate-700"><span className="font-bold">FREE delivery</span> Wed, 25 Mar</p>
                          <p className="text-[10px] text-slate-700">Or fastest delivery <span className="font-bold">Tue, 24 Mar</span></p>
                        </div>
                      </div>

                      <div className="mt-auto pt-1 md:pt-4 border-t border-slate-50 md:border-t-0 space-y-3">
                        <div className="hidden md:flex items-center justify-between">
                          <span className="text-xl font-black text-slate-900 tracking-tighter">
                            {formatCurrency(item?.price || product.price)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item || product);
                            }}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all duration-300"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <Button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleAddToCart(item || product); 
                          }}
                          className="md:hidden flex items-center justify-center w-full bg-[#ffd814] hover:bg-[#F7CA00] text-black h-9 rounded-full text-xs font-medium shadow-sm transition-all duration-300 border-none"
                        >
                          Add to cart
                        </Button>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              toast({
                                title: "Sign in required",
                                description: "Please sign in to use Buy Now.",
                              });
                              router.push('/login');
                              return;
                            }
                            router.push(`/checkout?productId=${item?.id || product.id}`);
                          }}
                          className="hidden md:flex w-full h-11 bg-slate-900 hover:bg-primary text-white hover:text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 border-none items-center justify-center cursor-pointer"
                        >
                          <Zap className="h-4 w-4 mr-2 fill-current" /> Buy Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
