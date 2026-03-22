
"use client"

import { Footer } from "@/components/storefront/Footer";
import { UserSidebar } from "@/components/storefront/UserSidebar";
import { useUser, useCollection, useFirestore } from "@/firebase";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  ShieldCheck, 
  MapPin, 
  Loader2, 
  ArrowRight, 
  ShoppingBag, 
  Clock, 
  ChevronRight,
  ExternalLink,
  CreditCard,
  User as UserIcon,
  Plus,
  Trash2,
  Home as HomeIcon,
  Briefcase,
  Heart,
  Settings as SettingsIcon,
  Bell,
  Mail,
  Smartphone,
  Eye,
  ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { collection, query, where, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { format } from "date-fns";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ReceiptModal } from "@/components/storefront/ReceiptModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

type AccountTab = 'overview' | 'orders' | 'wishlist' | 'addresses';

export default function UserDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [openItemsOrderId, setOpenItemsOrderId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Address Form State
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  // Handle Hash navigation from sidebar
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['orders', 'wishlist', 'addresses'].includes(hash)) {
        setActiveTab(hash as any);
      } else {
        setActiveTab('overview');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (!openItemsOrderId) return;
    const handleOutside = () => setOpenItemsOrderId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [openItemsOrderId]);

  // Fetch User Orders
  const ordersQuery = useMemo(() => {
    if (!db || !user?.email) return null;
    return query(
      collection(db, 'orders'),
      where('customerEmail', '==', user.email)
    );
  }, [db, user?.email]);

  const { data: rawOrders, loading: ordersLoading } = useCollection(ordersQuery);

  // Fetch User Addresses
  const addressesQuery = useMemo(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'users', user.uid, 'addresses');
  }, [db, user?.uid]);

  const { data: addresses, loading: addressesLoading } = useCollection(addressesQuery);

  // Fetch User Wishlist
  const wishlistQuery = useMemo(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'users', user.uid, 'wishlist');
  }, [db, user?.uid]);

  const { data: wishlistItems, loading: wishlistLoading } = useCollection(wishlistQuery);

  // Client-side sorting of orders by creation date
  const orders = useMemo(() => {
    if (!rawOrders) return null;
    return [...rawOrders].sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawOrders]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleViewReceipt = (order: any) => {
    setSelectedReceipt(order);
    setIsReceiptOpen(true);
  };

  const handleCancelOrder = (orderId: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'orders', orderId))
      .then(() => {
        toast({ title: "Order Cancelled", description: "Your order has been completely removed." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `orders/${orderId}`,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;

    setIsSavingAddress(true);
    const addressData = {
      ...newAddress,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, 'users', user.uid, 'addresses'), addressData)
      .then(() => {
        toast({ title: "Address Saved", description: "Successfully added to your profile." });
        setShowAddAddress(false);
        setNewAddress({
          label: 'Home',
          houseNo: '',
          street: '',
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}/addresses`,
          operation: 'create',
          requestResourceData: addressData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSavingAddress(false));
  };

  const handleDeleteAddress = (addressId: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'users', user.uid, 'addresses', addressId))
      .then(() => {
        toast({ title: "Address Removed", description: "Location deleted from your profile." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}/addresses/${addressId}`,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleRemoveFromWishlist = (wishlistId: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'users', user.uid, 'wishlist', wishlistId))
      .then(() => {
        toast({ title: "Item Removed", description: "Removed from your saved items." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}/wishlist/${wishlistId}`,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const resolveProductId = (item: any) => {
    return item?.productId || item?.id || item?.product?.id || null;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 font-black text-slate-500 uppercase tracking-widest text-xs text-center">
          Syncing Account...
        </p>
      </div>
    );
  }

  if (!user) return null;

  const lastOrder = orders?.[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-body">
      <UserSidebar />
      
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <main className="flex-1 max-w-[1200px] mx-auto w-full p-4 md:p-10 lg:p-14 space-y-8 md:space-y-12 mb-24">
          <header className="space-y-2 md:space-y-4">
            <div className="flex items-center gap-3 md:gap-4">
               <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
                {activeTab === 'overview' ? 'Dashboard' : 
                 activeTab === 'orders' ? 'My Orders' : 
                 activeTab === 'wishlist' ? 'Your Wishlist' : 
                 activeTab === 'addresses' ? 'Saved Addresses' : ''}
               </h1>
               <div className="h-2 w-2 bg-primary rounded-full mt-2 md:mt-4" />
            </div>
            <p className="text-slate-500 font-medium text-sm md:text-lg">
              {activeTab === 'overview' 
                ? `Welcome back, ${user.displayName || user.email}`
                : `Manage your ${activeTab} and account details.`
              }
            </p>
          </header>

          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <Card className="lg:col-span-2 bg-white border-none shadow-sm rounded-[2rem] overflow-hidden">
                  <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Latest Activity</CardTitle>
                    <Link href="#orders" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                      View All <ChevronRight className="h-3 w-3" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-8">
                    {ordersLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : lastOrder ? (
                      <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
                        <div className="relative h-32 w-32 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 p-4 shrink-0 shadow-inner">
                          <Image 
                            src={lastOrder.items?.[0]?.imageUrl || 'https://placehold.co/200x200'} 
                            alt="Last Order" 
                            fill 
                            className="object-contain p-2"
                          />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="space-y-1">
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 mb-2">
                              {lastOrder.status}
                            </Badge>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{lastOrder.items?.[0]?.name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              Ordered on {lastOrder.createdAt?.toDate ? format(lastOrder.createdAt.toDate(), 'MMMM dd, yyyy') : 'Recently'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 justify-center sm:justify-start">
                             <div className="text-lg font-black text-slate-900">{formatCurrency(lastOrder.totalAmount)}</div>
                             <div className="h-4 w-px bg-slate-200" />
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lastOrder.items?.length} Items</div>
                          </div>
                          <Button onClick={() => handleViewReceipt(lastOrder)} variant="ghost" className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[9px] text-primary hover:bg-primary/5">
                            View Details <ExternalLink className="h-3.5 w-3.5 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-4">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                          <ShoppingBag className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No orders yet</p>
                        <Button asChild variant="outline" className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px]">
                          <Link href="/products">Start Shopping</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10 space-y-6">
                    <UserIcon className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Member Status</h3>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed">You have been a Z-MART member since {user.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'yyyy') : '2024'}.</p>
                    </div>
                  </div>
                  <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Spent</p>
                      <p className="text-xl font-black">{formatCurrency(orders?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0)}</p>
                    </div>
                    <Badge className="bg-white text-slate-900 border-none font-black text-[9px] px-3 py-1">ELITE</Badge>
                  </div>
                </Card>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {[
                  { title: "My Orders", desc: "Track and manage purchases", icon: Package, href: '#orders' },
                  { title: "Wishlist", desc: "Items saved for later", icon: Heart, href: '#wishlist' },
                  { title: "Addresses", desc: "Manage delivery spots", icon: MapPin, href: '#addresses' },
                ].map((card, idx) => (
                  <Link key={idx} href={card.href}>
                    <Card className="hover:shadow-2xl transition-all duration-500 border-none rounded-[1.5rem] md:rounded-[2.5rem] cursor-pointer group h-full bg-white shadow-sm overflow-hidden border-slate-100 text-left w-full">
                      <CardContent className="p-6 md:p-8 flex flex-col gap-4 md:gap-6">
                        <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-slate-900 transition-all duration-500 shadow-inner">
                          <card.icon className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="space-y-2 md:space-y-3">
                          <h3 className="font-black text-slate-900 uppercase tracking-tight text-base md:text-lg leading-none">{card.title}</h3>
                          <p className="text-[9px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">{card.desc}</p>
                        </div>
                        <div className="mt-auto pt-2 flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-primary tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                          Configure <ArrowRight className="h-3 w-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </section>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{orders?.length || 0} Total Orders</p>
                  <Button variant="ghost" onClick={() => setActiveTab('overview')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary">
                    Back to Overview
                  </Button>
               </div>

               {ordersLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Order History...</p>
                 </div>
               ) : orders && orders.length > 0 ? (
                 <div className="grid grid-cols-1 gap-6">
                   {orders.map((order: any) => (
                     <Card key={order.id} className="bg-white border-none shadow-sm rounded-[2rem] overflow-visible hover:shadow-lg transition-all border border-transparent hover:border-slate-100 group">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                          <div className="flex items-center gap-4 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const pid = resolveProductId(order.items?.[0]);
                                if (pid) {
                                  router.push(`/products/${pid}`);
                                } else {
                                  toast({ title: "Product not found", description: "This item link is unavailable." });
                                }
                              }}
                              className="relative h-24 w-24 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2 group-hover:scale-105 transition-transform duration-500"
                            >
                              <Image src={order.items?.[0]?.imageUrl || 'https://placehold.co/100x100'} alt={order.items?.[0]?.name || 'Order item'} fill className="object-contain p-1" />
                            </button>
                            {order.items?.length > 1 && (
                              <div
                                className="relative"
                                onMouseEnter={() => setOpenItemsOrderId(order.id)}
                                onMouseLeave={() => setOpenItemsOrderId(null)}
                              >
                                <button
                                  type="button"
                                  className="h-12 min-w-12 px-3 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs border-2 border-white shadow-xl"
                                >
                                  +{order.items.length - 1}
                                </button>
                                {openItemsOrderId === order.id && (
                                  <div
                                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 sm:w-72 bg-white/50 backdrop-blur-3xl border border-white/50 shadow-[0_20px_50px_rgba(15,23,42,0.25)] ring-1 ring-white/60 rounded-2xl p-4 z-20 animate-in fade-in zoom-in-95 md:left-full md:top-0 md:mt-0 md:ml-2 md:translate-x-0 before:absolute before:-left-4 before:top-0 before:h-full before:w-4 before:content-['']"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Other Items</p>
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{order.items.length - 1}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      {order.items?.slice(1).map((item: any, i: number) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const pid = resolveProductId(item);
                                            if (pid) {
                                              router.push(`/products/${pid}`);
                                            } else {
                                              toast({ title: "Product not found", description: "This item link is unavailable." });
                                            }
                                          }}
                                          className="w-full flex flex-col items-center gap-2 text-center bg-white/60 backdrop-blur border border-white/60 rounded-xl p-2 hover:shadow-xl hover:-translate-y-0.5 transition-all animate-in fade-in zoom-in-95"
                                          style={{ animationDelay: `${i * 60}ms` }}
                                        >
                                          <div className="relative h-12 w-12 bg-white/80 rounded-lg border border-white/70 overflow-hidden p-1 shrink-0 shadow-inner">
                                            <Image src={item.imageUrl || 'https://placehold.co/100x100'} alt={item.name} fill className="object-contain p-1" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-slate-900 uppercase tracking-tight line-clamp-1">{item.name}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 w-full space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Order #{order.id.slice(-8).toUpperCase()}</h3>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const pid = resolveProductId(order.items?.[0]);
                                    if (pid) {
                                      router.push(`/products/${pid}`);
                                    } else {
                                      toast({ title: "Product not found", description: "This item link is unavailable." });
                                    }
                                  }}
                                  className="text-[11px] font-black text-primary uppercase tracking-widest hover:underline line-clamp-1 text-left"
                                >
                                  {order.items?.[0]?.name || "View Item"}
                                </button>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Clock className="h-3 w-3" /> {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM dd, yyyy') : 'Recently'}
                                </p>
                              </div>
                              <Badge className={`rounded-full font-black px-4 py-1 text-[8px] uppercase tracking-widest border-none ${
                                order.status === 'Shipped' ? 'bg-green-100 text-green-700' : 
                                order.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 
                                order.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {order.status}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-4 border-t border-slate-50">
                               <div className="space-y-1">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</p>
                                  <p className="text-sm font-black text-slate-900">{formatCurrency(order.totalAmount)}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Ship To</p>
                                  <p className="text-sm font-black text-slate-900">{order.customerName}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Method</p>
                                  <p className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-1.5">
                                    <CreditCard className="h-3 w-3 text-slate-400" /> {order.paymentMethod}
                                  </p>
                               </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex md:flex-col gap-3 w-full md:w-auto items-stretch md:items-end">
                            <Button onClick={() => handleViewReceipt(order)} className="w-full md:w-44 h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] bg-[#0a2a5e] hover:bg-[#071f46] text-white border-none">
                              View Receipt
                            </Button>
                            {order.status === 'Pending' && (
                              <Button onClick={() => handleCancelOrder(order.id)} variant="outline" className="w-full md:w-44 h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all">
                                Cancel Order
                              </Button>
                            )}
                          </div>
                        </div>
                     </Card>
                   ))}
                 </div>
               ) : (
                 <div className="py-20 flex flex-col items-center text-center">
                    <div className="bg-white h-32 w-32 rounded-[3rem] flex items-center justify-center mb-8 shadow-xl">
                      <ShoppingBag className="h-12 w-12 text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Transactions Found</h2>
                    <p className="text-slate-500 max-w-xs mb-8 font-medium">Your order history is currently empty. Start exploring our premium collection.</p>
                    <Button asChild className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-primary font-black uppercase tracking-widest text-xs text-white">
                      <Link href="/products">Browse Trending</Link>
                    </Button>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{wishlistItems?.length || 0} Saved Items</p>
                  <Button variant="ghost" onClick={() => setActiveTab('overview')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary">
                    Back to Overview
                  </Button>
               </div>

               {wishlistLoading ? (
                 <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
               ) : wishlistItems && wishlistItems.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item: any) => (
                      <Card key={item.id} className="bg-white border-none shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all">
                        <div className="relative aspect-square w-full bg-slate-50 p-8 overflow-hidden">
                           <Image src={item.imageUrl || 'https://placehold.co/400x400'} alt={item.name} fill className="object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                           <button 
                             onClick={() => handleRemoveFromWishlist(item.id)}
                             className="absolute top-4 right-4 h-10 w-10 bg-white shadow-xl rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                        <CardContent className="p-6 space-y-4">
                           <div className="space-y-1">
                             <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1">{item.name}</h4>
                             <p className="text-lg font-black text-primary">{formatCurrency(item.price)}</p>
                           </div>
                           <div className="flex gap-2">
                             <Button asChild className="flex-1 bg-slate-900 text-white rounded-xl h-10 font-black uppercase text-[9px] tracking-widest border-none">
                               <Link href={`/products?q=${item.name}`}>View Item</Link>
                             </Button>
                             <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-100">
                               <ShoppingCart className="h-4 w-4" />
                             </Button>
                           </div>
                        </CardContent>
                      </Card>
                    ))}
                 </div>
               ) : (
                 <div className="py-20 flex flex-col items-center text-center">
                    <div className="bg-white h-32 w-32 rounded-[3rem] flex items-center justify-center mb-8 shadow-xl">
                      <Heart className="h-12 w-12 text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Wishlist Empty</h2>
                    <p className="text-slate-500 max-w-xs mb-8 font-medium">Save your favorite premium items here to track their price and availability.</p>
                    <Button asChild className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-primary font-black uppercase tracking-widest text-xs text-white">
                      <Link href="/products">Explore Catalog</Link>
                    </Button>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{addresses?.length || 0} Saved Locations</p>
                  <Button 
                    onClick={() => setShowAddAddress(!showAddAddress)} 
                    className="h-12 px-6 rounded-xl bg-primary text-slate-900 font-black uppercase tracking-widest text-[10px]"
                  >
                    {showAddAddress ? 'Cancel' : 'Add New Address'}
                  </Button>
               </div>

               {showAddAddress && (
                 <Card className="bg-white border-none shadow-sm rounded-[2rem] p-8 animate-in slide-in-from-top-4 duration-500">
                    <form onSubmit={handleAddAddress} className="space-y-8">
                       <div className="space-y-6">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location Type</Label>
                          <RadioGroup 
                            value={newAddress.label} 
                            onValueChange={(val) => setNewAddress({...newAddress, label: val})}
                            className="flex flex-wrap gap-4"
                          >
                            {['Home', 'Office', 'Work', 'Other'].map((label) => (
                              <Label key={label} className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 cursor-pointer transition-all ${newAddress.label === label ? 'border-primary bg-primary/5 text-slate-900' : 'border-slate-100 hover:border-slate-200 text-slate-400'}`}>
                                <RadioGroupItem value={label} className="sr-only" />
                                {label === 'Home' && <HomeIcon className="h-4 w-4" />}
                                {label === 'Office' && <Briefcase className="h-4 w-4" />}
                                {label === 'Work' && <Briefcase className="h-4 w-4" />}
                                {label === 'Other' && <MapPin className="h-4 w-4" />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                              </Label>
                            ))}
                          </RadioGroup>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Flat / House No.</Label>
                            <Input required value={newAddress.houseNo} onChange={e => setNewAddress({...newAddress, houseNo: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Street / Area</Label>
                            <Input required value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">City</Label>
                            <Input required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">State</Label>
                            <Input required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pincode</Label>
                            <Input required maxLength={6} value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Landmark</Label>
                            <Input value={newAddress.landmark} onChange={e => setNewAddress({...newAddress, landmark: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                          </div>
                       </div>
                       <Button type="submit" disabled={isSavingAddress} className="h-14 px-10 bg-slate-900 text-white hover:bg-primary hover:text-slate-900 font-black uppercase tracking-widest rounded-2xl shadow-xl">
                          {isSavingAddress ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                          Save Delivery Location
                       </Button>
                    </form>
                 </Card>
               )}

               {addressesLoading ? (
                 <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
               ) : addresses && addresses.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {addresses.map((address: any) => (
                      <Card key={address.id} className="bg-white border-none shadow-sm rounded-[2rem] p-8 group relative overflow-hidden transition-all hover:shadow-lg">
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleDeleteAddress(address.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                        <div className="flex flex-col gap-6">
                           <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                              {address.label === 'Home' ? <HomeIcon className="h-5 w-5" /> : 
                               address.label === 'Office' ? <Briefcase className="h-5 w-5" /> : 
                               address.label === 'Work' ? <Briefcase className="h-5 w-5" /> :
                               <MapPin className="h-5 w-5" />}
                           </div>
                           <div className="space-y-2">
                             <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{address.label}</h4>
                             <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                {address.houseNo}, {address.street}<br/>
                                {address.city}, {address.state} - {address.pincode}
                             </p>
                           </div>
                        </div>
                      </Card>
                    ))}
                 </div>
               ) : (
                 <div className="py-20 flex flex-col items-center text-center">
                    <div className="bg-white h-32 w-32 rounded-[3rem] flex items-center justify-center mb-8 shadow-xl">
                      <MapPin className="h-12 w-12 text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Saved Locations</h2>
                    <p className="text-slate-500 max-w-xs mb-8 font-medium">Add your preferred delivery addresses for a faster checkout experience.</p>
                 </div>
               )}
            </div>
          )}



          {activeTab === 'overview' && (
            <section className="pt-10 md:pt-20 border-t border-slate-100">
              <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[100px] rounded-full" />
                <div className="relative z-10 space-y-4 md:space-y-6">
                  <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">Z-MART Exclusive</h2>
                  <p className="text-slate-400 max-w-lg font-medium text-sm md:text-base">As a registered member, you have access to priority support and early releases. Manage your membership preferences here.</p>
                  <Button className="h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl bg-primary text-slate-900 font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-white transition-colors border-none">
                    Upgrade Membership
                  </Button>
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer />
        
        <ReceiptModal 
          isOpen={isReceiptOpen} 
          order={selectedReceipt} 
          onClose={() => setIsReceiptOpen(false)} 
        />
      </div>
    </div>
  );
}
