import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { ProgramProvider } from "./context/ProgramContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <ProgramProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" richColors />
      </ProgramProvider>
    </AuthProvider>
  );
}
