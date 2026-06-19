import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import CreateProject from '@/pages/CreateProject';
import ElevatorBrands from '@/pages/ElevatorBrands';
import ProjectLayout from '@/pages/ProjectDetail/ProjectLayout';
import ProjectOverview from '@/pages/ProjectDetail/Overview';
import HouseholdsPage from '@/pages/ProjectDetail/Households';
import SurveyPage from '@/pages/ProjectDetail/Survey';
import FeedbacksPage from '@/pages/ProjectDetail/Feedbacks';
import ProgressPage from '@/pages/ProjectDetail/Progress';
import PublicationPage from '@/pages/Publication';
import { useProjectStore } from '@/store/projectStore';
import { useElevatorStore } from '@/store/elevatorStore';

export default function App() {
  const initProjects = useProjectStore((s) => s.initProjects);
  const initBrands = useElevatorStore((s) => s.initBrands);

  useEffect(() => {
    initProjects();
    initBrands();
  }, [initProjects, initBrands]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/elevator-brands" element={<ElevatorBrands />} />
        </Route>
        <Route path="/publication/:token" element={<PublicationPage />} />
        <Route path="/projects/:id" element={<ProjectLayout />}>
          <Route index element={<ProjectOverview />} />
          <Route path="households" element={<HouseholdsPage />} />
          <Route path="survey" element={<SurveyPage />} />
          <Route path="feedbacks" element={<FeedbacksPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
