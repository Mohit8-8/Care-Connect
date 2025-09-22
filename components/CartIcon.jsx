"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartIcon() {
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount();

  return (
    <div className="relative">
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </div>
  );
}
