
"use client"

import { useCart } from "@/context/CartContext";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowRight, MapPin, Phone, CreditCard, ShoppingBag, Truck, Home as HomeIcon, Briefcase } from "lucide-react";
import Image from "next/image";
import { OrderSuccessModal } from "@/components/storefront/OrderSuccessModal";
import { PaymentGatewayModal } from "@/components/storefront/PaymentGatewayModal";
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

function CheckoutContent() {
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  // Form State
  const [address, setAddress] = useState({
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');

  // Fetch product for Buy Now if productId is present
  const productRef = useMemo(() => productId && db ? doc(db, 'products', productId) : null, [productId, db]);
  const { data: buyNowProduct, loading: productLoading } = useDoc(productRef);

  // Fetch Saved Addresses
  const addressesQuery = useMemo(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'users', user.uid, 'addresses');
  }, [db, user?.uid]);

  const { data: savedAddresses, loading: addressesLoading } = useCollection(addressesQuery);

  // Calculate Order Items and Totals
  const orderItems = useMemo(() => {
    if (productId && buyNowProduct) {
      return [{
        productId: buyNowProduct.id,
        name: buyNowProduct.name,
        quantity: 1,
        price: buyNowProduct.price,
        imageUrl: buyNowProduct.imageUrl
      }];
    }
    return cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      imageUrl: item.product.imageUrl
    }));
  }, [productId, buyNowProduct, cartItems]);

  const subtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [orderItems]);

  const shippingFee = subtotal >= 2000 ? 0 : 99;
  const grandTotal = subtotal + shippingFee;

  // Redirect if no items and no product ID
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const selectSavedAddress = (addr: any) => {
    setAddress({
      houseNo: addr.houseNo,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark || ''
    });
    toast({
      title: "Address Selected",
      description: `Shipping to your ${addr.label} location.`,
      duration: 2000
    });
  };

  const executeOrderPlacement = async () => {
    if (!db || !user || orderItems.length === 0) return;
    setIsProcessing(true);

    const orderData = {
      customerName: user.displayName || "Anonymous User",
      customerEmail: user.email!,
      items: orderItems,
      totalAmount: grandTotal,
      shippingAddress: address,
      phoneNumber: phone,
      paymentMethod,
      status: 'Pending',
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, 'orders'), orderData)
      .then(() => {
        if (!productId) clearCart();
        setConfirmedTotal(grandTotal);
        setIsSuccessModalOpen(true);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: orderData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsProcessing(false);
        setIsPaymentGatewayOpen(false);
      });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || orderItems.length === 0) return;

    if (!address.houseNo || !address.street || !address.city || !address.state || !address.pincode || !phone) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required address and contact fields.",
      });
      return;
    }

    if (paymentMethod === 'Online') {
      setIsPaymentGatewayOpen(true);
    } else {
      executeOrderPlacement();
    }
  };

  if (userLoading || (productId && productLoading)) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 font-black uppercase tracking-widest text-xs text-slate-400">Preparing Checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-10 space-y-8">
          <header className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Checkout</h1>
            <p className="text-slate-500 font-medium">Complete your details to finish your order.</p>
          </header>

          {/* Saved Addresses Quick Select */}
          {savedAddresses && savedAddresses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <MapPin className="h-3 w-3" /> Quick Select Delivery Spot
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedAddresses.map((addr: any) => (
                  <button 
                    key={addr.id}
                    onClick={() => selectSavedAddress(addr)}
                    className="flex flex-col items-start p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-primary transition-all text-left group"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center gap-2">
                        {addr.label === 'Home' ? <HomeIcon className="h-4 w-4 text-primary" /> : <Briefcase className="h-4 w-4 text-primary" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{addr.label}</span>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-slate-100 group-hover:bg-primary transition-colors" />
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 line-clamp-2">
                      {addr.houseNo}, {addr.street}, {addr.city}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Shipping Address Form */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden h-full">
                <CardHeader className="bg-white border-b border-slate-50 p-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-900">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black uppercase tracking-widest">Delivery Address</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Flat, House no., Building</Label>
                    <Input 
                      required 
                      value={address.houseNo}
                      onChange={e => setAddress({...address, houseNo: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Area, Street, Sector</Label>
                    <Input 
                      required 
                      value={address.street}
                      onChange={e => setAddress({...address, street: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Town/City</Label>
                    <Input 
                      required 
                      value={address.city}
                      onChange={e => setAddress({...address, city: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">State</Label>
                    <Input 
                      required 
                      value={address.state}
                      onChange={e => setAddress({...address, state: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pincode</Label>
                    <Input 
                      required 
                      maxLength={6}
                      value={address.pincode}
                      onChange={e => setAddress({...address, pincode: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Landmark (Optional)</Label>
                    <Input 
                      value={address.landmark}
                      onChange={e => setAddress({...address, landmark: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-50">
                   <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                      <Phone className="h-3 w-3" /> Contact Phone Number
                    </Label>
                    <Input 
                      required 
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 00000 00000"
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                </div>
                </CardContent>
              </Card>
              {/* Order Summary */}
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-slate-900 text-white h-full flex flex-col">
                <CardHeader className="p-8 border-b border-white/10">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-white/50">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8 flex-1 flex flex-col">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center group">
                      <div className="h-16 w-16 bg-white rounded-xl p-2 shrink-0 border border-white/10 relative overflow-hidden">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-white line-clamp-1 mb-0.5">{item.name}</p>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                          Qty: {item.quantity} | {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-black text-xs">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs font-bold text-white/60 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-white">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-white/60 uppercase tracking-widest">
                    <span>Shipping Fee</span>
                    <span className={shippingFee === 0 ? 'text-green-400' : 'text-white'}>
                      {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}
                    </span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Grand Total</span>
                      <p className="text-4xl font-black text-white">{formatCurrency(grandTotal)}</p>
                    </div>
                  </div>
                </div>

                <Button 
                  form="checkout-form"
                  type="submit"
                  disabled={isProcessing || orderItems.length === 0}
                  className="w-full h-16 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all group mt-6"
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  {isProcessing ? "Finalizing Order..." : "Confirm & Place Order"}
                  {!isProcessing && <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                </Button>

                <p className="text-[9px] text-center text-white/30 font-bold uppercase tracking-widest mt-4">
                  By clicking "Confirm", you agree to Z-MART's shipping and cancellation policies.
                </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-50 p-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-xl text-slate-900">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-black uppercase tracking-widest">Payment Method</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(val: any) => setPaymentMethod(val)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}>
                    <RadioGroupItem value="COD" className="sr-only" />
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Truck className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-sm uppercase">Cash on Delivery</p>
                      <p className="text-[10px] text-slate-500 font-bold">Pay when your order arrives</p>
                    </div>
                  </Label>

                  <Label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'Online' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}>
                    <RadioGroupItem value="Online" className="sr-only" />
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-sm uppercase">Online Payment</p>
                      <p className="text-[10px] text-slate-500 font-bold">Secure Card / UPI / NetBanking</p>
                    </div>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>
          </form>
      </main>

      <OrderSuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          router.push('/account#orders');
        }}
        orderTotal={confirmedTotal}
      />
      <PaymentGatewayModal
        isOpen={isPaymentGatewayOpen}
        onClose={() => setIsPaymentGatewayOpen(false)}
        amount={grandTotal}
        onSuccess={executeOrderPlacement}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

