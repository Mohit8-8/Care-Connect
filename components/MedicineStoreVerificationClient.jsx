'use client';

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Send } from "lucide-react";
import Link from "next/link";
import { sendVerificationToAdmin } from "@/actions/medicine-store";
import useFetch from "@/hooks/use-fetch";
import { useEffect } from "react";
import { BarLoader } from "react-spinners";

export default function MedicineStoreVerificationClient({ user }) {
  // Custom hook for sending verification to admin
  const {
    loading,
    data,
    fn: submitVerification,
  } = useFetch(sendVerificationToAdmin);

  // Handle sending verification to admin
  const handleSendVerification = async () => {
    if (loading) return;
    await submitVerification();
  };

  useEffect(() => {
    if (data && data?.success && !loading) {
      // Reload the page to show updated status only after successful submission
      window.location.reload();
    }
  }, [data, loading]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-red-900/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <CardTitle className="text-xl font-semibold text-white mb-2">
                Access Denied
              </CardTitle>
              <CardDescription>
                Please sign in to access this page.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getVerificationStatus = () => {
    switch (user.storeVerificationStatus) {
      case "PENDING":
        return {
          icon: <Clock className="h-12 w-12 text-yellow-400" />,
          title: "Verification Pending",
          description: "Your medicine store application is being reviewed. This process typically takes 1-2 business days.",
          color: "border-yellow-900/20",
          bgColor: "bg-yellow-900/10"
        };
      case "VERIFIED":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-400" />,
          title: "Store Verified!",
          description: "Your medicine store has been successfully verified. You can now start managing your inventory and serving patients.",
          color: "border-green-900/20",
          bgColor: "bg-green-900/10"
        };
      case "REJECTED":
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-400" />,
          title: "Verification Rejected",
          description: "Unfortunately, your medicine store application was not approved. Please contact support for more information.",
          color: "border-red-900/20",
          bgColor: "bg-red-900/10"
        };
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-blue-400" />,
          title: "Submit Verification",
          description: "Submit your medicine store for verification to start serving patients.",
          color: "border-blue-900/20",
          bgColor: "bg-blue-900/10"
        };
    }
  };

  const handleCheckStatus = () => {
    window.location.reload();
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:support@careconnect.com";
  };

  const status = getVerificationStatus();

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className={`${status.color} max-w-md w-full`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className={`p-4 ${status.bgColor} rounded-full w-fit mx-auto mb-4`}>
              {status.icon}
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              {status.title}
            </CardTitle>
            <CardDescription className="mb-6">
              {status.description}
            </CardDescription>

            {user.storeVerificationStatus === "VERIFIED" && (
              <div className="space-y-3">
                <Link href="/medicine-store">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Go to Store Dashboard
                  </Button>
                </Link>
                <Link href="/medicines">
                  <Button variant="outline" className="w-full border-emerald-900/30">
                    Browse Medicines
                  </Button>
                </Link>
              </div>
            )}

            {user.storeVerificationStatus === "PENDING" && (
              <div className="space-y-3">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleCheckStatus}
                >
                  Check Status
                </Button>
                <p className="text-sm text-muted-foreground">
                  We'll notify you via email once the review is complete.
                </p>
              </div>
            )}

            {user.storeVerificationStatus === "REJECTED" && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-emerald-900/30"
                  onClick={handleContactSupport}
                >
                  Contact Support
                </Button>
                <Link href="/onboarding">
                  <Button variant="outline" className="w-full border-emerald-900/30">
                    Reapply
                  </Button>
                </Link>
              </div>
            )}

            {!user.storeVerificationStatus && (
              <div className="space-y-3">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSendVerification}
                  disabled={loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Submitting..." : "Submit for Verification"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Submit your store details for admin review to get verified.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && <BarLoader width={"100%"} color="#36d7b7" />}
    </div>
  );
}
