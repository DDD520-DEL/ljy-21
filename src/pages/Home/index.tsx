import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { PROJECT_STATUS_LABEL } from '@/types';
import type { ProjectStatus } from '@/types';
import ProjectCard from '@/components/ProjectCard';

const STATUS_FILTERS: (ProjectStatus | 'all')[] = [
  'all',
  'surveying',
  'planning',
  'bidding',
  'constructing',
  'completed',
];

const STATUS_LABEL_MAP: Record<string, string> = {
  all: '全部',
  ...PROJECT_STATUS_LABEL,
};

export default function Home() {
  const projects = useProjectStore((s) => s.projects);
  const initProjects = useProjectStore((s) => s.initProjects);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  useEffect(() => {
    initProjects();
  }, [initProjects]);

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: projects.length,
    surveying: projects.filter((p) => p.status === 'surveying').length,
    constructing: projects.filter((p) => p.status === 'constructing').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-400 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm mb-6 border border-white/20">
              <Building2 className="w-4 h-4" />
              <span>老旧小区加装电梯服务平台</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
              让加装电梯
              <br />
              <span className="text-amber-300">更透明、更高效</span>
            </h1>
            <p className="text-lg text-primary-100 mb-8 max-w-xl">
              线上意愿征询、自动费用分摊、实时进度公示。
              为老旧小区改造提供全流程数字化解决方案。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/projects/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-primary-50 hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                发起加装电梯项目
              </Link>
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-all"
              >
                浏览全部项目
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <StatCard
              icon={<Building2 className="w-5 h-5" />}
              label="项目总数"
              value={stats.total}
              color="text-primary-200"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="征询中"
              value={stats.surveying}
              color="text-amber-300"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="施工中"
              value={stats.constructing}
              color="text-blue-300"
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="已竣工"
              value={stats.completed}
              color="text-green-300"
            />
          </div>
        </div>
      </section>

      <section id="projects" className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="section-title !mb-1">加装电梯项目</h2>
            <p className="text-slate-500">
              共 {filteredProjects.length} 个项目
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索小区或地址..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !pl-10 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 overflow-x-auto">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    statusFilter === s
                      ? 'bg-primary-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {STATUS_LABEL_MAP[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              暂无匹配的项目
            </h3>
            <p className="text-slate-500 mb-6">
              尝试调整搜索关键词或筛选条件
            </p>
            <Link to="/projects/create" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              发起新项目
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>{icon}</div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-primary-100 mt-1">{label}</p>
    </div>
  );
}
