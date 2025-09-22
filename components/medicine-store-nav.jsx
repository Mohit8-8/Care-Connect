"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, BarChart3, Plus } from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/medicine-store",
    icon: BarChart3,
  },
  {
    name: "Inventory",
    href: "/medicine-store/inventory",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/medicine-store/orders",
    icon: ShoppingCart,
  },
];

export function MedicineStoreNav() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-4 mb-8">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? "default" : "outline"}
              className={cn(
                "flex items-center gap-2",
                isActive && "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
