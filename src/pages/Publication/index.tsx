import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowLeft,
  MessageSquare,
  Shield,
  Loader2,
  Building2,
  MapPin,
  DollarSign,
  Calculator,
  MessageSquarePlus,
  X,
  Check,
  ThumbsUp,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { formatCurrency, calculateShareRatio } from '@/utils/feeCalculator';
import { maskName, maskPhone } from '@/utils/maskData';
import { FEE_OBJECTION_STATUS_LABEL, FEE_OBJECTION_STATUS_COLOR } from '@/types';
import type { Household, FeeObjection } from '@/types';

export default function PublicationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const initProjects = useProjectStore((s) => s.initProjects);
  const getPublicationByToken = useProjectStore((s) => s.getPublicationByToken);
  const isPublicationActive = useProjectStore((s) => s.isPublicationActive);
  const addFeedback = useProjectStore((s) => s.addFeedback);
  const addFeeObjection = useProjectStore((s) => s.addFeeObjection);
  const getProjectFeeObjections = useProjectStore((s) => s.getProjectFeeObjections);

  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [showFeeSection, setShowFeeSection] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);

  const [showObjectionDialog, setShowObjectionDialog] = useState(false);
  const [objectionReason, setObjectionReason] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [objectionError, setObjectionError] = useState('');
  const [objectionSubmitted, setObjectionSubmitted] = useState(false);

  useEffect(() => {
    if (projects.length === 0) {
      initProjects();
    }
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [projects.length, initProjects]);

  const result = token ? getPublicationByToken(token) : null;
  const isActive = result ? isPublicationActive(result.publication) : false;

  if (isLoading || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">链接无效</h2>
          <p className="text-slate-600 mb-6">
            该公示链接不存在或已被删除。
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const { publication, project } = result;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRemainingTime = () => {
    const now = new Date();
    const end = new Date(publication.endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return '已过期';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `剩余 ${days} 天 ${hours} 小时`;
    if (hours > 0) return `剩余 ${hours} 小时 ${minutes} 分钟`;
    return `剩余 ${minutes} 分钟`;
  };

  const calculatedHouseholds = calculateShareRatio(
    project.households.map((h) => ({
      ...h,
      shareRatio: 0,
      shareAmount: 0,
    })),
    project.totalCost
  );

  const displayHouseholds = calculatedHouseholds.map((calcH) => {
    const storedH = project.households.find((h) => h.id === calcH.id);
    return {
      ...calcH,
      shareAmount: storedH ? storedH.shareAmount : calcH.shareAmount,
    };
  });

  const floors = Array.from(
    new Set(displayHouseholds.map((h) => h.floor))
  ).sort((a, b) => a - b);

  const unitsForSelectedFloor = displayHouseholds
    .filter((h) => h.floor === parseInt(selectedFloor))
    .map((h) => h.unit);

  const handleFloorChange = (floor: string) => {
    setSelectedFloor(floor);
    setSelectedUnit('');
    setSelectedHousehold(null);
  };

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
    const household = displayHouseholds.find(
      (h) => h.floor === parseInt(selectedFloor) && h.unit === unit
    );
    setSelectedHousehold(household || null);
  };

  const myObjections = selectedHousehold
    ? getProjectFeeObjections(project.id).filter(
        (o) => o.householdId === selectedHousehold.id
      )
    : [];

  const handleOpenObjection = () => {
    if (!selectedHousehold) return;
    setObjectionReason('');
    setRequestedAmount('');
    setObjectionError('');
    setObjectionSubmitted(false);
    setShowObjectionDialog(true);
  };

  const handleSubmitObjection = () => {
    if (!selectedHousehold) return;

    if (!objectionReason.trim()) {
      setObjectionError('请填写异议理由说明');
      return;
    }

    const requested = requestedAmount ? parseFloat(requestedAmount) : undefined;
    if (requestedAmount && (isNaN(requested!) || requested! < 0)) {
      setObjectionError('请输入有效的申请调整金额');
      return;
    }

    const result = addFeeObjection(project.id, {
      householdId: selectedHousehold.id,
      reason: objectionReason.trim(),
      requestedAmount: requested,
    });

    if (result) {
      setObjectionSubmitted(true);
    } else {
      setObjectionError('提交失败，请稍后重试');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('请输入您的意见或建议');
      return;
    }

    if (!isActive) {
      setError('公示期已结束，无法提交反馈');
      return;
    }

    const result = addFeedback(token!, {
      content: content.trim(),
      contact: contact.trim() || undefined,
    });

    if (result) {
      setSubmitted(true);
    } else {
      setError('提交失败，请稍后重试');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">提交成功</h2>
          <p className="text-slate-600 mb-6">
            感谢您的宝贵意见！我们会认真处理每一条反馈。
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setContent('');
              setContact('');
            }}
            className="btn btn-secondary inline-flex items-center gap-2 mr-3"
          >
            <MessageSquare className="w-4 h-4" />
            继续提交
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-primary-700 via-primary-800 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-primary-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">{publication.title}</h1>
              <div className="flex items-center gap-2 text-primary-200 text-sm mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{project.name}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-primary-200">
              <MapPin className="w-4 h-4" />
              <span>{project.address}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${isActive ? 'text-green-300' : 'text-red-300'}`}>
              <Clock className="w-4 h-4" />
              <span>{isActive ? getRemainingTime() : '公示已结束'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!isActive && (
          <div className="card p-4 mb-6 bg-red-50 border-red-200 border animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">公示期已结束</p>
                <p className="text-sm text-red-600">
                  该公示于 {formatDate(publication.endTime)} 截止，现已无法提交反馈。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6 mb-6 animate-slide-up">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            公示说明
          </h3>
          <p className="text-slate-600 leading-relaxed">{publication.description}</p>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">开始时间</span>
              <p className="font-medium text-slate-800">{formatDate(publication.startTime)}</p>
            </div>
            <div>
              <span className="text-slate-500">截止时间</span>
              <p className="font-medium text-slate-800">{formatDate(publication.endTime)}</p>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              提交意见和建议
            </h3>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  您的反馈将匿名提交，联系方式仅用于必要时与您沟通，我们将严格保密。
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  意见和建议 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入您对该方案的意见或建议..."
                  rows={5}
                  className="input"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <p className="text-xs text-slate-400 ml-auto">{content.length}/1000</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  联系方式（可选）
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="手机号或邮箱，方便我们与您沟通"
                  className="input"
                  maxLength={50}
                />
                <p className="text-xs text-slate-400 mt-1">选填，我们将严格保密</p>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                提交反馈
              </button>
            </form>
          </div>
        )}

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <button
            onClick={() => setShowFeeSection(!showFeeSection)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary-600" />
              费用分摊明细
            </h3>
            <span className="text-sm text-slate-500">
              {showFeeSection ? '收起' : '查看'}
            </span>
          </button>

          {showFeeSection && (
            <div className="mt-5 space-y-5">
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-primary-700">
                    <p className="font-medium mb-1">工程总费用</p>
                    <p className="text-lg font-bold text-primary-800">
                      {project.totalCost} 万元
                    </p>
                    <p className="text-primary-600 mt-1">
                      系统根据楼层系数和房屋面积自动计算分摊比例
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  选择楼层
                </label>
                <select
                  value={selectedFloor}
                  onChange={(e) => handleFloorChange(e.target.value)}
                  className="input"
                >
                  <option value="">请选择楼层</option>
                  {floors.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor} 层
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  选择房号
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="input"
                  disabled={!selectedFloor}
                >
                  <option value="">请选择房号</option>
                  {unitsForSelectedFloor.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedHousehold && (
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {selectedHousehold.floor}层 {selectedHousehold.unit}
                      </p>
                      <p className="text-sm text-slate-500">
                        户主：{maskName(selectedHousehold.ownerName)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-slate-500 mb-1">建筑面积</p>
                      <p className="font-bold text-slate-800">
                        {selectedHousehold.area} ㎡
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-slate-500 mb-1">分摊比例</p>
                      <p className="font-bold text-primary-600">
                        {selectedHousehold.shareRatio}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-slate-500 mb-1">分摊金额</p>
                      <p className="font-bold text-amber-600">
                        {formatCurrency(selectedHousehold.shareAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {isActive && (
                  <button
                    onClick={handleOpenObjection}
                    className="btn btn-outline w-full inline-flex items-center justify-center gap-2"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    对分摊金额有异议？点击提交
                  </button>
                )}

                {myObjections.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-700 text-sm">
                      我的异议记录（{myObjections.length} 条）
                    </h4>
                    {myObjections.map((objection) => (
                      <div
                        key={objection.id}
                        className="border border-slate-200 rounded-lg overflow-hidden"
                      >
                        <div className="p-3 bg-slate-50 flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                          {new Date(objection.createdAt).toLocaleString('zh-CN')}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${FEE_OBJECTION_STATUS_COLOR[objection.status]}`}
                          >
                            {FEE_OBJECTION_STATUS_LABEL[objection.status]}
                          </span>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="p-2.5 bg-amber-50 rounded border border-amber-100">
                            <p className="text-xs text-amber-600 mb-1">异议理由</p>
                            <p className="text-sm text-amber-800">
                              {objection.reason}
                            </p>
                          </div>
                          {objection.status !== 'pending' && (
                            <div
                              className={`p-2.5 rounded border ${
                                objection.status === 'adjusted'
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <p
                                className={`text-xs mb-1 ${
                                  objection.status === 'adjusted'
                                    ? 'text-green-600'
                                    : 'text-slate-500'
                                }`}
                              >
                                处理结果
                              </p>
                              {objection.adjustedAmount !== undefined && (
                                <p className="text-sm font-medium text-green-700 mb-1">
                                  调整后金额：{formatCurrency(objection.adjustedAmount)}
                                </p>
                              )}
                              <p
                                className={`text-sm ${
                                  objection.status === 'adjusted'
                                    ? 'text-green-700'
                                    : 'text-slate-600'
                                }`}
                              >
                                {objection.handleReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {showObjectionDialog && selectedHousehold && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  提交费用分摊异议
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedHousehold.floor}层 {selectedHousehold.unit}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowObjectionDialog(false);
                  setObjectionSubmitted(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {objectionSubmitted ? (
              <div className="flex-1 overflow-auto p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    提交成功
                  </h3>
                  <p className="text-slate-600 mb-6">
                    您的异议已提交，我们会尽快审核处理。
                    <br />
                    处理结果将在此页面公示。
                  </p>
                  <button
                    onClick={() => {
                      setShowObjectionDialog(false);
                      setObjectionSubmitted(false);
                    }}
                    className="btn btn-primary"
                  >
                    我知道了
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-6 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">分摊比例：</span>
                        <span className="font-medium text-primary-700">
                          {selectedHousehold.shareRatio}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">分摊金额：</span>
                        <span className="font-bold text-amber-600">
                          {formatCurrency(selectedHousehold.shareAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      异议理由说明 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={objectionReason}
                      onChange={(e) => setObjectionReason(e.target.value)}
                      placeholder="请详细说明您对分摊金额的异议理由..."
                      rows={4}
                      className="input resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {objectionError && (
                      <p className="text-sm text-red-600">{objectionError}</p>
                    )}
                      <p className="text-xs text-slate-400 ml-auto">
                        {objectionReason.length}/500
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      申请调整金额（可选）
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        ¥
                      </span>
                      <input
                        type="number"
                        value={requestedAmount}
                        onChange={(e) => setRequestedAmount(e.target.value)}
                        placeholder="请输入您认为合理的分摊金额"
                        className="input pl-8"
                        min="0"
                        step="100"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      选填，您认为合理的分摊金额
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700">
                        您的异议将提交给项目负责人审核，
                        审核结果会在此公示。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowObjectionDialog(false);
                      setObjectionSubmitted(false);
                    }}
                    className="btn btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitObjection}
                    className="btn btn-primary inline-flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    提交异议
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
