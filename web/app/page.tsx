import AppContent from "@/components/AppContent";
import { LangProvider } from "@/lib/LangContext";

export default function Home() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
}
