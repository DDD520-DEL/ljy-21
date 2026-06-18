import { useState } from 'react';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle,
  User, Calendar, MessageSquare, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Project, DelayApplication } from '@/types';
import {
  DELAY_APPROVAL_STATUS_LABEL,
  DELAY_APPROVAL_STATUS_COLOR,
  STAGE_LIST,
} from '@/types';
import { useProjectStore } from '@/store/projectStore';

interface DelayApprovalPanelProps {
  project: Project;
}

export default function DelayApprovalPanel({ project }: DelayApprovalPanelProps) {
  const getProjectDelayApplications = useProjectStore((s) => s.getProjectDelayApplications);
  const reviewDelayApplication = useProjectStore((s) => s.reviewDelayApplication);
  const getTotalApprovedDelayDays = useProjectStore((s) => s.getTotalApprovedDelayDays);

  const applications = getProjectDelayApplications(project.id);
  const totalApprovedDays = getTotalApprovedDelayDays(project.id);
  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  const [expandedId, setExpandedId] = useState<string | null>(
    applications.find((a) => a.status === 'pending')?.id || null
  );
  const [approvalComment, setApprovalComment] = useState<Record<string, string>>({});

  const getStageLabel = (stageKey: string) => {
    return STAGE_LIST.find((s) => s.key === stageKey)?.label || stageKey;
  };

  const handleReview = (
    applicationId: string,
    status: 'approved' | 'rejected'
  ) => {
    const comment = approvalComment[applicationId] || '';
    if (status === 'rejected' && comment.trim() === '') {
      alert('驳回申请时请填写审批意见');
      return;
    }

    reviewDelayApplication(project.id, applicationId, {
      status,
      approver: '审批人',
      approvalComment: comment.trim() || undefined,
    });
  };

  if (applications.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">暂无延期申请记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 bg-gradient-to-r from-primary-50 to-amber-50 border-primary-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">延期申请统计</h4>
              <p className="text-sm text-slate-500">共 {applications.length} 条申请记录</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-white/60 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-slate-500">待审批</p>
            </div>
            <div className="text-center px-4 py-2 bg-white/60 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{totalApprovedDays}</p>
              <p className="text-xs text-slate-500">累计批准（天）</p>
            </div>
          </div>
        </div>
      </div>

      {applications.map((application) => (
        <DelayApplicationCard
          key={application.id}
          application={application}
          stageLabel={getStageLabel(application.stageKey)}
          isExpanded={expandedId === application.id}
          onToggle={() => setExpandedId(expandedId === application.id ? null : application.id)}
          approvalComment={approvalComment[application.id] || ''}
          onCommentChange={(comment) => setApprovalComment({ ...approvalComment, [application.id]: comment })}
          onApprove={() => handleReview(application.id, 'approved')}
          onReject={() => handleReview(application.id, 'rejected')}
        />
      ))}
    </div>
  );
}

interface DelayApplicationCardProps {
  application: DelayApplication;
  stageLabel: string;
  isExpanded: boolean;
  onToggle: () => void;
  approvalComment: string;
  onCommentChange: (comment: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

function DelayApplicationCard({
  application, stageLabel, isExpanded, onToggle,
  approvalComment, onCommentChange, onApprove, onReject,
}: DelayApplicationCardProps) {
  return (
    <div className={`card overflow-hidden transition-all ${
      application.status === 'pending' ? 'border-amber-300' :
      application.status === 'approved' ? 'border-green-300' : 'border-red-300'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            application.status === 'pending' ? 'bg-amber-100' :
            application.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Clock className={`w-6 h-6 ${
              application.status === 'pending' ? 'text-amber-600' :
              application.status === 'approved' ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-800">{stageLabel} 延期申请</h4>
              <span className={`badge ${DELAY_APPROVAL_STATUS_COLOR[application.status]}`}>
                {DELAY_APPROVAL_STATUS_LABEL[application.status]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {application.applicant}
              </span>
              <span>申请延期 <strong className="text-amber-600">{application.delayDays}</strong> 天</span>
              <span>{new Date(application.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100 space-y-4">
          <div className="pt-4 space-y-3">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-1">延期原因</p>
                <p className="text-slate-700">{application.reason}</p>
              </div>
            </div>

            {application.originalPlannedDate && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                <Calendar className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-600 mb-1">原计划完成日期</p>
                  <p className="text-amber-700 font-medium">{application.originalPlannedDate}</p>
                </div>
              </div>
            )}

            {application.status !== 'pending' && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                application.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  application.status === 'approved' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {application.status === 'approved' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-medium ${
                      application.status === 'approved' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      审批结果
                    </p>
                    {application.approvedAt && (
                      <p className="text-xs text-slate-400">
                        {new Date(application.approvedAt).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${
                    application.status === 'approved' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {application.status === 'approved' ? '申请已通过' : '申请已驳回'}
                  </p>
                  {application.approver && (
                    <p className="text-xs text-slate-500 mt-1">审批人：{application.approver}</p>
                  )}
                  {application.approvalComment && (
                    <p className="text-sm text-slate-600 mt-2">
                      审批意见：{application.approvalComment}
                    </p>
                  )}
                </div>
              </div>
            )}

            {application.status === 'pending' && (
              <div className="space-y-3">
                <div>
                  <label className="label-field">审批意见（驳回必填）</label>
                  <textarea
                    value={approvalComment}
                    onChange={(e) => onCommentChange(e.target.value)}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="请填写审批意见..."
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={onReject}
                    className="btn-danger inline-flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    驳回申请
                  </button>
                  <button
                    onClick={onApprove}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    通过申请
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
