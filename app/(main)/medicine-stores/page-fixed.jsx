import { getVerifiedMedicineStores } from "@/actions/patient";
import { PageHeader } from "@/components/page-header";
import { Store, MapPin, Phone, ShoppingCart, ExternalLink, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/onboarding";
import MedicineStoresSearch from "@/components/medicine-stores-search";

export default async function MedicineStoresPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "PATIENT") {
    redirect("/onboarding");
  }

  const { stores, error } = await getVerifiedMedicineStores();

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        icon={<Store />}
        title="Verified Medicine Stores"
        backLink="/medicines"
        backLabel="Browse Medicines"
      />

      {/* Universal Search Bar */}
      <MedicineStoresSearch />

      {/* Quick Stats */}
      <div className="mb-6">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>All stores are verified and trusted</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Real-time inventory updates</span>
          </div>
        </div>
      </div>

      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
            <div className="flex items-center">
              <Store className="h-5 w-5 mr-2 text-emerald-400" />
              All Verified Medicine Stores
              <Badge variant="outline" className="ml-3 bg-green-900/20 border-green-900/30 text-green-400">
                {stores?.length || 0} Store{(stores?.length || 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            <Link href="/medicines">
              <Button variant="outline" size="sm" className="border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/20">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse All Medicines
              </Button>
            </Link>
          </CardTitle>
          <p className="text-muted-foreground">
            Browse and shop from verified medicine stores in your area. All stores are verified for authenticity and quality.
          </p>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400">Error: {error}</p>
            </div>
          ) : stores?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <Card
                  key={store.id}
                  className="bg-muted/20 border-emerald-900/20 hover:border-emerald-700/30 transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <Store className="h-5 w-5 text-emerald-400" />
                      {store.storeName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Owned by {store.name}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-white">{store.storeAddress}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-white">{store.storePhone}</p>
                      </div>
                    </div>

                    {store.storeDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {store.storeDescription}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link href={`/medicines?store=${store.id}`} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Browse Medicines
                        </Button>
                      </Link>
                      <Badge
                        variant="outline"
                        className="bg-green-900/20 border-green-900/30 text-green-400 flex-shrink-0"
                      >
                        Verified
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-medium text-white mb-2">
                No verified medicine stores available
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                There are no verified medicine stores available at the moment.
                Please check back later or contact support if you need assistance.
              </p>
              <Link href="/medicines">
                <Button variant="outline" className="border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/20">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Browse All Medicines
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {stores?.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Can't find what you're looking for?{" "}
            <Link href="/medicines" className="text-emerald-400 hover:underline">
              Browse all medicines
            </Link>{" "}
            from these verified stores.
          </p>
        </div>
      )}
    </div>
  );
}
