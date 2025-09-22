"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, MapPin, Phone, Plus } from "lucide-react";
import { placeMedicineOrder } from "@/actions/medicine-orders";
import { useCart } from "@/lib/cart-context";

export default function MedicineListing() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  const { addToCart, updateStock } = useCart();

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadStoreMedicines();
    }
  }, [selectedStore, selectedCategory]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/patient/stores");
      const result = await response.json();
      if (result.stores) {
        setStores(result.stores);
      } else {
        console.error("Failed to load stores:", result.error);
      }
    } catch (error) {
      console.error("Failed to load stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreMedicines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("storeId", selectedStore.id);
      if (selectedCategory && selectedCategory !== "all-categories") {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/patient/medicines?${params}`);
      const result = await response.json();

      if (result.medicines) {
        setMedicines(result.medicines);
      } else {
        console.error("Failed to load medicines:", result.error);
        setMedicines([]);
      }
    } catch (error) {
      console.error("Failed to load medicines:", error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("search", query);

        const response = await fetch(`/api/patient/medicines?${params}`);
        const result = await response.json();

        if (result.medicines) {
          setMedicines(result.medicines);
        } else {
          console.error("Failed to search medicines:", result.error);
          setMedicines([]);
        }
      } catch (error) {
        console.error("Failed to search medicines:", error);
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    } else if (!selectedStore) {
      setMedicines([]);
    } else {
      loadStoreMedicines();
    }
  };

  const handleAddToCart = async (medicine, store, quantity = 1) => {
    try {
      // Find the inventory item to get the correct price and stock
      const inventoryItem = medicines.find(item =>
        item.medicine.id === medicine.id && item.store.id === store.id
      );

      if (!inventoryItem) {
        alert("Medicine not found in inventory!");
        return;
      }

      const inventoryPrice = inventoryItem.price;
      const inventoryId = inventoryItem.id;
      const currentStock = inventoryItem.stock;

      // Check if enough stock is available
      if (currentStock < quantity) {
        alert(`Only ${currentStock} items available in stock!`);
        return;
      }

      // Update stock in real-time
      const newStock = currentStock - quantity;
      await updateStock(inventoryId, newStock);

      // Add to cart
      addToCart(medicine.id, store.id, inventoryId, medicine, store, quantity, inventoryPrice);

      // Update local state to reflect new stock
      setMedicines(prevMedicines =>
        prevMedicines.map(item =>
          item.id === inventoryId
            ? { ...item, stock: newStock }
            : item
        )
      );

      alert(`${medicine.name} added to cart!`);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    }
  };

  const handleOrder = async (medicineId, quantity, storeId = null) => {
    try {
      setOrdering(true);

      // Find the inventory item to get current stock
      const inventoryItem = medicines.find(item => item.medicineId === medicineId);
      if (!inventoryItem) {
        alert("Medicine not found in inventory!");
        return;
      }

      const currentStock = inventoryItem.stock;

      // Check if enough stock is available
      if (currentStock < quantity) {
        alert(`Only ${currentStock} items available in stock!`);
        return;
      }

      const formData = new FormData();
      formData.append("storeId", storeId || selectedStore.id);
      formData.append("medicineId", medicineId);
      formData.append("quantity", quantity);

      await placeMedicineOrder(formData);

      // Update stock in real-time
      const newStock = currentStock - quantity;
      await updateStock(inventoryItem.id, newStock);

      // Update local state to reflect new stock
      setMedicines(prevMedicines =>
        prevMedicines.map(item =>
          item.id === inventoryItem.id
            ? { ...item, stock: newStock }
            : item
        )
      );

      alert("Order placed successfully!");

    } catch (error) {
      console.error("Failed to place order:", error);
      alert("Failed to place order: " + error.message);
    } finally {
      setOrdering(false);
    }
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(medicines.map(item => item.medicine.category))];
    return categories;
  };

  if (loading && stores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Browse Medicines</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">All Categories</SelectItem>
            {getUniqueCategories().map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Store Selection */}
      {!searchQuery && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select a Medicine Store</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <Card
                key={store.id}
                className={`cursor-pointer transition-colors ${
                  selectedStore?.id === store.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedStore(store)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {store.storeName}
                  </CardTitle>
                  <CardDescription>{store.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">{store.storeAddress}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="text-sm">{store.storePhone}</span>
                    </div>
                    <p className="text-sm text-gray-600">{store.storeDescription}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Medicines List */}
      {selectedStore && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Medicines at {selectedStore.storeName}
            </h2>
            <Button
              variant="outline"
              onClick={() => setSelectedStore(null)}
            >
              Change Store
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
            </div>
          ) : medicines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicines.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.medicine.name}</CardTitle>
                    <CardDescription>{item.medicine.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-green-600">
                          ${item.price.toFixed(2)}
                        </span>
                        <Badge variant={item.stock > 0 ? "default" : "destructive"}>
                          {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                        </Badge>
                      </div>

                      {item.medicine.genericName && (
                        <p className="text-sm text-gray-600">
                          Generic: {item.medicine.genericName}
                        </p>
                      )}

                      {item.medicine.manufacturer && (
                        <p className="text-sm text-gray-600">
                          Manufacturer: {item.medicine.manufacturer}
                        </p>
                      )}

                      {item.medicine.dosage && (
                        <p className="text-sm text-gray-600">
                          Dosage: {item.medicine.dosage}
                        </p>
                      )}

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={item.stock === 0}
                            onClick={() => handleAddToCart(item.medicine, item.store)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button
                            className="flex-1"
                            disabled={item.stock === 0 || ordering}
                            onClick={() => handleOrder(item.medicineId, 1)}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Order Now
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? "No medicines found matching your search."
                  : "No medicines available in this store."
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchQuery && !selectedStore && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Search Results for "{searchQuery}"
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
            </div>
          ) : medicines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicines.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.medicine.name}</CardTitle>
                    <CardDescription>{item.medicine.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-green-600">
                          ${item.price.toFixed(2)}
                        </span>
                        <Badge variant={item.stock > 0 ? "default" : "destructive"}>
                          {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600">
                        Store: {item.store.storeName}
                      </p>

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={item.stock === 0}
                            onClick={() => handleAddToCart(item.medicine, item.store)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button
                            className="flex-1"
                            disabled={item.stock === 0 || ordering}
                            onClick={() => handleOrder(item.medicineId, 1, item.store.id)}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Order Now
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          View Store
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No medicines found matching your search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
