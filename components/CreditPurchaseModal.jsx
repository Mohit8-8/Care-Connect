"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CreditCard, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";

// Initialize Stripe (you'll need to add your publishable key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const CreditPurchaseModal = ({ isOpen, onClose, planName, planPrice, planDuration }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const creditAmount = planPrice === "$29" ? 30 : planPrice === "$49" ? 50 : 80;

  const handlePurchase = async () => {
    setIsProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Demo mode - directly process the credit purchase
      const response = await fetch("/api/payment-success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId: `demo_${Date.now()}`,
          creditAmount,
        }),
      });

      if (response.ok) {
        toast.success(`🎉 Demo Mode: Successfully purchased ${creditAmount} credits!`);
        onClose();
        // Refresh the page to show updated credits
        window.location.reload();
      } else {
        throw new Error("Failed to process demo purchase");
      }
    } catch (error) {
      console.error("Demo purchase error:", error);
      toast.error("Demo purchase failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            Purchase Credits
            <Badge variant="outline" className="bg-orange-900/20 border-orange-700/30 text-orange-400 text-xs">
              DEMO MODE
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <Card className="bg-muted/20 border-emerald-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white">{planName}</CardTitle>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-400">{planPrice}</span>
                <Badge variant="outline" className="bg-emerald-900/20 border-emerald-700/30">
                  {planDuration}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                You'll receive <span className="text-emerald-400 font-semibold">{creditAmount} credits</span> for this consultation package.
              </p>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Payment Method</Label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="justify-start"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Credit/Debit Card
              </Button>
            </div>
          </div>

          {/* Payment Form Placeholder */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipcode">ZIP Code</Label>
                <Input
                  id="zipcode"
                  placeholder="12345"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Purchase ${creditAmount} Credits`
              )}
            </Button>
          </div>

          <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-3">
            <p className="text-xs text-orange-400 text-center">
              🧪 <strong>Demo Mode:</strong> This is a demonstration. No real payment will be processed.
              Credits will be added to your account for testing purposes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditPurchaseModal;
