import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  GanttChart,
  FileText,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock,
  AlertTriangle,
  List,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import ProgressTimeline from '@/components/ProgressTimeline';
import DelayApprovalPanel from '@/components/DelayApprovalPanel';
import { TOTAL_DELAY_WARNING_THRESHOLD } from '@/types';

export default function ProgressPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const updateProjectStatus = useProjectStore((s) => s.updateProjectStatus);
  const updateProgressNode = useProjectStore((s) => s.updateProgressNode);
  const getTotalApprovedDelayDays = useProjectStore((s) => s.getTotalApprovedDelayDays);
  const getProjectDelayApplications = useProjectStore((s) => s.getProjectDelayApplications);

  const [activeTab, setActiveTab] = useState<'timeline' | 'delay'>('timeline');

  if (!project) return null;

  const completedCount = project.progressNodes.filter(
    (n) => n.status === 'completed'
  ).length;
  const overallProgress = (completedCount / project.progressNodes.length) * 100;

  const totalApprovedDelayDays = getTotalApprovedDelayDays(project.id);
  const pendingDelayCount = getProjectDelayApplications(project.id).filter(
    (a) => a.status === 'pending'
  ).length;
  const isOverdue = totalApprovedDelayDays > TOTAL_DELAY_WARNING_THRESHOLD;

  const startPlanning = () => {
    if (project.status === 'approved') {
      updateProjectStatus(project.id, 'planning');
    }
  };

  const advanceStage = () => {
    const stageOrder = [
      { key: 'planning', status: 'planning' as const, next: 'bidding' as const },
      { key: 'bidding', status: 'bidding' as const, next: 'constructing' as const },
      { key: 'constructing', status: 'constructing' as const, next: 'completed' as const },
    ];

    const currentStage = stageOrder.find((s) => s.status === project.status);
    if (currentStage) {
      const currentNode = project.progressNodes.find(
        (n) => n.stageKey === currentStage.key
      );
      if (currentNode) {
        updateProgressNode(project.id, currentNode.id, {
          status: 'completed',
          date: new Date().toISOString().slice(0, 10),
        });
      }

      updateProjectStatus(project.id, currentStage.next);

      const nextStage = stageOrder.find((s) => s.status === currentStage.next);
      if (nextStage && nextStage.key !== 'completed') {
        const nextNode = project.progressNodes.find(
          (n) => n.stageKey === nextStage.key
        );
        if (nextNode) {
          updateProgressNode(project.id, nextNode.id, { status: 'in_progress' });
        }
      } else if (currentStage.next === 'completed') {
        const finalNode = project.progressNodes.find(
          (n) => n.stageKey === 'completed'
        );
        if (finalNode) {
          updateProgressNode(project.id, finalNode.id, { status: 'completed' });
        }
      }
    }
  };

  const canAdvance =
    (project.status === 'approved') ||
    ['planning', 'bidding', 'constructing'].includes(project.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {project.status === 'approved' && (
        <div className="card p-6 border-blue-300 bg-blue-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">
                  立项成功，进入实施阶段
                </h3>
                <p className="text-sm text-slate-600">
                  开始公示方案设计，进入全流程施工阶段
                </p>
              </div>
            </div>
            <button onClick={startPlanning} className="btn-primary inline-flex items-center gap-2">
              <Play className="w-4 h-4" />
              启动项目实施
            </button>
          </div>
        </div>
      )}

      {project.status === 'surveying' && (
        <div className="card p-6 border-amber-300 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                正在意见征询中
              </h3>
              <p className="text-sm text-slate-600">
                待征询同意率达到法定 2/3 以上（66.7%）后，项目将自动立项并可进入实施阶段
              </p>
            </div>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="card p-6 border-red-300 bg-red-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 mb-1">
                项目逾期警告
              </h3>
              <p className="text-sm text-red-700">
                该项目累计延期已达 <strong>{totalApprovedDelayDays}</strong> 天，超过 {TOTAL_DELAY_WARNING_THRESHOLD} 天预警阈值，请密切关注施工进度并及时采取措施。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <GanttChart className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-800">
                项目进度总览
              </h3>
              <p className="text-sm text-slate-500">
                共 {project.progressNodes.length} 个阶段，已完成 {completedCount} 个
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {totalApprovedDelayDays > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  累计延期 {totalApprovedDelayDays} 天
                </span>
              </div>
            )}
            {pendingDelayCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg animate-pulse">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">
                  {pendingDelayCount} 项待审批
                </span>
              </div>
            )}
            {canAdvance && project.status !== 'approved' && project.status !== 'completed' && (
              <button onClick={advanceStage} className="btn-primary inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                完成当前阶段
              </button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-500">总体进度</span>
            <span className="font-semibold text-primary-700">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {project.progressNodes.map((node) => (
              <div key={node.id} className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    node.status === 'completed'
                      ? 'bg-green-500'
                      : node.status === 'in_progress'
                      ? 'bg-primary-600 animate-pulse'
                      : 'bg-slate-300'
                  }`}
                />
                <span className="text-xs text-slate-500 mt-1">{node.stage}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex border-b border-slate-200 -mx-6 px-6">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <GanttChart className="w-4 h-4" />
            进度时间轴
          </button>
          <button
            onClick={() => setActiveTab('delay')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all flex items-center gap-2 relative ${
              activeTab === 'delay'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
            延期申请管理
            {pendingDelayCount > 0 && (
              <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                {pendingDelayCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'timeline' ? (
        <ProgressTimeline project={project} editable={
          ['approved', 'planning', 'bidding', 'constructing', 'completed'].includes(project.status) &&
          project.status !== 'surveying' && project.status !== 'draft'
        } />
      ) : (
        <DelayApprovalPanel project={project} />
      )}
    </div>
  );
}
