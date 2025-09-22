"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, MapPin, User, CreditCard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { placeMedicineOrder } from "@/actions/medicine-orders";

const DELIVERY_OPTIONS = [
  { value: "standard", label: "Standard Delivery (2-3 days)", price: 0 },
  { value: "express", label: "Express Delivery (1-2 days)", price: 50 },
  { value: "urgent", label: "Urgent Delivery (Same day)", price: 100 }
];

const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "upi", label: "UPI" },
  { value: "netbanking", label: "Net Banking" }
];

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Checkout form state
  const [deliveryInfo, setDeliveryInfo] = useState({
    deliveryOption: "standard",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: ""
  });

  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    paymentMethod: "cod",
    notes: ""
  });

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      setLoading(true);

      // Place orders for all items in cart
      for (const item of cart.items) {
        const formData = new FormData();
        formData.append("storeId", item.storeId);
        formData.append("medicineId", item.medicineId);
        formData.append("quantity", item.quantity);

        await placeMedicineOrder(formData);
      }

      alert("Orders placed successfully!");
      clearCart();
      setCheckoutStep(1);
    } catch (error) {
      console.error("Failed to place orders:", error);
      alert("Failed to place orders: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedDeliveryOption = DELIVERY_OPTIONS.find(
    option => option.value === deliveryInfo.deliveryOption
  );

  const deliveryCharge = selectedDeliveryOption ? selectedDeliveryOption.price : 0;
  const finalTotal = cart.totalPrice + deliveryCharge;

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-4">Add some medicines to get started!</p>
          <Button onClick={() => window.location.href = "/medicines"}>
            Browse Medicines
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button variant="outline" onClick={() => window.location.href = "/medicines"}>
          Continue Shopping
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart Items ({cart.totalItems})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.medicine.name}</h3>
                    <p className="text-sm text-gray-600">{item.medicine.category}</p>
                    <p className="text-sm text-gray-500">Store: {item.store.storeName}</p>
                    <p className="text-lg font-bold text-green-600">${(item.unitPrice || 0).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span>${cart.totalPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>${deliveryCharge.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>

              <Button
                className="w-full"
                onClick={() => setCheckoutStep(2)}
                disabled={cart.items.length === 0}
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Steps */}
      {checkoutStep >= 2 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              checkoutStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="font-semibold">Delivery Information</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryOption">Delivery Option</Label>
                  <Select
                    value={deliveryInfo.deliveryOption}
                    onValueChange={(value) => setDeliveryInfo(prev => ({ ...prev, deliveryOption: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} - ${option.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea
                  id="address"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your full delivery address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={deliveryInfo.city}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={deliveryInfo.state}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={deliveryInfo.pincode}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="123456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={deliveryInfo.phone}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <Button
                onClick={() => setCheckoutStep(3)}
                className="w-full"
              >
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {checkoutStep >= 3 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              checkoutStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="font-semibold">Personal & Payment Details</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={personalInfo.name}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={personalInfo.paymentMethod}
                  onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={personalInfo.notes}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions..."
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Items ({cart.totalItems})</span>
                    <span>${cart.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>${deliveryCharge.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCheckoutStep(2)}
                  className="flex-1"
                >
                  Back to Delivery
                </Button>
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Placing Orders..." : "Place Orders"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
