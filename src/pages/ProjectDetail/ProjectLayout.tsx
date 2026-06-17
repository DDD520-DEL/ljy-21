import { Link, NavLink, Outlet, useParams, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Info,
  Users,
  Vote,
  GanttChart,
  MapPin,
  Building2,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR } from '@/types';

export default function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const projects = useProjectStore((s) => s.projects);
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { to: `/projects/${id}`, label: '项目概览', icon: Info, end: true },
    { to: `/projects/${id}/households`, label: '住户与费用', icon: Users },
    { to: `/projects/${id}/survey`, label: '意见征询', icon: Vote },
    { to: `/projects/${id}/progress`, label: '进度公示', icon: GanttChart },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-primary-700 via-primary-800 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-200 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold">{project.name}</h1>
                  <div className="flex items-center gap-2 text-primary-200 text-sm mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{project.address}</span>
                  </div>
                </div>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${PROJECT_STATUS_COLOR[project.status]}`}
            >
              {PROJECT_STATUS_LABEL[project.status]}
            </span>
          </div>

          <nav className="flex gap-1 mt-6 -mb-6 overflow-x-auto scrollbar-thin">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-50 text-primary-700'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
}
