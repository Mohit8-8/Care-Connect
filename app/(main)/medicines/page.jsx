import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import MedicineListing from "@/components/medicine-listing";

export default async function MedicinesPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "PATIENT") {
    redirect("/onboarding");
  }

  return <MedicineListing />;
}
