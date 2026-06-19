import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Calculator,
  DollarSign,
  Info,
  Eye,
  EyeOff,
  Upload,
  Download,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  MessageSquarePlus,
  Clock,
  CheckCircle2,
  Edit3,
  ThumbsUp,
  Send,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { calculateShareRatio, formatCurrency } from '@/utils/feeCalculator';
import { maskName, maskPhone } from '@/utils/maskData';
import { parseExcelFile, generateExcelTemplate } from '@/utils/excelImporter';
import type { ImportResult } from '@/utils/excelImporter';
import { FEE_OBJECTION_STATUS_LABEL, FEE_OBJECTION_STATUS_COLOR } from '@/types';
import type { FeeObjection, Household } from '@/types';

export default function HouseholdsPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const importHouseholds = useProjectStore((s) => s.importHouseholds);
  const addFeeObjection = useProjectStore((s) => s.addFeeObjection);
  const getProjectFeeObjections = useProjectStore((s) => s.getProjectFeeObjections);
  const handleFeeObjection = useProjectStore((s) => s.handleFeeObjection);
  const [showNames, setShowNames] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);

  const [showObjectionDialog, setShowObjectionDialog] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [objectionReason, setObjectionReason] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [objectionError, setObjectionError] = useState('');

  const [showHandleDialog, setShowHandleDialog] = useState(false);
  const [selectedObjection, setSelectedObjection] = useState<FeeObjection | null>(null);
  const [handleType, setHandleType] = useState<'upheld' | 'adjusted'>('upheld');
  const [handleReason, setHandleReason] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState('');
  const [handleError, setHandleError] = useState('');

  const [showObjectionList, setShowObjectionList] = useState(true);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const result = await parseExcelFile(file);
      setImportResult(result);
      setShowImportPreview(true);
    } catch (err) {
      setImportError((err as Error).message);
    } finally {
      setIsImporting(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!importResult || !id || !project) return;

    const newHouseholds = importResult.validRows.map((row) => ({
      floor: row.floor,
      unit: row.unit,
      area: row.area,
      ownerName: row.ownerName,
      phone: row.phone,
      familyPopulation: row.familyPopulation || 3,
    }));

    importHouseholds(id, newHouseholds);
    setShowImportPreview(false);
    setImportResult(null);
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setImportResult(null);
    setImportError(null);
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate();
  };

  const openObjectionDialog = (household: Household) => {
    setSelectedHousehold(household);
    setObjectionReason('');
    setRequestedAmount('');
    setObjectionError('');
    setShowObjectionDialog(true);
  };

  const handleSubmitObjection = () => {
    if (!selectedHousehold || !id || !project) return;

    if (!objectionReason.trim()) {
      setObjectionError('请填写异议理由说明');
      return;
    }

    const requested = requestedAmount ? parseFloat(requestedAmount) : undefined;
    if (requestedAmount && (isNaN(requested!) || requested! < 0)) {
      setObjectionError('请输入有效的申请调整金额');
      return;
    }

    const result = addFeeObjection(id, {
      householdId: selectedHousehold.id,
      reason: objectionReason.trim(),
      requestedAmount: requested,
    });

    if (result) {
      setShowObjectionDialog(false);
      setSelectedHousehold(null);
    } else {
      setObjectionError('提交失败，请稍后重试');
    }
  };

  const openHandleDialog = (objection: FeeObjection) => {
    setSelectedObjection(objection);
    setHandleType('upheld');
    setHandleReason('');
    setAdjustedAmount('');
    setHandleError('');
    setShowHandleDialog(true);
  };

  const handleSubmitHandle = () => {
    if (!selectedObjection || !id) return;

    if (!handleReason.trim()) {
      setHandleError('请填写处理意见说明');
      return;
    }

    if (handleType === 'adjusted') {
      const amount = parseFloat(adjustedAmount);
      if (isNaN(amount) || amount < 0) {
        setHandleError('请输入有效的调整金额');
        return;
      }

      handleFeeObjection(id, selectedObjection.id, {
        status: 'adjusted',
        handleReason: handleReason.trim(),
        adjustedAmount: amount,
        handler: '项目负责人',
      });
    } else {
      handleFeeObjection(id, selectedObjection.id, {
        status: 'upheld',
        handleReason: handleReason.trim(),
        handler: '项目负责人',
      });
    }

    setShowHandleDialog(false);
    setSelectedObjection(null);
  };

  if (!project) return null;

  const calculated = calculateShareRatio(
    project.households.map((h) => ({
      ...h,
      shareRatio: 0,
      shareAmount: 0,
    })),
    project.totalCost
  );

  const displayHouseholds = calculated.map((calcH) => {
    const storedH = project.households.find((h) => h.id === calcH.id);
    return {
      ...calcH,
      shareAmount: storedH ? storedH.shareAmount : calcH.shareAmount,
    };
  });

  const totalShare = displayHouseholds.reduce(
    (sum, h) => sum + h.shareAmount,
    0
  );

  const householdsByFloor: Record<number, typeof displayHouseholds> = {};
  displayHouseholds.forEach((h) => {
    if (!householdsByFloor[h.floor]) householdsByFloor[h.floor] = [];
    householdsByFloor[h.floor].push(h);
  });

  const feeObjections = id ? getProjectFeeObjections(id) : [];
  const pendingObjectionCount = feeObjections.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-5 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">总户数</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {displayHouseholds.length} 户
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">工程总费用</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {project.totalCost} 万元
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Calculator className="w-4 h-4" />
            <span className="text-sm">已分摊总额</span>
          </div>
          <p className="text-2xl font-bold text-primary-700">
            {formatCurrency(totalShare)}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Info className="w-4 h-4" />
            <span className="text-sm">参与分摊</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {displayHouseholds.filter((h) => h.shareAmount > 0).length} 户
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <MessageSquarePlus className="w-4 h-4" />
            <span className="text-sm">费用异议</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {pendingObjectionCount} 条待审
          </p>
        </div>
      </div>

      {importError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">导入失败</p>
            <p className="text-sm text-red-600">{importError}</p>
          </div>
        </div>
      )}

      {isImporting && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-700">正在解析 Excel 文件...</p>
        </div>
      )}

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-800 mb-1">
              费用分摊明细表
            </h3>
            <p className="text-sm text-slate-500">
              系统根据楼层系数和房屋面积自动计算分摊比例
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              下载模板
            </button>
            <label className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" />
              批量导入
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowNames(!showNames)}
              className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
            >
              {showNames ? (
                <>
                  <EyeOff className="w-4 h-4" /> 隐藏姓名
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" /> 显示姓名
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 mb-5">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-700">
              <p className="font-medium mb-1">分摊规则说明</p>
              <ul className="space-y-0.5 text-primary-600">
                <li>• 1 楼：0%（不分摊）</li>
                <li>• 2 楼：基础比例 8%</li>
                <li>• 3 楼及以上：每层递增 4%（如 3楼 12%，4楼 16%...）</li>
                <li>• 同层多户：按房屋面积比例分摊该层总比例</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">楼层</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">室号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">户主</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">联系电话</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">建筑面积</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">分摊比例</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">分摊金额</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.keys(householdsByFloor)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((floorStr) => {
                  const floor = parseInt(floorStr);
                  const floorHouseholds = householdsByFloor[floor];
                  const floorRatio = floorHouseholds.reduce(
                    (sum, h) => sum + h.shareRatio,
                    0
                  );
                  const floorAmount = floorHouseholds.reduce(
                    (sum, h) => sum + h.shareAmount,
                    0
                  );

                  return (
                    <>
                      {floorHouseholds.map((h, idx) => {
                        const householdObjections = feeObjections.filter(
                          (o) => o.householdId === h.id
                        );
                        const hasPendingObjection = householdObjections.some(
                          (o) => o.status === 'pending'
                        );

                        return (
                          <tr key={h.id} className="hover:bg-slate-50">
                            {idx === 0 && (
                              <td
                                rowSpan={floorHouseholds.length}
                                className="px-4 py-3 font-medium text-slate-700 bg-slate-50/50"
                              >
                                {floor} 层
                                <div className="text-xs text-slate-500 font-normal mt-0.5">
                                  {floorRatio.toFixed(2)}% · {formatCurrency(floorAmount)}
                                </div>
                              </td>
                            )}
                            <td className="px-4 py-3 text-slate-700">{h.unit}</td>
                            <td className="px-4 py-3 text-slate-700">
                              {showNames ? h.ownerName : maskName(h.ownerName)}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {showNames ? h.phone : maskPhone(h.phone)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {h.area} ㎡
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-primary-700">
                              {h.shareRatio}%
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-600">
                              {formatCurrency(h.shareAmount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {hasPendingObjection && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                    异议待审
                                  </span>
                                )}
                                {householdObjections.length > 0 && !hasPendingObjection && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                    已处理
                                  </span>
                                )}
                                <button
                                  onClick={() => openObjectionDialog(h)}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-1"
                                  title="提出异议"
                                >
                                  <MessageSquarePlus className="w-4 h-4" />
                                  异议
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={5} className="px-4 py-3 text-right text-slate-700">
                  合计
                </td>
                <td className="px-4 py-3 text-right text-primary-700">
                  {displayHouseholds.reduce((s, h) => s + h.shareRatio, 0).toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right text-amber-600">
                  {formatCurrency(totalShare)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {feeObjections.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <MessageSquarePlus className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-800">
                  费用异议记录
                </h3>
                <p className="text-sm text-slate-500">
                  共 {feeObjections.length} 条异议，其中待处理 {pendingObjectionCount} 条
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowObjectionList(!showObjectionList)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {showObjectionList ? '收起' : '展开'}
            </button>
          </div>

          {showObjectionList && (
            <div className="space-y-4">
              {feeObjections.map((objection) => (
                <div
                  key={objection.id}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-primary-700 text-sm">
                          {objection.unit}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {objection.floor}层 {objection.unit} · {objection.householdName}
                        </p>
                        <p className="text-xs text-slate-500">
                          提交时间：{new Date(objection.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${FEE_OBJECTION_STATUS_COLOR[objection.status]}`}
                      >
                        {FEE_OBJECTION_STATUS_LABEL[objection.status]}
                      </span>
                      {objection.status === 'pending' && (
                        <button
                          onClick={() => openHandleDialog(objection)}
                          className="btn-primary !py-1.5 !px-3 text-sm inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          审核
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">原分摊金额：</span>
                        <span className="font-medium text-slate-700">
                          {formatCurrency(objection.originalAmount)}
                        </span>
                      </div>
                      {objection.requestedAmount !== undefined && (
                        <div>
                          <span className="text-slate-500">申请调整金额：</span>
                          <span className="font-medium text-amber-600">
                            {formatCurrency(objection.requestedAmount)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-sm font-medium text-amber-800 mb-1">异议理由</p>
                      <p className="text-sm text-amber-700 whitespace-pre-wrap">
                        {objection.reason}
                      </p>
                    </div>

                    {objection.status !== 'pending' && (
                      <div
                        className={`p-3 rounded-lg border ${
                          objection.status === 'adjusted'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {objection.status === 'adjusted' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <ThumbsUp className="w-4 h-4 text-slate-600" />
                          )}
                          <p
                            className={`text-sm font-medium ${
                              objection.status === 'adjusted'
                                ? 'text-green-800'
                                : 'text-slate-700'
                            }`}
                          >
                            处理结果：{FEE_OBJECTION_STATUS_LABEL[objection.status]}
                          </p>
                        </div>
                        {objection.adjustedAmount !== undefined && (
                          <p className="text-sm text-green-700 mb-1">
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
                          处理意见：{objection.handleReason}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            objection.status === 'adjusted'
                              ? 'text-green-500'
                              : 'text-slate-400'
                          }`}
                        >
                          处理人：{objection.handler} ·{' '}
                          {objection.handledAt
                            ? new Date(objection.handledAt).toLocaleString('zh-CN')
                            : ''}
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

      {showImportPreview && importResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">导入数据预览</h3>
                <p className="text-sm text-slate-500 mt-1">
                  共解析 {importResult.totalRows} 行数据，
                  <span className="text-green-600 font-medium">
                    有效 {importResult.validRows.length} 行
                  </span>
                  ，
                  <span className="text-red-600 font-medium">
                    无效 {importResult.invalidRows.length} 行
                  </span>
                </p>
              </div>
              <button
                onClick={handleCancelImport}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {importResult.invalidRows.length > 0 && (
              <div className="p-4 bg-amber-50 border-b border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 mb-2">
                      以下行存在格式错误，将被跳过：
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                      {importResult.invalidRows.map((row) => (
                        <div
                          key={row.rowNumber}
                          className="text-sm text-amber-700 bg-amber-100/50 px-3 py-2 rounded"
                        >
                          <span className="font-medium">第 {row.rowNumber} 行：</span>
                          {row.errors.join('；')}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto p-6">
              {(() => {
                const combinedHouseholds = [
                  ...project.households,
                  ...importResult.validRows.map((r) => ({
                    id: `temp-new-${r.rowNumber}`,
                    projectId: project.id,
                    floor: r.floor,
                    unit: r.unit,
                    area: r.area,
                    ownerName: r.ownerName,
                    phone: r.phone,
                    familyPopulation: r.familyPopulation || 3,
                    shareRatio: 0,
                    shareAmount: 0,
                  })),
                ];

                const calculated = calculateShareRatio(
                  combinedHouseholds.map((h) => ({
                    ...h,
                    shareRatio: 0,
                    shareAmount: 0,
                  })),
                  project.totalCost
                );

                const newCalculated = calculated.slice(project.households.length);

                return (
                  <>
                    <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-100">
                      <div className="flex items-start gap-2">
                        <Calculator className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-primary-700">
                          <p className="font-medium mb-1">费用分摊预览</p>
                          <p>
                            系统已根据楼层系数和房屋面积自动计算每户分摊金额。
                            导入后，所有住户（含已有住户）的分摊比例将重新计算。
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-slate-700 mb-3">
                      以下 {importResult.validRows.length} 行数据将被导入：
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">状态</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">行号</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">姓名</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">电话</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">楼层</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">房号</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-600">面积</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-600">分摊比例</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-600">分摊金额</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {importResult.validRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <Check className="w-4 h-4 text-green-500" />
                              </td>
                              <td className="px-4 py-3 text-slate-500">{row.rowNumber}</td>
                              <td className="px-4 py-3 text-slate-700">{row.ownerName}</td>
                              <td className="px-4 py-3 text-slate-700">{row.phone}</td>
                              <td className="px-4 py-3 text-slate-700">{row.floor} 层</td>
                              <td className="px-4 py-3 text-slate-700">{row.unit}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{row.area} ㎡</td>
                              <td className="px-4 py-3 text-right font-medium text-primary-700">
                                {newCalculated[idx]?.shareRatio.toFixed(2) || 0}%
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-amber-600">
                                {formatCurrency(newCalculated[idx]?.shareAmount || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelImport}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                className="btn-primary inline-flex items-center gap-1.5"
                disabled={importResult.validRows.length === 0}
              >
                <Check className="w-4 h-4" />
                确认导入 {importResult.validRows.length} 条数据
              </button>
            </div>
          </div>
        </div>
      )}

      {showObjectionDialog && selectedHousehold && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">提交费用分摊异议</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedHousehold.floor}层 {selectedHousehold.unit} · {selectedHousehold.ownerName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowObjectionDialog(false);
                  setSelectedHousehold(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

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
                  className="input-field resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  {objectionError && <p className="text-sm text-red-600">{objectionError}</p>}
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
                    className="input-field pl-8"
                    min="0"
                    step="100"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">选填，您认为合理的分摊金额</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowObjectionDialog(false);
                  setSelectedHousehold(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSubmitObjection}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                提交异议
              </button>
            </div>
          </div>
        </div>
      )}

      {showHandleDialog && selectedObjection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">审核费用异议</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedObjection.floor}层 {selectedObjection.unit} · {selectedObjection.householdName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHandleDialog(false);
                  setSelectedObjection(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-amber-800 mb-1">异议内容</p>
                <p className="text-sm text-amber-700 whitespace-pre-wrap">
                  {selectedObjection.reason}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">原分摊金额：</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(selectedObjection.originalAmount)}
                  </span>
                </div>
                {selectedObjection.requestedAmount !== undefined && (
                  <div>
                    <span className="text-slate-500">申请金额：</span>
                    <span className="font-medium text-amber-600">
                      {formatCurrency(selectedObjection.requestedAmount)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  处理方式
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      handleType === 'upheld'
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="handleType"
                      checked={handleType === 'upheld'}
                      onChange={() => setHandleType('upheld')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-slate-800">维持原方案</p>
                      <p className="text-sm text-slate-500">
                        原分摊金额计算无误，驳回异议申请
                      </p>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      handleType === 'adjusted'
                        ? 'border-green-300 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="handleType"
                      checked={handleType === 'adjusted'}
                      onChange={() => setHandleType('adjusted')}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">调整金额</p>
                      <p className="text-sm text-slate-500 mb-2">
                        同意调整该住户的分摊金额
                      </p>
                      {handleType === 'adjusted' && (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            ¥
                          </span>
                          <input
                            type="number"
                            value={adjustedAmount}
                            onChange={(e) => setAdjustedAmount(e.target.value)}
                            placeholder="请输入调整后的金额"
                            className="input-field pl-8 w-full"
                            min="0"
                            step="100"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  处理意见说明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={handleReason}
                  onChange={(e) => setHandleReason(e.target.value)}
                  placeholder="请填写处理意见说明，该内容将展示给住户..."
                  rows={3}
                  className="input-field resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  {handleError && <p className="text-sm text-red-600">{handleError}</p>}
                  <p className="text-xs text-slate-400 ml-auto">
                    {handleReason.length}/500
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowHandleDialog(false);
                  setSelectedObjection(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSubmitHandle}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                确认处理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
