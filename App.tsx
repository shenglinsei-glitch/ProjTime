
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import NewProjectPage from './pages/NewProjectPage';
import CalendarSettingsPage from './pages/CalendarSettingsPage';
import StatsPage from './pages/StatsPage';
import CalendarPage from './pages/CalendarPage';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <div className="flex-1 pb-20 sm:pb-24">
            <Routes>
              <Route path="/" element={<ProjectListPage />} />
              <Route path="/new" element={<NewProjectPage />} />
              <Route path="/project/:id" element={<ProjectDetailPage />} />
              <Route path="/settings" element={<CalendarSettingsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Routes>
          </div>
        </div>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
