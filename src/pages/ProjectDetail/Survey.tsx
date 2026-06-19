import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Vote,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Bell,
  Filter,
  CheckSquare,
  Square,
  Megaphone,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import type { OpinionType } from '@/types';
import { OPINION_LABEL, OPINION_COLOR } from '@/types';
import { maskName } from '@/utils/maskData';
import SurveyChart from '@/components/SurveyChart';

type FilterType = 'all' | 'unsigned' | 'signed';

export default function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const addSurveyResponse = useProjectStore((s) => s.addSurveyResponse);
  const updateProjectStatus = useProjectStore((s) => s.updateProjectStatus);
  const batchRemind = useProjectStore((s) => s.batchRemind);
  const getHouseholdReminderCount = useProjectStore((s) => s.getHouseholdReminderCount);
  const getHouseholdLastReminder = useProjectStore((s) => s.getHouseholdLastReminder);
  const canRemindHousehold = useProjectStore((s) => s.canRemindHousehold);

  const [selectedHousehold, setSelectedHousehold] = useState<string | null>(null);
  const [selectedOpinion, setSelectedOpinion] = useState<OpinionType | null>(null);
  const [reason, setReason] = useState('');
  const [showNames, setShowNames] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRemindResult, setShowRemindResult] = useState(false);
  const [remindResult, setRemindResult] = useState<{ success: number; skipped: number } | null>(null);

  const unsignedHouseholds = useMemo(() => {
    if (!project) return [];
    return project.households.filter(
      (h) => !project.surveyResponses.some((r) => r.householdId === h.id)
    );
  }, [project]);

  const filteredHouseholds = useMemo(() => {
    if (!project) return [];
    if (filterType === 'unsigned') {
      return unsignedHouseholds;
    }
    if (filterType === 'signed') {
      return project.households.filter((h) =>
        project.surveyResponses.some((r) => r.householdId === h.id)
      );
    }
    return project.households;
  }, [filterType, project, unsignedHouseholds]);

  const canRemindCount = useMemo(() => {
    if (!project) return 0;
    return unsignedHouseholds.filter((h) => canRemindHousehold(project.id, h.id)).length;
  }, [unsignedHouseholds, project, canRemindHousehold]);

  if (!project) return null;

  const handleSubmit = () => {
    if (!selectedHousehold || !selectedOpinion) return;

    addSurveyResponse(project.id, {
      householdId: selectedHousehold,
      opinion: selectedOpinion,
      reason,
    });

    const totalHouseholds = project.households.length;
    const agreeCount = project.surveyResponses.filter(
      (r) => r.opinion === 'agree'
    ).length + (selectedOpinion === 'agree' ? 1 : 0);

    if (agreeCount * 3 >= totalHouseholds * 2 && project.status === 'surveying') {
      updateProjectStatus(project.id, 'approved');
    }

    setSelectedHousehold(null);
    setSelectedOpinion(null);
    setReason('');
    setShowConfirm(false);
  };

  const startSurvey = () => {
    if (project.status === 'draft') {
      updateProjectStatus(project.id, 'surveying');
    }
  };

  const totalHouseholds = project.households.length;
  const signedCount = project.surveyResponses.length;
  const signRate = totalHouseholds > 0 ? Math.round((signedCount / totalHouseholds) * 100) : 0;

  const getResponseForHousehold = (householdId: string) =>
    project.surveyResponses.find((r) => r.householdId === householdId);

  const handleSelectAll = () => {
    const unsignedIds = unsignedHouseholds.map((h) => h.id);
    if (selectedIds.length === unsignedIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unsignedIds);
    }
  };

  const handleSelectHousehold = (householdId: string) => {
    if (selectedIds.includes(householdId)) {
      setSelectedIds(selectedIds.filter((id) => id !== householdId));
    } else {
      setSelectedIds([...selectedIds, householdId]);
    }
  };

  const handleBatchRemind = () => {
    if (selectedIds.length === 0) return;
    const result = batchRemind(project.id, selectedIds);
    setRemindResult(result);
    setShowRemindResult(true);
    setSelectedIds([]);
  };

  const formatReminderTime = (time: string | null) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAllSelected = selectedIds.length === unsignedHouseholds.length && unsignedHouseholds.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < unsignedHouseholds.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {project.status === 'draft' && (
        <div className="card p-6 border-amber-300 bg-amber-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">
                  尚未发起意见征询
                </h3>
                <p className="text-sm text-slate-600">
                  确认住户信息和费用分摊方案无误后，正式发起意见征询
                </p>
              </div>
            </div>
            <button onClick={startSurvey} className="btn-primary">
              发起意见征询
            </button>
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <Vote className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-800">
              征询进度概览
            </h3>
            <p className="text-sm text-slate-500">
              实时更新，共 {totalHouseholds} 户，已签署 {signedCount} 户（{signRate}%）
            </p>
          </div>
        </div>
        <SurveyChart project={project} />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h3 className="font-serif text-lg font-bold text-slate-800">
              各户签署情况
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowNames(!showNames)}
                className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
              >
                {showNames ? (
                  <>
                    <EyeOff className="w-4 h-4" /> 脱敏显示
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" /> 查看实名
                  </>
                )}
              </button>
            </div>
          </div>

          {project.status === 'surveying' && (
            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 font-medium">筛选：</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'unsigned', label: '未签署' },
                    { key: 'signed', label: '已签署' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFilterType(item.key as FilterType)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        filterType === item.key
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {filterType === 'unsigned' && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors"
                    >
                      {isAllSelected || isIndeterminate ? (
                        <CheckSquare className="w-4 h-4 text-primary-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {isAllSelected ? '取消全选' : '全选未签署住户'}
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        已选 {selectedIds.length} 户，可催签 {canRemindCount} 户
                      </span>
                      <button
                        onClick={handleBatchRemind}
                        disabled={selectedIds.length === 0}
                        className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Megaphone className="w-4 h-4" />
                        批量催签
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
            {filteredHouseholds.map((household) => {
              const response = getResponseForHousehold(household.id);
              const isSelected = selectedHousehold === household.id;
              const isChecked = selectedIds.includes(household.id);
              const reminderCount = getHouseholdReminderCount(project.id, household.id);
              const lastReminder = getHouseholdLastReminder(project.id, household.id);
              const canRemind = canRemindHousehold(project.id, household.id);

              return (
                <div
                  key={household.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    filterType === 'unsigned' && project.status === 'surveying'
                      ? 'cursor-pointer'
                      : project.status === 'surveying' && !response
                      ? 'cursor-pointer'
                      : ''
                  } ${
                    isSelected
                      ? 'border-primary-400 bg-primary-50'
                      : response
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      : isChecked
                      ? 'border-primary-300 bg-primary-50/50'
                      : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-primary-50/30'
                  }`}
                  onClick={() => {
                    if (filterType === 'unsigned' && project.status === 'surveying') {
                      handleSelectHousehold(household.id);
                    } else if (project.status === 'surveying' && !response) {
                      setSelectedHousehold(household.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      {filterType === 'unsigned' && project.status === 'surveying' && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectHousehold(household.id);
                          }}
                          className="flex-shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      )}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-slate-600">
                          {household.floor}F
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-slate-800">
                            {household.unit} 室
                          </span>
                          <span className="text-slate-500">
                            {showNames ? household.ownerName : maskName(household.ownerName)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">
                          {household.area} ㎡ · 分摊 {household.shareRatio}%
                        </div>
                        {reminderCount > 0 && !response && (
                          <div className="mt-1.5 flex items-center gap-2 text-xs">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                              canRemind
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Bell className="w-3 h-3" />
                              已催签 {reminderCount} 次
                            </span>
                            <span className="text-slate-400">
                              最后催签：{formatReminderTime(lastReminder)}
                            </span>
                            {!canRemind && (
                              <span className="text-slate-400">
                                (24小时内不可重复催签)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {response ? (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`badge border ${OPINION_COLOR[response.opinion]}`}
                        >
                          {OPINION_LABEL[response.opinion]}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(response.signedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    ) : project.status === 'surveying' ? (
                      <span className="badge bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                        待签署
                      </span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-500 flex-shrink-0">
                        未开始
                      </span>
                    )}
                  </div>

                  {response?.reason && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600">
                      <span className="text-slate-400 mr-2">理由：</span>
                      {response.reason}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredHouseholds.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">暂无符合条件的住户</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-8">
            {selectedHousehold ? (
              <>
                <h3 className="font-serif text-lg font-bold text-slate-800 mb-4">
                  签署意见
                </h3>

                <div className="mb-5 p-4 bg-slate-50 rounded-lg">
                  {(() => {
                    const h = project.households.find(
                      (hh) => hh.id === selectedHousehold
                    );
                    if (!h) return null;
                    return (
                      <div className="text-sm">
                        <p className="text-slate-500 mb-1">您正在以</p>
                        <p className="font-semibold text-slate-800 text-base">
                          {h.floor} 层 {h.unit} 室 · {maskName(h.ownerName)}
                        </p>
                        <p className="text-slate-500 mt-1">
                          房屋面积 {h.area}㎡，分摊比例 {h.shareRatio}%
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-3 mb-5">
                  <OpinionCard
                    type="agree"
                    selected={selectedOpinion === 'agree'}
                    onClick={() => setSelectedOpinion('agree')}
                  />
                  <OpinionCard
                    type="oppose"
                    selected={selectedOpinion === 'oppose'}
                    onClick={() => setSelectedOpinion('oppose')}
                  />
                  <OpinionCard
                    type="abstain"
                    selected={selectedOpinion === 'abstain'}
                    onClick={() => setSelectedOpinion('abstain')}
                  />
                </div>

                <div className="mb-5">
                  <label className="label-field">意见理由（选填）</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input-field min-h-[100px] resize-none"
                    placeholder="请简要说明您的意见理由..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedHousehold(null);
                      setSelectedOpinion(null);
                      setReason('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={!selectedOpinion}
                    className="btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    提交意见
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Vote className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-medium text-slate-700 mb-1">
                  选择待签署住户
                </h4>
                <p className="text-sm text-slate-500">
                  从左侧列表中选择您的房屋进行意见签署
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">确认提交意见？</h4>
                <p className="text-sm text-slate-500">意见一经提交不可修改</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">您的意见</span>
                <span
                  className={`badge ${OPINION_COLOR[selectedOpinion!]}`}
                >
                  {OPINION_LABEL[selectedOpinion!]}
                </span>
              </div>
              {reason && (
                <div className="text-sm">
                  <span className="text-slate-500">理由：</span>
                  <span className="text-slate-700 ml-1">{reason}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1"
              >
                返回修改
              </button>
              <button onClick={handleSubmit} className="btn-primary flex-1">
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemindResult && remindResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">批量催签完成</h4>
                <p className="text-sm text-slate-500">催签提醒已发送</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">成功催签</span>
                <span className="font-semibold text-green-600">{remindResult.success} 户</span>
              </div>
              {remindResult.skipped > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">跳过（24小时内已催签）</span>
                  <span className="font-semibold text-amber-600">{remindResult.skipped} 户</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowRemindResult(false);
                setRemindResult(null);
              }}
              className="btn-primary w-full"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OpinionCard({
  type,
  selected,
  onClick,
}: {
  type: OpinionType;
  selected: boolean;
  onClick: () => void;
}) {
  const config = {
    agree: {
      icon: ThumbsUp,
      label: '同意',
      desc: '支持加装电梯方案',
      color: 'green',
    },
    oppose: {
      icon: ThumbsDown,
      label: '反对',
      desc: '对方案有异议',
      color: 'red',
    },
    abstain: {
      icon: MinusCircle,
      label: '弃权',
      desc: '暂不发表意见',
      color: 'slate',
    },
  }[type];

  const Icon = config.icon;

  const selectedStyles = {
    green: 'bg-green-50 border-green-400 ring-2 ring-green-200',
    red: 'bg-red-50 border-red-400 ring-2 ring-red-200',
    slate: 'bg-slate-100 border-slate-400 ring-2 ring-slate-200',
  }[config.color];

  const textColor = {
    green: 'text-green-700',
    red: 'text-red-700',
    slate: 'text-slate-700',
  }[config.color];

  const iconBg = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    slate: 'bg-slate-200 text-slate-600',
  }[config.color];

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? selectedStyles
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${textColor}`}>{config.label}</p>
          <p className="text-sm text-slate-500">{config.desc}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            selected ? 'border-transparent bg-primary-600' : 'border-slate-300'
          }`}
        >
          {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
      </div>
    </button>
  );
}
