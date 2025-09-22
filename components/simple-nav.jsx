"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/medicine-store" },
  { name: "Inventory", href: "/medicine-store/inventory" },
  { name: "Orders", href: "/medicine-store/orders" },
];

export function SimpleNav() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-4 mb-8">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <Button variant={isActive ? "default" : "outline"}>
              {item.name}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
