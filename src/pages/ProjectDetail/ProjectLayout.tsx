import { useState } from 'react';
import { Link, NavLink, Outlet, useParams, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Info,
  Users,
  Vote,
  GanttChart,
  MapPin,
  Building2,
  MessageSquare,
  Archive,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Wallet,
  Wrench,
  CalendarCheck,
  BookOpen,
  Megaphone,
  CalendarDays,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, ARCHIVE_STATUS_LABEL, ARCHIVE_STATUS_COLOR } from '@/types';

export default function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const projects = useProjectStore((s) => s.projects);
  const project = projects.find((p) => p.id === id);
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const restoreProject = useProjectStore((s) => s.restoreProject);
  const getPendingFeeObjectionCount = useProjectStore((s) => s.getPendingFeeObjectionCount);
  const getPendingRepairOrderCount = useProjectStore((s) => s.getPendingRepairOrderCount);
  const getNextMaintenanceDate = useProjectStore((s) => s.getNextMaintenanceDate);
  const hasElevatorArchive = useProjectStore((s) => s.hasElevatorArchive);
  const getConvention = useProjectStore((s) => s.getConvention);
  const getConventionUnreadCount = useProjectStore((s) => s.getConventionUnreadCount);

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreReason, setRestoreReason] = useState('');

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const canArchive = project.archiveStatus === 'pending_archive' || 
    (project.status === 'completed' && project.archiveStatus === 'active');
  const canRestore = project.archiveStatus === 'archived';

  const pendingObjectionCount = id ? getPendingFeeObjectionCount(id) : 0;
  const pendingRepairCount = id ? getPendingRepairOrderCount(id) : 0;
  const nextMaintenanceDate = id ? getNextMaintenanceDate(id) : null;
  const hasArchive = id ? hasElevatorArchive(id) : false;
  const convention = id ? getConvention(id) : undefined;
  const conventionUnreadCount = id ? getConventionUnreadCount(id) : 0;

  const daysUntilMaintenance = nextMaintenanceDate
    ? Math.ceil((new Date(nextMaintenanceDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const showMaintenanceWarning = hasArchive && daysUntilMaintenance !== null && daysUntilMaintenance <= 7;
  const showConventionWarning = convention?.isPublished && conventionUnreadCount > 0;

  const handleArchive = () => {
    archiveProject(project.id, '项目负责人');
    setShowArchiveDialog(false);
  };

  const handleRestore = () => {
    restoreProject(project.id, '项目负责人', restoreReason || undefined);
    setShowRestoreDialog(false);
    setRestoreReason('');
  };

  const navItems = [
    { to: `/projects/${id}`, label: '项目概览', icon: Info, end: true },
    { to: `/projects/${id}/households`, label: '住户与费用', icon: Users },
    { to: `/projects/${id}/survey`, label: '意见征询', icon: Vote },
    { to: `/projects/${id}/feedbacks`, label: '反馈管理', icon: MessageSquare },
    { to: `/projects/${id}/meetings`, label: '协调会议', icon: CalendarDays },
    { to: `/projects/${id}/progress`, label: '进度公示', icon: GanttChart },
    { to: `/projects/${id}/fund`, label: '资金看板', icon: Wallet },
    { to: `/projects/${id}/repair`, label: '报修工单', icon: Wrench, badge: pendingRepairCount },
    { to: `/projects/${id}/maintenance`, label: '维保记录', icon: CalendarCheck, show: hasArchive },
    { to: `/projects/${id}/convention`, label: '使用公约', icon: BookOpen, badge: conventionUnreadCount },
    { to: `/projects/${id}/ad-revenue`, label: '广告收益', icon: Megaphone },
  ].filter((item) => item.show !== false);

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
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${PROJECT_STATUS_COLOR[project.status]}`}
              >
                {PROJECT_STATUS_LABEL[project.status]}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${ARCHIVE_STATUS_COLOR[project.archiveStatus]}`}
              >
                {project.archiveStatus === 'archived' ? (
                  <Archive className="w-3 h-3" />
                ) : project.archiveStatus === 'pending_archive' ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : null}
                {ARCHIVE_STATUS_LABEL[project.archiveStatus]}
              </span>
              {canArchive && (
                <button
                  onClick={() => setShowArchiveDialog(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  确认归档
                </button>
              )}
              {canRestore && (
                <button
                  onClick={() => setShowRestoreDialog(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  恢复项目
                </button>
              )}
            </div>
          </div>

          {pendingObjectionCount > 0 && (
            <Link
              to={`/projects/${id}/households`}
              className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-500/90 hover:bg-amber-500 text-white rounded-lg transition-colors backdrop-blur"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  您有 {pendingObjectionCount} 条待处理的费用分摊异议
                </p>
                <p className="text-sm text-amber-100">
                  请及时审核住户提出的分摊金额异议
                </p>
              </div>
              <div className="bg-white text-amber-600 px-3 py-1 rounded-full text-sm font-bold">
                {pendingObjectionCount} 条待审
              </div>
            </Link>
          )}

          {pendingRepairCount > 0 && (
            <Link
              to={`/projects/${id}/repair`}
              className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors backdrop-blur"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  您有 {pendingRepairCount} 条待处理的电梯报修工单
                </p>
                <p className="text-sm text-red-100">
                  请及时安排维修人员处理电梯故障
                </p>
              </div>
              <div className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                {pendingRepairCount} 条待处理
              </div>
            </Link>
          )}

          {showMaintenanceWarning && daysUntilMaintenance !== null && (
            <Link
              to={`/projects/${id}/maintenance`}
              className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-lg transition-colors backdrop-blur ${
                daysUntilMaintenance < 0
                  ? 'bg-red-500/90 hover:bg-red-500'
                  : 'bg-amber-500/90 hover:bg-amber-500'
              } text-white`}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  {daysUntilMaintenance < 0
                    ? '电梯维保已逾期！'
                    : `电梯维保即将到期（还有 ${daysUntilMaintenance} 天）`}
                </p>
                <p className="text-sm text-white/80">
                  {daysUntilMaintenance < 0
                    ? `已逾期 ${Math.abs(daysUntilMaintenance)} 天，请尽快安排维保`
                    : `下次维保日期：${nextMaintenanceDate}，请及时联系维保单位`}
                </p>
              </div>
              <div className="bg-white text-amber-600 px-3 py-1 rounded-full text-sm font-bold">
                {daysUntilMaintenance < 0 ? '已逾期' : `${daysUntilMaintenance}天后`}
              </div>
            </Link>
          )}

          {showConventionWarning && (
            <Link
              to={`/projects/${id}/convention`}
              className="mt-4 flex items-center gap-3 px-4 py-3 bg-violet-500/90 hover:bg-violet-500 text-white rounded-lg transition-colors backdrop-blur"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  电梯使用公约待阅读确认
                </p>
                <p className="text-sm text-white/80">
                  还有 {conventionUnreadCount} 户住户未确认阅读，请及时通知住户
                </p>
              </div>
              <div className="bg-white text-violet-600 px-3 py-1 rounded-full text-sm font-bold">
                {conventionUnreadCount} 户待确认
              </div>
            </Link>
          )}

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
                {item.badge && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Outlet />
      </div>

      {showArchiveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Archive className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">确认归档项目</h3>
                <p className="text-sm text-slate-500">{project.name}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">归档后项目将：</p>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    <li>• 从首页默认列表中隐藏</li>
                    <li>• 可通过「已归档」筛选查看</li>
                    <li>• 可随时恢复为活跃状态</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowArchiveDialog(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                确认归档
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">恢复已归档项目</h3>
                <p className="text-sm text-slate-500">{project.name}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                恢复原因（可选）
              </label>
              <textarea
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                placeholder="请输入恢复项目的原因..."
                className="input-field min-h-[100px] resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRestoreDialog(false);
                  setRestoreReason('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
