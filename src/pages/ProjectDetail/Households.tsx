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
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { calculateShareRatio, formatCurrency } from '@/utils/feeCalculator';
import { maskName, maskPhone } from '@/utils/maskData';
import { parseExcelFile, generateExcelTemplate } from '@/utils/excelImporter';
import type { ImportResult } from '@/utils/excelImporter';

export default function HouseholdsPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const importHouseholds = useProjectStore((s) => s.importHouseholds);
  const [showNames, setShowNames] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);

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

  if (!project) return null;

  const recalculated = calculateShareRatio(
    project.households.map((h) => ({
      ...h,
      shareRatio: 0,
      shareAmount: 0,
    })),
    project.totalCost
  );

  const totalShare = recalculated.reduce(
    (sum, h) => sum + h.shareAmount,
    0
  );

  const householdsByFloor: Record<number, typeof recalculated> = {};
  recalculated.forEach((h) => {
    if (!householdsByFloor[h.floor]) householdsByFloor[h.floor] = [];
    householdsByFloor[h.floor].push(h);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">总户数</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {recalculated.length} 户
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
            {recalculated.filter((h) => h.shareAmount > 0).length} 户
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
                      {floorHouseholds.map((h, idx) => (
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
                        </tr>
                      ))}
                    </>
                  );
                })}
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={5} className="px-4 py-3 text-right text-slate-700">
                  合计
                </td>
                <td className="px-4 py-3 text-right text-primary-700">
                  {recalculated.reduce((s, h) => s + h.shareRatio, 0).toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right text-amber-600">
                  {formatCurrency(totalShare)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
}
