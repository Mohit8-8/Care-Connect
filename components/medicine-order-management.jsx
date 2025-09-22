"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Phone,
} from "lucide-react";
import { getPatientOrders } from "@/actions/medicine-orders";
import { getStoreOrders, updateOrderStatus } from "@/actions/medicine-orders";
import { cancelMedicineOrder } from "@/actions/medicine-orders";

export default function MedicineOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // We'll need to get the user role from the session or context
      // For now, let's assume we can determine it from the available actions
      const result = await getPatientOrders(); // This will fail if not a patient
      setOrders(result.orders || []);
      setUserRole("PATIENT");
    } catch (error) {
      try {
        // If patient orders fail, try store orders
        const result = await getStoreOrders();
        setOrders(result.orders || []);
        setUserRole("MEDICINE_STORE");
      } catch (storeError) {
        console.error("Failed to load orders:", storeError);
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("status", newStatus);

      await updateOrderStatus(formData);
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update order status: " + error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("orderId", orderId);

      await cancelMedicineOrder(formData);
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel order: " + error.message);
    }
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

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: Clock,
      CONFIRMED: CheckCircle,
      PREPARING: Package,
      READY_FOR_PICKUP: Package,
      DELIVERED: Truck,
      CANCELLED: XCircle,
    };
    return icons[status] || Package;
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {userRole === "PATIENT" ? "My Medicine Orders" : "Store Orders"}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PREPARING">Preparing</SelectItem>
            <SelectItem value="READY_FOR_PICKUP">Ready for Pickup</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <StatusIcon className="h-5 w-5" />
                        {order.medicine.name}
                      </CardTitle>
                      <CardDescription>
                        Order #{order.id.slice(-8)} •{" "}
                        {new Date(order.orderDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-semibold">{order.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Price:</span>
                        <span className="font-semibold">
                          ₹{order.unitPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-bold text-lg">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {userRole === "PATIENT" ? (
                        <div>
                          <h4 className="font-semibold mb-2">Store Details:</h4>
                          <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              {order.store.storeName}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {order.store.storePhone}
                            </p>
                            <p>{order.store.storeAddress}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-semibold mb-2">
                            Customer Details:
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>{order.patient.name}</p>
                            <p>{order.patient.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {userRole === "PATIENT" && order.status === "PENDING" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel Order
                      </Button>
                    )}

                    {userRole === "MEDICINE_STORE" && (
                      <div className="flex gap-2">
                        {order.status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "CONFIRMED")
                            }
                          >
                            Confirm Order
                          </Button>
                        )}
                        {order.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "PREPARING")
                            }
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === "PREPARING" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "READY_FOR_PICKUP")
                            }
                          >
                            Ready for Pickup
                          </Button>
                        )}
                        {order.status === "READY_FOR_PICKUP" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "DELIVERED")
                            }
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {filterStatus === "all"
                ? "You haven't placed or received any orders yet."
                : `No orders with status "${filterStatus}".`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
