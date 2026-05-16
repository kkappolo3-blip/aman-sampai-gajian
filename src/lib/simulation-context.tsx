import { createContext, useContext, ReactNode } from "react";
import { useSimulationStore } from "@/hooks/use-simulation-store";

type Ctx = ReturnType<typeof useSimulationStore>;
const SimulationContext = createContext<Ctx | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const value = useSimulationStore();
  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
