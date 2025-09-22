import { getVerifiedMedicineStores } from "@/actions/patient";
import { PageHeader } from "@/components/page-header";
import { Store, MapPin, Phone, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/onboarding";

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
        title="Medicine Stores"
        backLink="/medicines"
        backLabel="Browse Medicines"
      />

      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Store className="h-5 w-5 mr-2 text-emerald-400" />
            Verified Medicine Stores
          </CardTitle>
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
                  className="bg-muted/20 border-emerald-900/20 hover:border-emerald-700/30 transition-all"
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
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-white">{store.storeAddress}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-white">{store.storePhone}</p>
                      </div>
                    </div>

                    {store.storeDescription && (
                      <p className="text-sm text-muted-foreground">
                        {store.storeDescription}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link href={`/medicines?store=${store.id}`}>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Browse Medicines
                        </Button>
                      </Link>
                      <Badge
                        variant="outline"
                        className="bg-green-900/20 border-green-900/30 text-green-400"
                      >
                        Verified
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-xl font-medium text-white mb-2">
                No medicine stores available
              </h3>
              <p className="text-muted-foreground">
                There are no verified medicine stores available at the moment.
                Please check back later.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
