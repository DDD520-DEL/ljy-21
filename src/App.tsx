import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import CreateProject from '@/pages/CreateProject';
import ElevatorBrands from '@/pages/ElevatorBrands';
import PolicySubsidy from '@/pages/PolicySubsidy';
import ProjectLayout from '@/pages/ProjectDetail/ProjectLayout';
import ProjectOverview from '@/pages/ProjectDetail/Overview';
import HouseholdsPage from '@/pages/ProjectDetail/Households';
import SurveyPage from '@/pages/ProjectDetail/Survey';
import FeedbacksPage from '@/pages/ProjectDetail/Feedbacks';
import ProgressPage from '@/pages/ProjectDetail/Progress';
import PublicationPage from '@/pages/Publication';
import { useProjectStore } from '@/store/projectStore';
import { useElevatorStore } from '@/store/elevatorStore';
import { useSubsidyStore } from '@/store/subsidyStore';

export default function App() {
  const initProjects = useProjectStore((s) => s.initProjects);
  const initBrands = useElevatorStore((s) => s.initBrands);
  const initPolicies = useSubsidyStore((s) => s.initPolicies);

  useEffect(() => {
    initProjects();
    initBrands();
    initPolicies();
  }, [initProjects, initBrands, initPolicies]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/elevator-brands" element={<ElevatorBrands />} />
          <Route path="/policy-subsidy" element={<PolicySubsidy />} />
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
