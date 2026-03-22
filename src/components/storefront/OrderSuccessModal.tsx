"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, ArrowRight, Star, Sparkles, MapPin, MapPinned, CreditCard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
}

export function OrderSuccessModal({ isOpen, onClose, orderTotal }: OrderSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] md:w-[80vw] max-w-4xl max-h-[90vh] p-0 bg-white border-none rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-y-auto overflow-x-hidden md:overflow-hidden">
        
        {/* LEFT COLUMN: Success Hero */}
        <div className="w-full md:w-5/12 bg-green-500 border-r border-green-600 p-6 pt-12 md:p-12 text-white relative flex flex-col shrink-0 justify-center overflow-hidden">
          {/* Confetti Particles */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-2 rounded-none animate-bounce"
                  style={{
                    backgroundColor: ['#ffffff', '#0f172a', '#fbbf24', '#f1f5f9', '#000000'][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * -20}%`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.8,
                    transform: `translateY(${Math.random() * 500}px) rotate(${Math.random() * 360}deg)`
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative z-10 space-y-4 md:space-y-8 flex flex-col items-center text-center">
            {/* Success Icon */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-white/20 scale-[2] blur-2xl opacity-50 rounded-none" />
              <div className="relative h-16 w-16 md:h-24 md:w-24 bg-white rounded-none flex items-center justify-center shadow-2xl rotate-3 animate-in zoom-in spin-in-12 duration-700">
                <CheckCircle2 className="h-8 w-8 md:h-12 md:w-12 text-green-500" />
              </div>
            </div>

            <DialogHeader className="space-y-1 md:space-y-2">
              <DialogTitle className="text-3xl md:text-5xl font-black tracking-tighter uppercase whitespace-nowrap">
                Victory!
              </DialogTitle>
              <p className="font-bold uppercase tracking-widest text-[10px] text-green-100">
                Your order is confirmed
              </p>
            </DialogHeader>

            {/* Bottom Trust Badge */}
            <div className="hidden md:flex mt-8 pt-8 flex-col items-center gap-2 opacity-80 border-t border-green-400/50 w-full animate-in fade-in duration-1000 delay-700">
              <div className="flex text-amber-300">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
              </div>
              <span className="text-[9px] font-black text-green-100 uppercase tracking-[0.3em] text-center">
                Z-MART Premium<br/>Fulfillment Service
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Details & Actions */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-slate-50 relative z-10">
          
          <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-700 delay-150">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">Order Summary</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
              We've officially received your order! Our warehouse team is already actively picking and meticulously packing your premium Z-MART essentials.
            </p>
          </div>

          <div className="mt-8 p-6 bg-white rounded-none border-2 border-slate-100 shadow-sm relative animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
            <div className="absolute -top-3 left-6 bg-slate-900 text-white text-[9px] px-3 py-1 font-black uppercase tracking-widest rounded-none">
              Invoice Details
            </div>
            
            <div className="flex justify-between items-center mb-4 pt-2">
              <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                <CreditCard className="h-4 w-4" /> Amount Charged
              </span>
              <span className="text-3xl font-black text-slate-900">{formatCurrency(orderTotal)}</span>
            </div>
            
            <div className="h-px w-full bg-slate-100 my-4" />
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                <MapPinned className="h-4 w-4" /> Status
              </span>
              <span className="text-[10px] font-black text-slate-900 bg-emerald-100 px-3 py-1 rounded-none uppercase tracking-widest border border-emerald-200">
                Preparing to Ship
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8 md:mt-10 animate-in slide-in-from-bottom-12 fade-in duration-700 delay-500">
            <Button asChild className="h-14 md:h-16 rounded-2xl bg-slate-900 hover:bg-yellow-400 text-white hover:text-black font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:shadow-yellow-400/20 hover:-translate-y-1 active:scale-95 duration-300 transition-all group flex-1 text-xs">
              <Link href="/account#orders" onClick={onClose}>
                Track Order <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-14 md:h-16 rounded-2xl border-2 border-slate-200 text-slate-500 hover:text-black hover:border-yellow-400 font-black uppercase tracking-widest bg-transparent hover:bg-yellow-400 hover:shadow-xl hover:shadow-yellow-400/10 hover:-translate-y-1 active:scale-95 duration-300 transition-all flex-1 text-xs">
              <Link href="/products" onClick={onClose}>
                Keep Shopping
              </Link>
            </Button>
          </div>
          
        </div>

      </DialogContent>
    </Dialog>
  );
}
