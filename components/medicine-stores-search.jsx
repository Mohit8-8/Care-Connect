"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

export default function MedicineStoresSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim() && !isLoading) {
      setIsLoading(true);
      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      window.location.href = `/medicines?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  return (
    <Card className="mb-8 border border-gray-200 shadow-sm">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input Section */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Search Medicines
              </h3>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by medicine name, generic name, or category..."
                className="pl-10 pr-4 py-3 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
              />
            </div>

            {/* Search suggestions */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">💊 Brand names</span>
              <span className="bg-gray-100 px-2 py-1 rounded">🧬 Generic names</span>
              <span className="bg-gray-100 px-2 py-1 rounded">🏥 Categories</span>
            </div>
          </div>

          {/* Search Button Section */}
          <div className="lg:flex lg:flex-col lg:justify-center">
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors min-w-[180px]"
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </>
                )}
              </div>
            </Button>

            <p className="text-sm text-gray-600 mt-2 text-center lg:text-left">
              Search across verified stores
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            🔍 <strong>Smart Search:</strong> Find medicines by name, generic name, or category.
            All results are from verified stores with real-time inventory updates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
