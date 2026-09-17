import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChallengeSets from './pages/ChallengeSets';
import Progress from './pages/Progress';
import Analytics from './pages/Analytics';
import ExportResults from './pages/ExportResults';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="challenges" element={<ChallengeSets />} />
          <Route path="progress" element={<Progress />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="export" element={<ExportResults />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
