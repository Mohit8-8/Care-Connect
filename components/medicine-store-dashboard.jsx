"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Plus, Eye, UserPlus } from "lucide-react";
import { getMedicineStoreStats } from "@/actions/medicine-store";
import { getStoreInventory } from "@/actions/medicine-inventory";
import { getStoreOrders } from "@/actions/medicine-orders";
import AddMedicineModal from "@/components/AddMedicineModal";

export default function MedicineStoreDashboard() {
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStoreOwner, setIsStoreOwner] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResult, inventoryResult, ordersResult] = await Promise.all([
        getMedicineStoreStats(),
        getStoreInventory(),
        getStoreOrders(),
      ]);

      setStats(statsResult.stats);
      setInventory(inventoryResult.inventory);
      setOrders(ordersResult.orders);
      setIsStoreOwner(true);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      if (error.message && error.message.includes("Medicine store not found")) {
        setIsStoreOwner(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineAdded = () => {
    // Refresh dashboard data after adding a medicine
    loadDashboardData();
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      PREPARING: "bg-purple-100 text-purple-800",
      READY_FOR_PICKUP: "bg-green-100 text-green-800",
      DELIVERED: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show onboarding message for non-store owners
  if (!isStoreOwner) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl text-orange-800">
              Complete Your Medicine Store Setup
            </CardTitle>
            <CardDescription className="text-orange-600">
              You need to complete the onboarding process to access the medicine store dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700">
              To manage your medicine store inventory and serve patients, please complete your store registration.
            </p>
            <Button
              onClick={() => router.push("/onboarding")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Complete Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Medicine Store Dashboard</h1>
        <AddMedicineModal onMedicineAdded={handleMedicineAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMedicines || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>
                Manage your medicine stock and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.medicine.name}</h3>
                      <p className="text-sm text-gray-600">{item.medicine.category}</p>
                      <p className="text-sm text-gray-500">Stock: {item.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.price.toFixed(2)}</p>
                      {item.stock <= (item.minStockLevel || 0) && (
                        <Badge variant="destructive" className="mt-1">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {inventory.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No medicines in inventory. Add your first medicine to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Track and manage customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{order.medicine.name}</h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {order.quantity} | Customer: {order.patient.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace("_", " ")}
                      </Badge>
                      <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No orders yet. Orders will appear here when customers place them.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pending Orders:</span>
                    <span className="font-semibold">{stats?.pendingOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-semibold">{stats?.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-semibold">${stats?.totalRevenue?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Low Stock Items:</span>
                    <span className="font-semibold text-red-600">{stats?.lowStockItems || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-semibold">{stats?.totalMedicines || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
