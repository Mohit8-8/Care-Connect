"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { addMedicineToInventory } from "@/actions/medicine-inventory";

const MEDICINE_CATEGORIES = [
  "Analgesics",
  "Antibiotics",
  "Antidepressants",
  "Antihistamines",
  "Cardiovascular",
  "Diabetes",
  "Digestive",
  "Hormonal",
  "Respiratory",
  "Vitamins & Supplements",
  "Other"
];

export default function AddMedicineModal({ onMedicineAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medicineName: "",
    genericName: "",
    category: "",
    description: "",
    manufacturer: "",
    dosage: "",
    price: "",
    stock: "",
    minStockLevel: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.medicineName || !formData.category || !formData.price || !formData.stock) {
      alert("Please fill in all required fields (Medicine Name, Category, Price, Stock)");
      return;
    }

    try {
      setLoading(true);
      const submitData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "") {
          submitData.append(key, value);
        }
      });

      await addMedicineToInventory(submitData);

      // Reset form
      setFormData({
        medicineName: "",
        genericName: "",
        category: "",
        description: "",
        manufacturer: "",
        dosage: "",
        price: "",
        stock: "",
        minStockLevel: ""
      });

      setOpen(false);

      // Notify parent component to refresh data
      if (onMedicineAdded) {
        onMedicineAdded();
      }

      alert("Medicine added to inventory successfully!");
    } catch (error) {
      console.error("Failed to add medicine:", error);
      alert("Failed to add medicine: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medicine to Inventory</DialogTitle>
          <DialogDescription>
            Add a new medicine to your store's inventory. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medicineName">Medicine Name *</Label>
              <Input
                id="medicineName"
                value={formData.medicineName}
                onChange={(e) => handleInputChange("medicineName", e.target.value)}
                placeholder="e.g., Paracetamol 500mg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genericName">Generic Name</Label>
              <Input
                id="genericName"
                value={formData.genericName}
                onChange={(e) => handleInputChange("genericName", e.target.value)}
                placeholder="e.g., Acetaminophen"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {MEDICINE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the medicine..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                placeholder="e.g., Pfizer, Cipla"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => handleInputChange("dosage", e.target.value)}
                placeholder="e.g., 500mg, 10ml"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Min Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => handleInputChange("minStockLevel", e.target.value)}
                placeholder="Alert threshold"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Medicine"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
