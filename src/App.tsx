import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import CreateProject from '@/pages/CreateProject';
import ProjectLayout from '@/pages/ProjectDetail/ProjectLayout';
import ProjectOverview from '@/pages/ProjectDetail/Overview';
import HouseholdsPage from '@/pages/ProjectDetail/Households';
import SurveyPage from '@/pages/ProjectDetail/Survey';
import ProgressPage from '@/pages/ProjectDetail/Progress';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/projects/create" element={<CreateProject />} />
        </Route>
        <Route path="/projects/:id" element={<ProjectLayout />}>
          <Route index element={<ProjectOverview />} />
          <Route path="households" element={<HouseholdsPage />} />
          <Route path="survey" element={<SurveyPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
