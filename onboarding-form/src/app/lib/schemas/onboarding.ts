import { z } from "zod";

const today = new Date();
today.setHours(0, 0, 0, 0); 

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must be at most 80 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Only letters, spaces, apostrophes, and hyphens are allowed"),
  
  email: z.string().email("Invalid email address"),

  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be at most 100 characters"),

  services: z
    .any() 
    .refine((val) => Array.isArray(val), {
      message: "Please select at least one service",
    })
    .transform((val) => val as string[])
    .refine(
      (val) =>
        val.length > 0 &&
        val.every((item) =>
          ["UI/UX", "Branding", "Web Dev", "Mobile App"].includes(item)
        ),
      { message: "Please select at least one valid service" }
    ),

  budgetUsd: z
    .union([
      z
        .number()
        .int("Budget must be a whole number")
        .min(100, "Budget must be at least $100")
        .max(1000000, "Budget must be less than or equal to $1,000,000"),
      z.nan(), 
    ])
    .optional()
    .refine((val) => val === undefined || !isNaN(val as number), {
      message: "Budget must be a number",
    }),

  projectStartDate: z.string().refine((val) => {
    const selectedDate = new Date(val);
    selectedDate.setHours(0,0,0,0);
    return selectedDate >= today;
  }, { message: "Project start date must be today or later" }),

  acceptTerms: z
    .any()
    .refine((val) => val === true, {
      message: "You must accept the terms",
    }),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

