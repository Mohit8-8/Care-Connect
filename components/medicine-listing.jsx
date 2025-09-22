"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, MapPin, Phone, Plus, Store, ExternalLink, Package, Clock } from "lucide-react";
import { placeMedicineOrder } from "@/actions/medicine-orders";
import { useCart } from "@/lib/cart-context";
import Link from "next/link";

export default function MedicineListing() {
  const [stores, setStores] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showStoreInventory, setShowStoreInventory] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [storeFilteredMedicines, setStoreFilteredMedicines] = useState([]);

  const { addToCart, updateStock } = useCart();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [allMedicines, searchQuery, selectedCategory]);

  useEffect(() => {
    if (showStoreInventory && selectedStore) {
      filterStoreMedicines();
    }
  }, [filteredMedicines, storeSearchQuery, selectedStore, showStoreInventory]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStores(), loadAllMedicines()]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const response = await fetch("/api/patient/stores");
      const result = await response.json();
      if (result.stores) {
        setStores(result.stores);
      }
    } catch (error) {
      console.error("Failed to load stores:", error);
    }
  };

  const loadAllMedicines = async () => {
    try {
      const response = await fetch("/api/patient/medicines");
      const result = await response.json();
      if (result.medicines) {
        setAllMedicines(result.medicines);
      }
    } catch (error) {
      console.error("Failed to load medicines:", error);
    }
  };

  const filterMedicines = () => {
    let filtered = [...allMedicines];

    // Apply search filter
    if (searchQuery.trim().length >= 2) {
      filtered = filtered.filter(item =>
        item.medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.medicine.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.medicine.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all-categories") {
      filtered = filtered.filter(item =>
        item.medicine.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    setFilteredMedicines(filtered);
  };

  const filterStoreMedicines = () => {
    if (!showStoreInventory || !selectedStore) {
      setStoreFilteredMedicines(filteredMedicines);
      return;
    }

    let filtered = filteredMedicines.filter(item => item.store.id === selectedStore.id);

    // Apply store-specific search filter
    if (storeSearchQuery.trim().length >= 2) {
      filtered = filtered.filter(item =>
        item.medicine.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        item.medicine.genericName?.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        item.medicine.category.toLowerCase().includes(storeSearchQuery.toLowerCase())
      );
    }

    setStoreFilteredMedicines(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedStore(null);
    setShowStoreInventory(false);
  };

  const handleStoreSearch = (query) => {
    setStoreSearchQuery(query);
  };

  const handleStoreClick = async (store) => {
    setSelectedStore(store);
    setShowStoreInventory(true);
    setSearchQuery("");
    setStoreSearchQuery("");

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("storeId", store.id);

      const response = await fetch(`/api/patient/medicines?${params}`);
      const result = await response.json();

      if (result.medicines) {
        setFilteredMedicines(result.medicines);
      }
    } catch (error) {
      console.error("Failed to load store medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (medicine, store, quantity = 1) => {
    try {
      const inventoryItem = filteredMedicines.find(item =>
        item.medicine.id === medicine.id && item.store.id === store.id
      );

      if (!inventoryItem) {
        alert("Medicine not found in inventory!");
        return;
      }

      const inventoryPrice = inventoryItem.price;
      const inventoryId = inventoryItem.id;
      const currentStock = inventoryItem.stock;

      if (currentStock < quantity) {
        alert(`Only ${currentStock} items available in stock!`);
        return;
      }

      const newStock = currentStock - quantity;
      await updateStock(inventoryId, newStock);

      addToCart(medicine.id, store.id, inventoryId, medicine, store, quantity, inventoryPrice);

      setFilteredMedicines(prevMedicines =>
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

  const handleOrder = async (medicineId, quantity, storeId) => {
    try {
      setOrdering(true);

      const inventoryItem = filteredMedicines.find(item => item.medicineId === medicineId);
      if (!inventoryItem) {
        alert("Medicine not found in inventory!");
        return;
      }

      const currentStock = inventoryItem.stock;

      if (currentStock < quantity) {
        alert(`Only ${currentStock} items available in stock!`);
        return;
      }

      const formData = new FormData();
      formData.append("storeId", storeId);
      formData.append("medicineId", medicineId);
      formData.append("quantity", quantity);

      await placeMedicineOrder(formData);

      const newStock = currentStock - quantity;
      await updateStock(inventoryItem.id, newStock);

      setFilteredMedicines(prevMedicines =>
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
    const categories = [...new Set(allMedicines.map(item => item.medicine.category))];
    return categories;
  };

  const getMedicinesByStore = () => {
    const storeMap = {};
    filteredMedicines.forEach(item => {
      if (!storeMap[item.store.id]) {
        storeMap[item.store.id] = {
          store: item.store,
          medicines: []
        };
      }
      storeMap[item.store.id].medicines.push(item);
    });
    return Object.values(storeMap);
  };

  if (loading && allMedicines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Browse Medicines</h1>
          <p className="text-gray-600 mt-1">
            Search and order medicines from verified stores
          </p>
        </div>
        <Link href="/medicine-stores">
          <Button variant="outline" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            View All Stores
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Universal Search */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search medicines by name, generic name, or category..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 text-lg py-3"
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

          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              Searching for "{searchQuery}" across all verified stores...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Store Access */}
      {stores.length > 0 && !searchQuery && !showStoreInventory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-green-600" />
              Verified Medicine Stores
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {stores.length} Store{stores.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription>
              Click on any store to browse their complete medicine inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.slice(0, 6).map((store) => (
                <Card
                  key={store.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-green-200 hover:border-green-300"
                  onClick={() => handleStoreClick(store)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg">{store.storeName}</CardTitle>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Verified
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      by {store.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{store.storeAddress}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{store.storePhone}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStoreClick(store);
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Browse Inventory
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {stores.length > 6 && (
              <div className="text-center mt-4">
                <Link href="/medicine-stores">
                  <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                    View All {stores.length} Stores
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Store Inventory View */}
      {showStoreInventory && selectedStore && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-green-600" />
                  {selectedStore.storeName} - Complete Inventory
                </CardTitle>
                <CardDescription>
                  Browse all medicines available at this store
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStore(null);
                  setShowStoreInventory(false);
                  setFilteredMedicines(allMedicines);
                  setStoreSearchQuery("");
                }}
              >
                Back to Search
              </Button>
            </div>

            {/* Store-Specific Search Bar */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search medicines in ${selectedStore.storeName}...`}
                  value={storeSearchQuery}
                  onChange={(e) => handleStoreSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {storeSearchQuery && (
                <div className="mt-2 text-sm text-gray-600">
                  Searching for "{storeSearchQuery}" in {selectedStore.storeName}...
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeFilteredMedicines.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
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
                            onClick={() => handleOrder(item.medicineId, 1, item.store.id)}
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

            {storeFilteredMedicines.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">
                  {storeSearchQuery
                    ? `No medicines found matching "${storeSearchQuery}" in this store.`
                    : "No medicines available in this store."
                  }
                </p>
                {storeSearchQuery && (
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your search terms.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Universal Search Results */}
      {searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Search Results for "{searchQuery}"
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredMedicines.length} Result{filteredMedicines.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription>
              Found in {getMedicinesByStore().length} verified store{getMedicinesByStore().length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedicines.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
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
                              onClick={() => handleOrder(item.medicineId, 1, item.store.id)}
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
            )}

            {filteredMedicines.length === 0 && !loading && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">
                  No medicines found matching "{searchQuery}".
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search terms or browse by category.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!searchQuery && !showStoreInventory && filteredMedicines.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">
              No medicines available at the moment.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Please check back later or contact stores directly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
