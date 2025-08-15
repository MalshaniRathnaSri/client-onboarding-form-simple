import AnimatedBackground from "@/app/components/AnimatedBackground";
import OnboardingForm from "@/app/components/OnboardingForm";

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <AnimatedBackground />
      </div>

      <div className="bg-white rounded-lg max-w-xl w-full z-20 mt-10 mb-10">
        <OnboardingForm />
      </div>
    </div>
  );
}
