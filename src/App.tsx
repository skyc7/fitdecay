import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { DataProvider, useFitDecay } from "./lib/DataContext";
import { AboutSciencePage } from "./pages/AboutSciencePage";
import { BaselinesPage } from "./pages/BaselinesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DecayDetailPage } from "./pages/DecayDetailPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LogLayoffPage } from "./pages/LogLayoffPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ReentryPlanPage } from "./pages/ReentryPlanPage";
import { SettingsPage } from "./pages/SettingsPage";

function AppRoutes() {
  const { data } = useFitDecay();
  if (!data.profile) return <OnboardingPage />;

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/layoffs/new" element={<LogLayoffPage />} />
        <Route path="/layoffs/:layoffId" element={<DecayDetailPage />} />
        <Route path="/plan" element={<ReentryPlanPage />} />
        <Route path="/plan/:layoffId" element={<ReentryPlanPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/baselines" element={<BaselinesPage />} />
        <Route path="/science" element={<AboutSciencePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <DataProvider>
      <AppRoutes />
    </DataProvider>
  );
}
