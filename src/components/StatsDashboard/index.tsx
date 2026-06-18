import { ChevronDown, ChevronUp, Wallet, Handshake, BarChart3, CalendarPlus, Trophy } from 'lucide-react';
import type { Project, ProjectStatus } from '@/types';
import { PROJECT_STATUS_LABEL } from '@/types';

interface StatsDashboardProps {
  projects: Project[];
  expanded: boolean;
  onToggle: () => void;
}

const STATUS_ORDER: ProjectStatus[] = [
  'draft',
  'surveying',
  'approved',
  'planning',
  'bidding',
  'constructing',
  'completed',
];

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: '#64748b',
  surveying: '#f59e0b',
  approved: '#3b82f6',
  planning: '#a855f7',
  bidding: '#6366f1',
  constructing: '#0f766e',
  completed: '#10b981',
};

export default function StatsDashboard({ projects, expanded, onToggle }: StatsDashboardProps) {
  const totalBudget = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0);

  const totalHouseholds = projects.reduce((sum, p) => sum + p.households.length, 0);
  const totalAgree = projects.reduce(
    (sum, p) => sum + p.surveyResponses.filter((r) => r.opinion === 'agree').length,
    0
  );
  const totalSign = projects.reduce((sum, p) => sum + p.surveyResponses.length, 0);
  const signRate = totalHouseholds > 0 ? Math.round((totalSign / totalHouseholds) * 100) : 0;
  const agreeRate = totalHouseholds > 0 ? Math.round((totalAgree / totalHouseholds) * 100) : 0;

  const statusCounts: Record<ProjectStatus, number> = {
    draft: 0,
    surveying: 0,
    approved: 0,
    planning: 0,
    bidding: 0,
    constructing: 0,
    completed: 0,
  };
  projects.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthNew = projects.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const monthCompleted = projects.filter((p) => {
    if (!p.completedAt) return false;
    const d = new Date(p.completedAt);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const statusData = STATUS_ORDER.map((s) => ({
    status: s,
    count: statusCounts[s] || 0,
    color: STATUS_COLORS[s],
  })).filter((d) => d.count > 0);

  const totalCount = statusData.reduce((sum, d) => sum + d.count, 0);

  const donutSegments = buildDonutSegments(statusData, totalCount, 100);

  return (
    <section className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">项目数据汇总看板</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                基于当前筛选条件，共 {projects.length} 个项目 · 总住户 {totalHouseholds} 户
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-700">
            <span className="text-sm">{expanded ? '收起面板' : '展开面板'}</span>
            {expanded ? (
              <ChevronUp className="w-5 h-5 transition-transform" />
            ) : (
              <ChevronDown className="w-5 h-5 transition-transform" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 pb-2">
            <StatTile
              icon={<Wallet className="w-5 h-5" />}
              label="总预算金额"
              value={`${formatNumber(totalBudget)} 万`}
              sub={`${projects.length} 个项目合计`}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              accent="from-emerald-500 to-teal-600"
            />
            <StatTile
              icon={<Handshake className="w-5 h-5" />}
              label="整体签约同意率"
              value={`${agreeRate}%`}
              sub={`已签 ${totalSign} / 总户 ${totalHouseholds} · 签署率 ${signRate}%`}
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
              accent="from-primary-500 to-primary-700"
              progress={signRate}
            />
            <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">项目状态分布</p>
                  <p className="text-xs text-slate-500">各状态项目数量占比</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative w-36 h-36 flex-shrink-0">
                  <svg viewBox="0 0 220 220" className="w-full h-full transform -rotate-90">
                    <circle
                      cx="110"
                      cy="110"
                      r={100}
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth={36}
                    />
                    {donutSegments.map((seg, i) => (
                      <circle
                        key={i}
                        cx="110"
                        cy="110"
                        r={100}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={36}
                        strokeDasharray={`${seg.length} ${circumference(100)}`}
                        strokeDashoffset={-seg.offset}
                        className="transition-all duration-700 ease-out"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-slate-800">{totalCount}</span>
                    <span className="text-xs text-slate-500 mt-0.5">项目</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {statusData.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">暂无数据</p>
                  ) : (
                    statusData.map((d) => {
                      const percent = totalCount > 0 ? Math.round((d.count / totalCount) * 100) : 0;
                      return (
                        <div key={d.status} className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-xs text-slate-600 flex-1 truncate">
                            {PROJECT_STATUS_LABEL[d.status]}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">{d.count}</span>
                          <span className="text-xs text-slate-400 w-9 text-right">{percent}%</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <StatTile
              icon={<CalendarPlus className="w-5 h-5" />}
              label="本月新增项目"
              value={`${monthNew}`}
              sub={`${currentMonth + 1} 月新发起`}
              iconBg="bg-sky-50"
              iconColor="text-sky-600"
              accent="from-sky-500 to-blue-600"
              pulse={monthNew > 0}
            />
            <StatTile
              icon={<Trophy className="w-5 h-5" />}
              label="本月竣工数"
              value={`${monthCompleted}`}
              sub={`${currentMonth + 1} 月完成验收`}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              accent="from-amber-500 to-orange-600"
              pulse={monthCompleted > 0}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function circumference(r: number) {
  return 2 * Math.PI * r;
}

function buildDonutSegments(
  data: { count: number; color: string }[],
  total: number,
  r: number
) {
  const totalLen = circumference(r);
  const gap = 1.2;
  const segs: { length: number; offset: number; color: string }[] = [];
  if (total <= 0) return segs;

  let offset = 0;
  data.forEach((d) => {
    const ratio = d.count / total;
    const len = ratio * totalLen - gap;
    if (len > 0) {
      segs.push({ length: len, offset, color: d.color });
      offset += len + gap;
    }
  });
  return segs;
}

function formatNumber(n: number) {
  if (n >= 10000) {
    return (n / 10000).toFixed(2).replace(/\.?0+$/, '') + '亿';
  }
  if (n >= 1000) {
    return n.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
  }
  return String(n);
}

function StatTile({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  accent,
  progress,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
  iconColor: string;
  accent: string;
  progress?: number;
  pulse?: boolean;
}) {
  return (
    <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-200 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />
      {pulse && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r ${accent} opacity-60`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r ${accent}`} />
        </span>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-2">{sub}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${accent} transition-all duration-700 ease-out rounded-full`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
