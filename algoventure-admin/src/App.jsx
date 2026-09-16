import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ContentLevels from './pages/ContentLevels';
import LevelConfig from './pages/LevelConfig';
import SystemAnalytics from './pages/SystemAnalytics';
import FeatureToggles from './pages/FeatureToggles';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="content" element={<ContentLevels />} />
          <Route path="levels" element={<LevelConfig />} />
          <Route path="analytics" element={<SystemAnalytics />} />
          <Route path="features" element={<FeatureToggles />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;