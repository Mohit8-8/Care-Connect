import z from "zod";

export const doctorFormSchema = z.object({
  specialty: z.string().min(1, "Specialty is required"),
  experience: z
    .number({ invalid_type_error: "Experience must be a number" })
    .int()
    .min(1, "Experience must be at least 1 year")
    .max(70, "Experience must be less than 70 years"),
  credentialUrl: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Credential URL is required"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
});

export const medicineStoreFormSchema = z.object({
  storeName: z.string().min(1, "Store name is required").max(100, "Store name cannot exceed 100 characters"),
  storeAddress: z.string().min(10, "Store address must be at least 10 characters").max(500, "Store address cannot exceed 500 characters"),
  storePhone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[\d\s\-\+\(\)]+$/, "Please enter a valid phone number"),
  storeLicense: z.string().min(1, "Store license number is required").max(50, "License number cannot exceed 50 characters"),
  storeDescription: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description cannot exceed 1000 characters"),
});
