import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { CardsScreen } from '@/screens/CardsScreen';
import { StudyScreen } from '@/screens/StudyScreen';
import { LanguagesScreen } from '@/screens/LanguagesScreen';
import { ImportScreen } from '@/screens/ImportScreen';
import { AutoImportScreen } from '@/screens/AutoImportScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/cards" replace />} />
          <Route path="/cards" element={<CardsScreen />} />
          <Route path="/study" element={<StudyScreen />} />
          <Route path="/languages" element={<LanguagesScreen />} />
          <Route path="/import" element={<ImportScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/cards" replace />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
