import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useApi } from "../hooks/use-api";
import type { Program, PaginatedResponse } from "../types/api";

interface ProgramContextValue {
  currentProgram: Program | null;
  setCurrentProgram: (program: Program | null) => void;
  allPrograms: Program[];
  loading: boolean;
}

const ProgramContext = createContext<ProgramContextValue>({
  currentProgram: null,
  setCurrentProgram: () => {},
  allPrograms: [],
  loading: true,
});

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);

  const { data, loading } = useApi<PaginatedResponse<Program>>(
    user ? "/programs" : null,
    [user?.id]
  );

  const allPrograms = data?.data ?? [];

  useEffect(() => {
    if (allPrograms.length > 0 && !currentProgram) {
      setCurrentProgram(allPrograms[0]);
    }
  }, [allPrograms, currentProgram]);

  return (
    <ProgramContext.Provider
      value={{ currentProgram, setCurrentProgram, allPrograms, loading }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  return useContext(ProgramContext);
}
