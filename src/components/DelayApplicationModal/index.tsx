import { useState } from 'react';
import { X, AlertTriangle, Calendar, User } from 'lucide-react';
import type { ProgressNode } from '@/types';
import { useProjectStore } from '@/store/projectStore';

interface DelayApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  node: ProgressNode;
}

export default function DelayApplicationModal({
  isOpen,
  onClose,
  projectId,
  node,
}: DelayApplicationModalProps) {
  const [applicant, setApplicant] = useState('项目负责人');
  const [delayDays, setDelayDays] = useState<number>(7);
  const [reason, setReason] = useState('');
  const [originalPlannedDate, setOriginalPlannedDate] = useState('');
  const addDelayApplication = useProjectStore((s) => s.addDelayApplication);

  const handleSubmit = () => {
    if (delayDays <= 0 || reason.trim() === '' || applicant.trim() === '') {
      alert('请填写完整的申请信息');
      return;
    }

    const result = addDelayApplication(projectId, {
      nodeId: node.id,
      stageKey: node.stageKey,
      applicant: applicant.trim(),
      delayDays,
      reason: reason.trim(),
      originalPlannedDate: originalPlannedDate || undefined,
    });

    if (result) {
      alert('延期申请已提交，等待审批');
      onClose();
      setDelayDays(7);
      setReason('');
      setApplicant('项目负责人');
      setOriginalPlannedDate('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-800">
                工程延期申请
              </h3>
              <p className="text-sm text-slate-500">申请阶段：{node.stage}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label-field">申请人</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={applicant}
                onChange={(e) => setApplicant(e.target.value)}
                className="input-field pl-10"
                placeholder="请输入申请人姓名"
              />
            </div>
          </div>

          <div>
            <label className="label-field">原计划完成日期（可选）</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={originalPlannedDate}
                onChange={(e) => setOriginalPlannedDate(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label-field">预计延期天数</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value) || 1)}
                className="input-field flex-1"
                placeholder="请输入延期天数"
              />
              <span className="text-slate-600 font-medium whitespace-nowrap">天</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[7, 15, 30, 45, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDelayDays(days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    delayDays === days
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {days}天
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">延期原因说明</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field min-h-[120px] resize-none"
              placeholder="请详细说明延期的具体原因，如天气影响、材料供应延迟、施工难度超出预期等..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary inline-flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            提交申请
          </button>
        </div>
      </div>
    </div>
  );
}
