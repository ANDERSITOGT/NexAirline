import AppRouter from "@/routes/AppRouter";
import { PreferencesProvider } from "@/contexts/PreferencesContext";

function App() {
  return (
    <PreferencesProvider>
      <AppRouter />
    </PreferencesProvider>
  );
}

export default App;
