
"use client"

import { Footer } from "@/components/storefront/Footer";
import { Loader2, ShoppingBag, Search, Zap, ArrowRight, Star, TrendingUp, Sparkles, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState, useMemo, useCallback, memo } from "react";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Memoized Product Card for performance
const ProductCard = memo(({ product, onProductClick, onAddToCart, onBuyNow }: { 
  product: any, 
  onProductClick: (p: any) => void,
  onAddToCart: (p: any) => void,
  onBuyNow: (e: React.MouseEvent, p: any) => void
}) => (
  <div 
    className="group cursor-pointer flex flex-row md:flex-col h-full bg-white p-3 md:p-4 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/50 hover:border-primary/20 relative"
    onClick={() => onProductClick(product)}
  >
    <div className="flex flex-row md:flex-col h-full w-full gap-3 md:gap-0">
      <div className="relative w-28 h-28 md:w-full md:aspect-square bg-slate-50/50 rounded-xl overflow-hidden p-2 md:p-4 mb-0 md:mb-4 group-hover:bg-white transition-colors duration-500 shrink-0">
        <Image 
          src={product.imageUrl || 'https://picsum.photos/seed/placeholder/400/400'} 
          alt={product.name} 
          fill 
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-contain transition-transform duration-700 ease-out group-hover:scale-105" 
        />
        {product.isDeal && (
          <Badge className="absolute top-2 left-2 bg-red-600 text-white border-none text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full">
            DEAL
          </Badge>
        )}
        <div className="absolute top-2 right-2 z-10 transition-transform hover:scale-105">
          <WishlistButton product={product} />
        </div>
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <div className="space-y-1.5">
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{product.category}</p>
           <h3 className="text-sm font-black text-slate-900 line-clamp-2 uppercase tracking-tight leading-tight group-hover:text-primary transition-colors min-h-[2.5rem]">
             {product.name}
           </h3>
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-1">
               <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
               <span className="text-[11px] font-black text-slate-900">{product.rating}</span>
             </div>
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">({(product.reviews || 0).toLocaleString()})</span>
           </div>
        </div>
        
        <div className="mt-auto pt-3 md:pt-4 space-y-2.5 md:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-slate-900 tracking-tighter">{formatCurrency(product.price)}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all duration-300"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
          <Button 
            onClick={(e) => onBuyNow(e, product)}
            className="w-full h-10 md:h-11 bg-slate-900 hover:bg-primary text-white hover:text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 border-none"
          >
            <Zap className="h-4 w-4 mr-2 fill-current" /> Buy Now
          </Button>
        </div>
      </div>
    </div>
  </div>
));

ProductCard.displayName = "ProductCard";

export default function Home() {
  const { addItem } = useCart();
  const db = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: products, loading } = useCollection(productsQuery);

  const curatedSections = useMemo(() => {
    if (!products) return { newArrivals: [], bestSellers: [], popular: [] };
    
    return {
      newArrivals: products.slice(0, 4),
      bestSellers: products.filter((p: any) => p.rating >= 4.8).slice(0, 4),
      popular: products.filter((p: any) => p.reviews > 500).slice(0, 4)
    };
  }, [products]);

  const categoryEntries = useMemo(() => {
    if (!products) return [];
    const grouped = products.reduce((acc: Record<string, any[]>, product: any) => {
      const cat = product.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});
    return Object.entries(grouped).slice(0, 2);
  }, [products]);

  const handleProductClick = useCallback((product: any) => {
    router.push(`/products/${product.id}`);
  }, [router]);

  const handleAddToCart = useCallback((product: any) => {
    addItem(product);
  }, [addItem]);

  const handleBuyNowClick = useCallback((e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    router.push(`/checkout?productId=${product.id}`);
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Syncing Z-MART...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <main className="flex-1">
        {/* Compact Hero Section - Reduced padding */}
        <section className="bg-slate-900 py-6 md:py-8 lg:py-10 px-4 md:px-8 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 relative z-10">
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-[0.9] text-balance">The Premium Standard</h1>
              <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] opacity-60">Global Curated Marketplace</p>
            </div>
            
            <form onSubmit={handleSearch} className="flex items-center w-full max-w-3xl mx-auto h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl md:rounded-[2rem] overflow-hidden bg-white shadow-2xl p-1 md:p-1.5 border border-white/10">
              <div className="flex-1 flex items-center px-4 md:px-6">
                <Search className="h-4 w-4 md:h-5 md:w-5 text-slate-400 shrink-0" />
                <Input 
                  placeholder="Search premium essentials..." 
                  className="flex-1 border-none focus-visible:ring-0 text-slate-900 h-full px-3 md:px-4 text-sm md:text-base font-bold placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="h-full bg-primary hover:bg-primary/90 px-5 sm:px-8 md:px-12 rounded-lg sm:rounded-xl md:rounded-[1.5rem] transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 group active:scale-95"
              >
                <span className="hidden sm:block font-black uppercase tracking-widest text-slate-900 text-[9px] md:text-[10px]">Search</span>
                <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </section>

        {/* Categories Overlap */}
        <section className="max-w-[1450px] mx-auto px-4 md:px-8 -mt-4 md:-mt-6 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { title: "Digital Tech", hint: "laptop tech", href: "/products?category=Electronics", seed: "digital" },
              { title: "Luxe Home", hint: "living room", href: "/products?category=Home & Kitchen", seed: "interior" },
              { title: "High Fashion", hint: "clothing style", href: "/products?category=Fashion", seed: "style-vogue" },
              { title: "Flash Deals", hint: "discount shopping", href: "/products", seed: "offer" }
            ].map((cat, idx) => (
              <Link key={idx} href={cat.href}>
                <Card className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl flex flex-col h-full group hover:-translate-y-1 transition-all duration-500 border-none">
                  <h3 className="text-sm md:text-lg font-black text-slate-900 mb-3 md:mb-4 uppercase tracking-tight">{cat.title}</h3>
                  <div className="relative aspect-[16/10] w-full bg-slate-50 rounded-xl md:rounded-2xl overflow-hidden mb-4 shadow-inner border border-slate-100">
                    <Image 
                      src={`https://picsum.photos/seed/${cat.seed}/600/400`}
                      alt={cat.title}
                      fill
                      priority={idx < 4}
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      data-ai-hint={cat.hint}
                    />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-primary group-hover:underline uppercase tracking-widest mt-auto flex items-center gap-2">
                    Browse <ArrowRight className="h-3 w-3" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Product Sections */}
        <div className="max-w-[1450px] mx-auto px-4 md:px-8 py-8 md:py-12 space-y-10 md:space-y-16">
          {curatedSections.newArrivals.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-end justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter">New Arrivals</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {curatedSections.newArrivals.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNowClick}
                  />
                ))}
              </div>
            </section>
          )}

          {categoryEntries.map(([category, items]) => (
            <section key={category} className="space-y-6">
              <div className="flex items-end justify-between border-b border-slate-200 pb-3">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter">{category}</h2>
                <Link href={`/products?category=${category}`} className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.slice(0, 4).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNowClick}
                  />
                ))}
              </div>
            </section>
          ))}

          {products && products.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-end justify-between border-b border-slate-200 pb-3">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter">All Products</h2>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {products.length} items
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNowClick}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />

    </div>
  );
}
