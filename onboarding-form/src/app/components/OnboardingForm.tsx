"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, OnboardingFormData } from "@/app/lib/schemas/onboarding";
import { useSearchParams } from "next/navigation";

const SERVICE_OPTIONS = ["UI/UX", "Branding", "Web Dev", "Mobile App"] as const;

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function OnboardingForm() {
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<OnboardingFormData | null>(null);

  const initialDefaults = useMemo<Partial<OnboardingFormData>>(() => {
    const svcParams = searchParams.getAll("service");
    const collapsed = svcParams.length === 1 ? svcParams[0].split(",") : svcParams;
    const services = collapsed
      .map((s) => decodeURIComponent(s.trim()))
      .filter((s): s is OnboardingFormData["services"][number] =>
        (SERVICE_OPTIONS as readonly string[]).includes(s)
      );

    const budgetRaw = searchParams.get("budgetUsd");
    const budgetUsd = budgetRaw ? Number(budgetRaw) : undefined;

    const prefill: Partial<OnboardingFormData> = {
      fullName: searchParams.get("fullName") || undefined,
      email: searchParams.get("email") || undefined,
      companyName: searchParams.get("companyName") || undefined,
      services: services.length ? services : undefined,
      budgetUsd: Number.isFinite(budgetUsd!) ? budgetUsd : undefined,
      projectStartDate: searchParams.get("projectStartDate") || undefined,
    };

    return prefill;
  }, [searchParams?.toString()]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: initialDefaults,
    mode: "onTouched",
  });

  useEffect(() => {
    if (Object.keys(initialDefaults).length > 0) {
      reset((prev) => ({ ...prev, ...initialDefaults }));
    }
  }, [initialDefaults, reset]);

 const onSubmit = async (data: OnboardingFormData) => {
    setServerError(null);
    setSuccessData(null);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_ONBOARD_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      setSuccessData(data);
      reset(); 
    } catch (err: any) {
      setServerError(
        err?.message === "Failed to fetch"
          ? "Network error: Unable to reach the server."
          : err?.message || "Something went wrong. Please try again."
      );
    }
  };

  const selectedServices = watch("services") || [];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6 text-[#02233B]">
      <h1 className="text-2xl font-bold mb-5">
        <span className="typing">Client Onboarding</span>
      </h1>

      {serverError && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {serverError}
        </div>
      )}

      {successData && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700">
          ✅ Submitted successfully!
          <pre className="mt-2 overflow-x-auto rounded bg-white/60 p-2 text-xs">
            {JSON.stringify(successData, null, 2)}
          </pre>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            {...register("fullName")}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className="mt-1 w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1 text-sm text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="mt-1 w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium">
            Company name
          </label>
          <input
            id="companyName"
            type="text"
            {...register("companyName")}
            aria-invalid={!!errors.companyName}
            aria-describedby={errors.companyName ? "companyName-error" : undefined}
            className="mt-1 w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.companyName && (
            <p id="companyName-error" className="mt-1 text-sm text-red-600">
              {errors.companyName.message}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="block text-sm font-medium">Services interested in</legend>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SERVICE_OPTIONS.map((service) => {
              const id = `service-${service}`;
              return (
                <label key={service} htmlFor={id} className="flex items-center gap-2 rounded-lg border p-2">
                  <input
                    id={id}
                    type="checkbox"
                    value={service}
                    {...register("services")}
                    aria-invalid={!!errors.services}
                  />
                  <span>{service}</span>
                </label>
              );
            })}
          </div>
          {errors.services && (
            <p className="mt-1 text-sm text-red-600">{errors.services.message}</p>
          )}

          {!!selectedServices.length && (
            <p className="mt-1 text-xs text-gray-600">
              Selected: {selectedServices.join(", ")}
            </p>
          )}
        </fieldset>

        <div>
          <label htmlFor="budgetUsd" className="block text-sm font-medium">
            Budget (USD) <span className="text-gray-500">(optional)</span>
          </label>
          <input
            id="budgetUsd"
            type="number"
            inputMode="numeric"
            {...register("budgetUsd", { valueAsNumber: true })}
            aria-invalid={!!errors.budgetUsd}
            aria-describedby={errors.budgetUsd ? "budgetUsd-error" : undefined}
            className="mt-1 w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 50000"
          />
          {errors.budgetUsd && (
            <p id="budgetUsd-error" className="mt-1 text-sm text-red-600">
              {errors.budgetUsd.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="projectStartDate" className="block text-sm font-medium">
            Project start date
          </label>
          <input
            id="projectStartDate"
            type="date"
            min={todayString()} 
            {...register("projectStartDate")}
            aria-invalid={!!errors.projectStartDate}
            aria-describedby={errors.projectStartDate ? "projectStartDate-error" : undefined}
            className="mt-1 w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.projectStartDate && (
            <p id="projectStartDate-error" className="mt-1 text-sm text-red-600">
              {errors.projectStartDate.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="acceptTerms"
            type="checkbox"
            {...register("acceptTerms")}
            aria-invalid={!!errors.acceptTerms}
          />
          <label htmlFor="acceptTerms" className="text-sm">
            I accept the terms and conditions
          </label>
        </div>
        {errors.acceptTerms?.message && (
          <p className="mt-1 text-sm text-red-600">
            {String(errors.acceptTerms.message)}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#02233B] py-2 font-medium text-white hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
