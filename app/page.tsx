import { FunctionalShell } from "@/components/dashboard/functional-shell";
import { MealPrepProvider } from "@/components/providers/mealprep-provider";

export default function Home() {
  return <MealPrepProvider><FunctionalShell /></MealPrepProvider>;
}
