"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { getStoreInventory } from "@/actions/medicine-inventory";
import { addMedicineToInventory, updateMedicineInventory, removeMedicineFromInventory } from "@/actions/medicine-inventory";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    medicineName: "",
    genericName: "",
    category: "",
    description: "",
    manufacturer: "",
    dosage: "",
    price: "",
    stock: "",
    minStockLevel: "",
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const result = await getStoreInventory();
      setInventory(result.inventory || []);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value);
      });

      await addMedicineToInventory(submitData);
      setShowAddDialog(false);
      resetForm();
      loadInventory();
    } catch (error) {
      console.error("Failed to add medicine:", error);
      alert("Failed to add medicine: " + error.message);
    }
  };

  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append("inventoryId", editingItem.id);
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value);
      });

      await updateMedicineInventory(submitData);
      setEditingItem(null);
      resetForm();
      loadInventory();
    } catch (error) {
      console.error("Failed to update medicine:", error);
      alert("Failed to update medicine: " + error.message);
    }
  };

  const handleRemoveMedicine = async (inventoryId) => {
    if (!confirm("Are you sure you want to remove this medicine from inventory?")) {
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("inventoryId", inventoryId);

      await removeMedicineFromInventory(submitData);
      loadInventory();
    } catch (error) {
      console.error("Failed to remove medicine:", error);
      alert("Failed to remove medicine: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      medicineName: "",
      genericName: "",
      category: "",
      description: "",
      manufacturer: "",
      dosage: "",
      price: "",
      stock: "",
      minStockLevel: "",
    });
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      price: item.price.toString(),
      stock: item.stock.toString(),
      minStockLevel: item.minStockLevel?.toString() || "",
    });
  };

  const categories = [
    "Analgesics",
    "Antibiotics",
    "Antidepressants",
    "Antihistamines",
    "Cardiovascular",
    "Diabetes",
    "Digestive",
    "Respiratory",
    "Vitamins & Supplements",
    "Other"
  ];

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
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
              <DialogDescription>
                Add a new medicine to your store inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medicineName">Medicine Name *</Label>
                  <Input
                    id="medicineName"
                    value={formData.medicineName}
                    onChange={(e) => handleInputChange("medicineName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="genericName">Generic Name</Label>
                  <Input
                    id="genericName"
                    value={formData.genericName}
                    onChange={(e) => handleInputChange("genericName", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => handleInputChange("dosage", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minStockLevel">Min Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => handleInputChange("minStockLevel", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Medicine</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item) => (
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
                  <div className="text-right">
                    <p className="font-semibold">Stock: {item.stock}</p>
                    {item.minStockLevel && (
                      <p className="text-sm text-gray-500">
                        Min: {item.minStockLevel}
                      </p>
                    )}
                  </div>
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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(item)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveMedicine(item.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inventory.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">
              No medicines in inventory. Add your first medicine to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Medicine</DialogTitle>
              <DialogDescription>
                Update medicine details and inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateMedicine} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price">Price *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock">Stock *</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-minStockLevel">Min Stock Level</Label>
                  <Input
                    id="edit-minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => handleInputChange("minStockLevel", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Medicine</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
