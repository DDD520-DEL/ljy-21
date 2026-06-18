import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Users, CheckCircle2, Archive, Clock } from 'lucide-react';
import type { Project } from '@/types';
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, ARCHIVE_STATUS_LABEL, ARCHIVE_STATUS_COLOR } from '@/types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const totalHouseholds = project.households.length;
  const signedCount = project.surveyResponses.length;
  const agreeCount = project.surveyResponses.filter(
    (r) => r.opinion === 'agree'
  ).length;
  const agreeRate =
    totalHouseholds > 0 ? Math.round((agreeCount / totalHouseholds) * 100) : 0;
  const signRate =
    totalHouseholds > 0 ? Math.round((signedCount / totalHouseholds) * 100) : 0;

  const latestNode = project.progressNodes.find((n) => n.status !== 'pending');

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card card-hover-lift block group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <h3 className="font-serif text-lg font-bold text-slate-800 group-hover:text-primary-700 transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{project.address}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`badge whitespace-nowrap ${PROJECT_STATUS_COLOR[project.status]}`}
            >
              {PROJECT_STATUS_LABEL[project.status]}
            </span>
            {project.archiveStatus !== 'active' && (
              <span
                className={`badge whitespace-nowrap text-xs flex items-center gap-1 ${ARCHIVE_STATUS_COLOR[project.archiveStatus]}`}
              >
                {project.archiveStatus === 'pending_archive' ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Archive className="w-3 h-3" />
                )}
                {ARCHIVE_STATUS_LABEL[project.archiveStatus]}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">住户</span>
            </div>
            <p className="text-xl font-bold text-slate-800">
              {totalHouseholds}
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs">同意率</span>
            </div>
            <p className="text-xl font-bold text-green-600">{agreeRate}%</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">总费用</div>
            <p className="text-xl font-bold text-amber-600">
              {project.totalCost}
              <span className="text-sm ml-0.5">万</span>
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-slate-500">征询进度</span>
            <span className="font-medium text-slate-700">
              {signedCount}/{totalHouseholds} 已签署
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${signRate}%` }}
            />
          </div>
        </div>

        {latestNode && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">最新进度</span>
              <span className="font-medium text-primary-700">
                {latestNode.stage}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end mt-4">
          <span className="flex items-center gap-1 text-sm text-primary-600 font-medium group-hover:gap-2 transition-all">
            查看详情
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
