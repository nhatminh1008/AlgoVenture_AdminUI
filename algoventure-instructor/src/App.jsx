import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChallengeSets from './pages/ChallengeSets';
import Progress from './pages/Progress';
import Analytics from './pages/Analytics';
import ExportResults from './pages/ExportResults';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChallengeSets />} />
          <Route path="challenges" element={<ChallengeSets />} />
          <Route path="progress" element={<Progress />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="export" element={<ExportResults />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
