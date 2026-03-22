
"use client"

import { Footer } from "@/components/storefront/Footer";
import { Card, CardTitle } from "@/components/ui/card";
import { Product } from "@/lib/mock-data";
import { Star, Loader2, Zap, ChevronLeft, Filter, ArrowUpDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useMemo, useCallback, useEffect } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

function ProductList() {
  const { addItem } = useCart();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category') || "All Categories";
  const searchQuery = searchParams.get('q');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState("price-desc");
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allProducts, loading } = useCollection(productsQuery);

  // Calculate the "Base" maximum price for the current category/search context
  const absoluteMaxPrice = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return 100000;
    
    let baseItems = [...allProducts];
    
    // Filter by category
    if (categoryFilter !== "All Categories") {
      baseItems = baseItems.filter((p: any) => p.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      baseItems = baseItems.filter((p: any) => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) || 
        p.category?.toLowerCase().includes(q)
      );
    }

    if (baseItems.length === 0) return 0;
    return Math.max(...baseItems.map((p: any) => p.price));
  }, [allProducts, categoryFilter, searchQuery]);

  // Sync the filter when the dynamic ceiling changes
  useEffect(() => {
    setMaxPriceFilter(absoluteMaxPrice);
  }, [absoluteMaxPrice]);

  const displayProducts = useMemo(() => {
    if (!allProducts) return [];
    let filtered = [...allProducts];

    // Category Filter (from URL)
    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter((p: any) => p.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) || 
        p.category?.toLowerCase().includes(q)
      );
    }

    // Price Range Filter (Slider) - using the state value
    if (maxPriceFilter !== null) {
      filtered = filtered.filter((p: any) => p.price <= maxPriceFilter);
    }

    // Sorting
    filtered.sort((a: any, b: any) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return filtered;
  }, [allProducts, categoryFilter, searchQuery, sortBy, maxPriceFilter]);

  const handleProductClick = useCallback((product: Product) => {
    router.push(`/products/${product.id}`);
  }, [router]);

  const handleAddToCart = useCallback((e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addItem(product);
  }, [addItem]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Catalog...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors group"
          >
            <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
                {categoryFilter === "All Categories" ? (searchQuery ? `Results for: ${searchQuery}` : "All Products") : categoryFilter}
              </h1>
              <div className="h-2 w-2 bg-primary rounded-none shrink-0" />
              <Badge variant="outline" className="hidden sm:flex h-6 rounded-none border-slate-200 text-slate-400 font-black text-[8px] uppercase tracking-widest">
                {displayProducts.length} Items
              </Badge>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-2xl border-slate-200 hover:bg-slate-50 relative group transition-all">
                    <Filter className="h-4 w-4 md:h-5 md:w-5 text-slate-600 group-hover:text-primary" />
                    {maxPriceFilter !== null && maxPriceFilter < absoluteMaxPrice && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-none border-2 border-white" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-6 rounded-none shadow-2xl border-none bg-white" align="end" sideOffset={10}>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Price</label>
                        <span className="text-xs font-black text-slate-900">{formatCurrency(maxPriceFilter || absoluteMaxPrice)}</span>
                      </div>
                      <Slider 
                        value={[maxPriceFilter || absoluteMaxPrice]}
                        max={absoluteMaxPrice || 1000}
                        min={0}
                        step={100}
                        onValueChange={(vals) => setMaxPriceFilter(vals[0])}
                        className="py-4"
                      />
                      <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest">
                        <span>₹0</span>
                        <span>{formatCurrency(absoluteMaxPrice)}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setMaxPriceFilter(absoluteMaxPrice)}
                      className="w-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 h-10 rounded-2xl"
                    >
                      Reset Price
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-2xl border-slate-200 hover:bg-slate-50 relative group transition-all">
                    <ArrowUpDown className="h-4 w-4 md:h-5 md:w-5 text-slate-600 group-hover:text-primary" />
                    {sortBy !== "price-desc" && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-none border-2 border-white" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 rounded-none shadow-2xl border-none bg-white" align="end" sideOffset={10}>
                  <div className="flex flex-col gap-1">
                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Sort By</div>
                    {[
                      { value: "newest", label: "Newest Arrivals" },
                      { value: "price-asc", label: "Price: Low to High" },
                      { value: "price-desc", label: "Price: High to Low" },
                      { value: "rating", label: "Avg. Customer Rating" }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant="ghost"
                        onClick={() => setSortBy(option.value)}
                        className={cn(
                          "w-full justify-start h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest px-4 transition-all",
                          sortBy === option.value ? "bg-slate-900 text-white hover:bg-slate-900 hover:text-white" : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <p className="text-slate-500 font-medium text-sm md:text-lg">
            Premium essentials curated for your collection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
        {displayProducts.length > 0 ? (
          displayProducts.map((product: any) => (
            <Card 
              key={product.id} 
              className="group overflow-hidden border border-slate-100 shadow-sm bg-white rounded-2xl flex flex-col cursor-pointer hover:shadow-xl transition-all duration-300 h-full"
              onClick={() => handleProductClick(product)}
            >
               <div className="flex flex-row md:flex-col h-full p-2 md:p-0">
                <div className="relative w-2/5 md:w-full min-h-[160px] md:aspect-square overflow-hidden bg-slate-50 p-2 md:p-6 shrink-0 rounded-xl md:rounded-b-none">
                  <Image 
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-2 md:p-6 transition-transform duration-500 group-hover:scale-105 mix-blend-multiply"
                  />
                  {product.isDeal && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-sm text-[8px] font-black tracking-widest uppercase">
                      Deal
                    </div>
                  )}
                  <div className="absolute top-2 right-2 z-10 transition-transform hover:scale-105">
                    <WishlistButton product={product} />
                  </div>
                </div>
                
                <div className="flex flex-col flex-1 pl-3 md:pl-5 md:p-5 pt-2 pb-2">
                  <div className="flex-1 space-y-1 md:space-y-2">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">{product.category}</div>
                    <CardTitle className="text-sm md:text-base font-medium text-slate-900 group-hover:text-primary transition-colors line-clamp-2 md:min-h-[2.5rem] leading-tight">
                      {product.name}
                    </CardTitle>
                    
                    <div className="flex flex-col gap-0.5 pt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-700">{product.rating || "4.5"}</span>
                        <div className="flex">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${i <= Math.floor(product.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500">({(product.reviews || 70).toLocaleString()})</span>
                      </div>
                      <span className="text-[10px] text-slate-500">1K+ bought in past month</span>
                    </div>

                    <div className="pt-2 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xl md:text-2xl font-medium text-slate-900 tracking-tight">₹{product.price.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-500 line-through decoration-slate-400">M.R.P: ₹{Math.floor(product.price * 1.2).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-600">(20% off)</span>
                    </div>

                    <div className="space-y-0.5 pt-1 pb-2 md:pb-4">
                      <p className="text-[10px] text-slate-700"><span className="font-bold">FREE delivery</span> Wed, 25 Mar</p>
                      <p className="text-[10px] text-slate-700">Or fastest delivery <span className="font-bold">Tue, 24 Mar</span></p>
                    </div>
                  </div>

                  <div className="mt-auto pt-1 md:pt-4 border-t border-slate-50 md:border-t-0">
                    <div className="md:flex md:gap-2">
                      <Button 
                        onClick={(e) => handleAddToCart(e, product)}
                        className="w-full md:flex-1 bg-[#ffd814] hover:bg-[#F7CA00] text-black h-9 md:h-11 rounded-full md:rounded-2xl text-xs md:text-[10px] font-medium md:font-black md:uppercase md:tracking-widest shadow-sm transition-all"
                      >
                        Add to cart
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                        className="hidden md:flex h-11 w-11 p-0 rounded-xl border-slate-200 shrink-0 items-center justify-center"
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 md:py-32 text-center bg-white rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
             <div className="bg-slate-50 h-20 w-20 md:h-28 md:w-28 rounded-[2rem] flex items-center justify-center mb-8 rotate-6">
                <Loader2 className="h-10 w-10 md:h-14 md:w-14 text-slate-200" />
             </div>
            <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">No items found</h3>
            <p className="text-xs md:text-base text-slate-400 mt-3 font-medium max-w-sm mx-auto">
              We couldn't find anything matching your current filters.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setMaxPriceFilter(absoluteMaxPrice);
                setSortBy("price-desc");
                router.push('/products');
              }}
              className="mt-10 rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px]"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default function StorefrontProducts() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <main className="container mx-auto px-4 md:px-8 py-4 md:py-8 flex-1 max-w-[1450px]">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Z-MART Storefront...</p>
          </div>
        }>
          <ProductList />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
