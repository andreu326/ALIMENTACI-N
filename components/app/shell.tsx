"use client";

import { useState } from "react";
import { TodayView } from "@/components/app/today-view";
import { TripsView } from "@/components/app/trips-view";
import { PantryView } from "@/components/app/pantry-view";
import { CookView } from "@/components/app/cook-view";
import { WeekView } from "@/components/app/week-view";
import { TripView } from "@/components/app/trip-view";
import { ProfileView } from "@/components/app/weight-view";

type Tab = "hoy" | "cocina" | "semana" | "viajes" | "despensa";

const ICONS: Record<Tab, React.ReactElement> = {
  hoy: (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <circle cx="9.5" cy="9.5" r="7" strokeWidth="1.5" />
      <circle cx="9.5" cy="9.5" r="2.6" strokeWidth="1.5" />
    </svg>
  ),
  cocina: (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <path d="M4 8.2h11v3.4a5.5 5.5 0 0 1-11 0Z" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M15 9.4h1.4a1.3 1.3 0 0 1 0 2.6H15" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.6 5.8c0-1.1.9-1.4.9-2.4M11 5.8c0-1.1.9-1.4.9-2.4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  semana: (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <rect x="2.8" y="4" width="13.4" height="12" rx="2.4" strokeWidth="1.5" />
      <path d="M2.8 7.8h13.4M6.6 2.4v3M12.4 2.4v3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  viajes: (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <path d="M3.2 5.4h12.6M3.2 9.5h12.6M3.2 13.6h8.4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  despensa: (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="13" height="13" rx="3" strokeWidth="1.5" />
      <path d="M3 9.5h13" strokeWidth="1.5" />
    </svg>
  ),
};

const TABS: { id: Tab; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "cocina", label: "Cocina" },
  { id: "semana", label: "Semana" },
  { id: "viajes", label: "Viajes" },
  { id: "despensa", label: "Despensa" },
];

export function Shell() {
  const [tab, setTab] = useState<Tab>("hoy");
  const [tripIndex, setTripIndex] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const goTab = (next: Tab) => {
    setTripIndex(null);
    setProfileOpen(false);
    setTab(next);
  };

  const overlay = profileOpen || tripIndex !== null;

  return (
    <div className="shell">
      <main>
        {profileOpen ? (
          <ProfileView onBack={() => setProfileOpen(false)} />
        ) : tripIndex !== null ? (
          <TripView index={tripIndex} onBack={() => setTripIndex(null)} />
        ) : (
          <>
            {tab === "hoy" ? (
              <TodayView
                onOpenTrips={() => setTripIndex(1)}
                onOpenProfile={() => setProfileOpen(true)}
              />
            ) : null}
            {tab === "cocina" ? <CookView /> : null}
            {tab === "semana" ? <WeekView /> : null}
            {tab === "viajes" ? <TripsView onOpenTrip={setTripIndex} /> : null}
            {tab === "despensa" ? <PantryView /> : null}
          </>
        )}
      </main>

      <nav className="nav" aria-label="Secciones">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="nav-item"
            aria-current={!overlay && tab === item.id ? "page" : undefined}
            onClick={() => goTab(item.id)}
          >
            {ICONS[item.id]}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
