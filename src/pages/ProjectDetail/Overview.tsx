import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  Users,
  DollarSign,
  Calendar,
  ChevronRight,
  Vote,
  GanttChart,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { formatCurrency } from '@/utils/feeCalculator';
import SurveyChart from '@/components/SurveyChart';

export default function ProjectOverview() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));

  if (!project) return null;

  const totalHouseholds = project.households.length;
  const signedCount = project.surveyResponses.length;
  const agreeCount = project.surveyResponses.filter(
    (r) => r.opinion === 'agree'
  ).length;
  const agreeRate =
    totalHouseholds > 0 ? Math.round((agreeCount / totalHouseholds) * 100) : 0;
  const completedNodes = project.progressNodes.filter(
    (n) => n.status === 'completed'
  ).length;
  const totalNodes = project.progressNodes.length;
  const totalShare = project.households.reduce(
    (sum, h) => sum + h.shareAmount,
    0
  );

  const stats = [
    {
      icon: <Building2 className="w-5 h-5" />,
      label: '总楼层',
      value: `${project.totalFloors} 层`,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: '住户数量',
      value: `${totalHouseholds} 户`,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: '工程总费用',
      value: `${project.totalCost} 万元`,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: '创建时间',
      value: new Date(project.createdAt).toLocaleDateString('zh-CN'),
      color: 'bg-green-50 text-green-700',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="card p-5 animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-slate-800">
              费用分摊概览
            </h3>
            <Link
              to={`/projects/${project.id}/households`}
              className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              查看详情 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-500 mb-1">已分摊总额</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(totalShare)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-500 mb-1">最高分摊</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(
                    Math.max(...project.households.map((h) => h.shareAmount))
                  )}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-500 mb-1">参与分摊户数</p>
                <p className="text-xl font-bold text-primary-700">
                  {project.households.filter((h) => h.shareAmount > 0).length} 户
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-2">各楼层分摊比例</p>
              <div className="space-y-2">
                {Array.from(new Set(project.households.map((h) => h.floor)))
                  .sort((a, b) => a - b)
                  .map((floor) => {
                    const floorRatio = project.households
                      .filter((h) => h.floor === floor)
                      .reduce((sum, h) => sum + h.shareRatio, 0);
                    return (
                      <div key={floor} className="flex items-center gap-3">
                        <span className="w-12 text-sm font-medium text-slate-600">
                          {floor}F
                        </span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(floorRatio, 2)}%` }}
                          >
                            {floorRatio > 5 && (
                              <span className="text-xs text-white font-medium">
                                {floorRatio.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {floorRatio <= 5 && (
                          <span className="text-xs text-slate-500 w-12">
                            {floorRatio.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Link
            to={`/projects/${project.id}/survey`}
            className="card p-6 block card-hover-lift"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-slate-800">意见征询</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">签署进度</span>
                <span className="font-medium text-slate-700">
                  {signedCount}/{totalHouseholds}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{
                    width: `${
                      totalHouseholds > 0
                        ? (signedCount / totalHouseholds) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">同意率 {agreeRate}%</span>
                <span className="text-slate-400 text-xs">法定门槛 2/3</span>
              </div>
            </div>
          </Link>

          <Link
            to={`/projects/${project.id}/progress`}
            className="card p-6 block card-hover-lift"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GanttChart className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-slate-800">进度公示</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-slate-700">
                  {completedNodes}/{totalNodes} 阶段已完成
                </span>
              </div>
              <div className="flex gap-1">
                {project.progressNodes.map((node) => (
                  <div
                    key={node.id}
                    className={`flex-1 h-2 rounded-full ${
                      node.status === 'completed'
                        ? 'bg-green-500'
                        : node.status === 'in_progress'
                        ? 'bg-primary-500'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                {project.progressNodes.map((node) => (
                  <span key={node.id}>{node.stage}</span>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-serif text-lg font-bold text-slate-800 mb-4">
          征询详情
        </h3>
        <SurveyChart project={project} />
      </div>
    </div>
  );
}
