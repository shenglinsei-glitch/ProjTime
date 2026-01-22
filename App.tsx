
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import NewProjectPage from './pages/NewProjectPage';
import StatsPage from './pages/StatsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsMenuPage from './pages/SettingsMenuPage';
import TaskTypeSettingsPage from './pages/settings/TaskTypeSettingsPage';
import PartSettingsPage from './pages/settings/PartSettingsPage';
import MethodSettingsPage from './pages/settings/MethodSettingsPage';
import GeneralSettingsPage from './pages/settings/GeneralSettingsPage';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <div className="flex-1 pb-28 sm:pb-32">
            <Routes>
              <Route path="/" element={<ProjectListPage />} />
              <Route path="/new" element={<NewProjectPage />} />
              <Route path="/project/:id" element={<ProjectDetailPage />} />
              <Route path="/settings" element={<SettingsMenuPage />} />
              <Route path="/settings/tasks" element={<TaskTypeSettingsPage />} />
              <Route path="/settings/parts" element={<PartSettingsPage />} />
              <Route path="/settings/methods" element={<MethodSettingsPage />} />
              <Route path="/settings/general" element={<GeneralSettingsPage />} />
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
