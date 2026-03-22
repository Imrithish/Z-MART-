"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldCheck, Lock, CreditCard, Smartphone, QrCode } from "lucide-react"
import Image from "next/image"

interface PaymentGatewayModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  onSuccess: () => void
}

export function PaymentGatewayModal({ isOpen, onClose, amount, onSuccess }: PaymentGatewayModalProps) {
  const [activeTab, setActiveTab] = useState<"card" | "upi" | "qr">("card")

  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [name, setName] = useState("")
  const [upiId, setUpiId] = useState("")
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"input" | "processing" | "success">("input")

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }
    return v
  }

  const handlePay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsProcessing(true)
    setPaymentStep("processing")

    await new Promise(resolve => setTimeout(resolve, 2500))
    setPaymentStep("success")
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setTimeout(() => {
      setIsProcessing(false)
      setPaymentStep("input")
      setActiveTab("card")
      setCardNumber("")
      setExpiry("")
      setCvv("")
      setName("")
      setUpiId("")
    }, 500)

    onSuccess()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      {/* Rectangular Page layout: wide, squared corners, grid layout on desktop */}
      <DialogContent className="w-[95vw] md:w-[85vw] max-w-5xl min-h-[500px] max-h-[90vh] p-0 bg-white border-none rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-y-auto overflow-x-hidden md:overflow-hidden">
        
        {/* LEFT COLUMN: Modern Invoice/Hero Section */}
        <div className="w-full md:w-5/12 bg-slate-900 border-r border-slate-800 p-6 md:p-12 text-white relative flex flex-col shrink-0 justify-center">
          <div className="absolute top-0 right-0 w-full h-full bg-primary/10 blur-3xl rounded-none scale-150 transform-gpu opacity-50" />
          
          <DialogHeader className="relative z-10 space-y-2 md:space-y-6 text-left flex-1 flex flex-row md:flex-col justify-start items-center md:items-start md:justify-center pr-10 md:pr-0 gap-4 md:gap-0">
            <div className="flex items-center gap-2 text-primary md:hidden">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="hidden md:flex items-center gap-2 text-primary">
              <ShieldCheck className="h-8 w-8" />
              <span className="font-black tracking-widest uppercase text-sm">Secure Entry</span>
            </div>
            
            <div className="space-y-1 md:space-y-2 text-left">
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                Total Amount Due
              </DialogDescription>
              <DialogTitle className="text-3xl md:text-6xl font-black tracking-tighter">
                ₹{amount.toLocaleString('en-IN')}
              </DialogTitle>
            </div>
            
            <div className="hidden md:block space-y-4 pt-12 mt-auto">
              <div className="flex gap-4 opacity-50">
                <div className="w-12 h-8 bg-white/10 rounded-sm" />
                <div className="w-12 h-8 bg-white/10 rounded-sm" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Z-MART Encrypted Gateway<br/>End-to-End Safety</p>
            </div>
          </DialogHeader>
        </div>

        {/* RIGHT COLUMN: The Interactive Forms */}
        <div className="w-full md:w-7/12 flex flex-col h-full bg-slate-50 relative overflow-y-auto">
          <div className="flex-1 p-6 md:p-12">
            
            {paymentStep === "input" && (
              <div className="max-w-md mx-auto space-y-6 md:space-y-8 mt-2 md:mt-4">
                
                {/* Rectangular Sharp Tabs */}
                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab("card")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-none border-b-2 ${activeTab === "card" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}
                  >
                    <CreditCard className="h-4 w-4" /> Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("upi")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-none border-b-2 ${activeTab === "upi" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}
                  >
                    <Smartphone className="h-4 w-4" /> UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-none border-b-2 ${activeTab === "qr" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}
                  >
                    <QrCode className="h-4 w-4" /> QR Code
                  </button>
                </div>

                {/* Card Form */}
                {activeTab === "card" && (
                  <form onSubmit={handlePay} className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2 md:space-y-3">
                      <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cardholder Name</Label>
                      <div className="relative">
                        <Input 
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="JOHN DOE"
                          className="h-14 bg-white border-slate-200 uppercase font-bold text-slate-900 focus:ring-slate-900 rounded-none pl-12 shadow-sm"
                          required
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <Label htmlFor="card" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Number</Label>
                      <div className="relative">
                        <Input 
                          id="card"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          className="h-14 bg-white border-slate-200 font-bold text-slate-900 tracking-widest focus:ring-slate-900 rounded-none pl-12 shadow-sm"
                          required
                        />
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="expiry" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiration</Label>
                        <Input 
                          id="expiry"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="h-14 bg-white border-slate-200 font-bold text-slate-900 tracking-widest focus:ring-slate-900 rounded-none px-4 shadow-sm"
                          required
                        />
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="cvv" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Code</Label>
                        <Input 
                          id="cvv"
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          maxLength={4}
                          className="h-14 bg-white border-slate-200 font-black text-slate-900 tracking-widest focus:ring-slate-900 rounded-none px-4 shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-14 md:h-16 rounded-none bg-slate-900 hover:bg-yellow-400 hover:text-black hover:shadow-yellow-400/20 text-white font-black tracking-widest uppercase mt-4 md:mt-8 shadow-xl shadow-slate-900/10 active:scale-95 transition-all text-sm">
                      Confirm & Pay
                    </Button>
                  </form>
                )}

                {/* UPI Form */}
                {activeTab === "upi" && (
                  <form onSubmit={handlePay} className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-4 duration-300 py-4">
                    <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-none text-center shadow-sm">
                       <Smartphone className="h-10 w-10 text-slate-900 mx-auto mb-4 opacity-80" />
                       <h4 className="font-black text-slate-900 uppercase tracking-widest">Connect UPI App</h4>
                       <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Google Pay, PhonePe, Paytm</p>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <Label htmlFor="upi" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Virtual Payment Address (VPA)</Label>
                      <div className="relative">
                        <Input 
                          id="upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                          placeholder="your.name@okhdfcbank"
                          className="h-14 bg-white border-slate-200 font-bold text-slate-900 focus:ring-slate-900 rounded-none pl-12 shadow-sm"
                          required
                        />
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-14 md:h-16 rounded-none bg-slate-900 hover:bg-yellow-400 hover:text-black hover:shadow-yellow-400/20 text-white font-black tracking-widest uppercase mt-4 shadow-xl shadow-slate-900/10 active:scale-95 transition-all text-sm">
                      Send Request
                    </Button>
                  </form>
                )}

                {/* QR Form */}
                {activeTab === "qr" && (
                  <div className="space-y-6 md:space-y-8 text-center animate-in fade-in zoom-in-95 duration-300 py-4">
                    <div className="bg-white p-4 border border-slate-200 shadow-sm inline-block rounded-none">
                      <div className="relative w-56 h-56 overflow-hidden bg-slate-50">
                        <Image 
                          src="/qr.jpg" 
                          alt="Scan QR Code to Pay" 
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-black text-xl text-slate-900 uppercase tracking-widest">Scan to Pay</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Open your UPI app and scan</p>
                    </div>

                    <Button onClick={() => handlePay()} variant="outline" className="w-full h-14 md:h-16 rounded-none border-2 border-slate-900 bg-transparent hover:bg-yellow-400 hover:border-yellow-400 hover:text-black text-slate-900 font-black tracking-widest uppercase mt-4 active:scale-95 transition-all text-sm">
                      Payment Completed Successfully
                    </Button>
                  </div>
                )}
              </div>
            )}

            {paymentStep === "processing" && (
              <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-slate-900/5 rounded-full blur-2xl animate-pulse" />
                  <Loader2 className="h-20 w-20 text-slate-900 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-3">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase">Authenticating</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Verifying secure connection...</p>
                </div>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in zoom-in-95 duration-500">
                <div className="h-24 w-24 bg-green-500 text-white rounded-none flex items-center justify-center shadow-2xl shadow-green-500/20">
                  <ShieldCheck className="h-12 w-12" />
                </div>
                <div className="text-center space-y-3">
                  <h3 className="font-black text-3xl text-slate-900 tracking-tighter uppercase">Approved</h3>
                  <p className="text-xs font-bold text-green-600 tracking-widest uppercase">Transaction secured</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
