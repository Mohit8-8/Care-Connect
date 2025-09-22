import MedicineStoreVerificationClient from './MedicineStoreVerificationClient';

export default async function MedicineStoreVerificationWrapper() {
  // This component handles server-side data fetching
  const { getCurrentUser } = await import("@/actions/onboarding");
  const user = await getCurrentUser();

  return <MedicineStoreVerificationClient user={user} />;
}
