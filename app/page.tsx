import { Shell } from "@/components/app/shell";
import { MealPrepProvider } from "@/components/providers/mealprep-provider";

export default function Home() {
  return (
    <MealPrepProvider>
      <Shell />
    </MealPrepProvider>
  );
}
