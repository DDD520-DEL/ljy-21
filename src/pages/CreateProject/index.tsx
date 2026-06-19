import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Building2, Users, Calculator, CheckCircle2, MapPin, Home, DollarSign, FileText, AlertCircle, Upload, Download, X, Check, AlertTriangle, ChevronDown, Info, Gauge, Layers, Zap, Tag
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useElevatorStore } from '@/store/elevatorStore';
import { calculateShareRatio, formatCurrency } from '@/utils/feeCalculator';
import type { Household, ElevatorBrand, ElevatorModel } from '@/types';
import { maskName } from '@/utils/maskData';
import { parseExcelFile, generateExcelTemplate } from '@/utils/excelImporter';
import type { ImportResult } from '@/utils/excelImporter';

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return true;
  if (cleaned.length === 11 && /^1[3-9]\d{9}$/.test(cleaned)) {
    return true;
  }
  if (cleaned.length >= 7 && cleaned.length <= 12) {
    return true;
  }
  return false;
}

function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  if (phone.includes('*')) return phone;
  return phone;
}

const STEPS = [
  { key: 'basic', label: '基本信息', icon: FileText },
  { key: 'households', label: '住户信息', icon: Users },
  { key: 'preview', label: '费用预览', icon: Calculator },
];

type StepType = 'basic' | 'households' | 'preview';

interface HouseholdForm {
  floor: number;
  unit: string;
  area: number;
  ownerName: string;
  phone: string;
  familyPopulation: number;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const addProject = useProjectStore((s) => s.addProject);
  const { brands, searchModels, initBrands } = useElevatorStore();

  const [currentStep, setCurrentStep] = useState<StepType>('basic');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalFloors, setTotalFloors] = useState(6);
  const [totalCost, setTotalCost] = useState(45);

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  useEffect(() => {
    initBrands();
  }, [initBrands]);

  const selectedBrand = useMemo(() => {
    if (!selectedBrandId) return null;
    return brands.find((b) => b.id === selectedBrandId) || null;
  }, [brands, selectedBrandId]);

  const selectedModel = useMemo(() => {
    if (!selectedModelId || !selectedBrandId) return null;
    const brand = brands.find((b) => b.id === selectedBrandId);
    return brand?.models.find((m) => m.id === selectedModelId) || null;
  }, [brands, selectedBrandId, selectedModelId]);

  const recommendedModels = useMemo(() => {
    return searchModels({
      minFloors: totalFloors,
      maxFloors: totalFloors,
    });
  }, [searchModels, totalFloors]);

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedModelId(null);
    setShowBrandDropdown(false);
  };

  const handleModelSelect = (model: ElevatorModel) => {
    setSelectedModelId(model.id);
    setTotalCost(model.priceMin + (model.priceMax - model.priceMin) / 2);
    setShowModelDropdown(false);
  };

  const clearSelection = () => {
    setSelectedBrandId(null);
    setSelectedModelId(null);
  };

  const [households, setHouseholds] = useState<HouseholdForm[]>([
    { floor: 1, unit: '101', area: 85, ownerName: '张**', phone: '138****8001', familyPopulation: 3 },
    { floor: 1, unit: '102', area: 85, ownerName: '李**', phone: '138****8002', familyPopulation: 2 },
    { floor: 2, unit: '201', area: 85, ownerName: '王**', phone: '138****8003', familyPopulation: 4 },
    { floor: 2, unit: '202', area: 85, ownerName: '赵**', phone: '138****8004', familyPopulation: 3 },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);

  const calculatedHouseholds: Household[] = calculateShareRatio(
    households.map((h, idx) => ({
      ...h,
      id: `temp-${idx}`,
      projectId: 'temp',
      shareRatio: 0,
      shareAmount: 0,
      familyPopulation: h.familyPopulation,
    })),
    totalCost
  );

  const addHousehold = () => {
    const lastFloor = households.length > 0 ? households[households.length - 1].floor : 1;
    setHouseholds([
      ...households,
      { floor: lastFloor, unit: '', area: 80, ownerName: '', phone: '', familyPopulation: 3 },
    ]);
  };

  const updateHousehold = (index: number, field: keyof HouseholdForm, value: string | number) => {
    const updated = [...households];
    updated[index] = { ...updated[index], [field]: value };
    setHouseholds(updated);
  };

  const removeHousehold = (index: number) => {
    setHouseholds(households.filter((_, i) => i !== index));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    if (!importResult) return;

    const newHouseholds: HouseholdForm[] = importResult.validRows.map((row) => ({
      floor: row.floor,
      unit: row.unit,
      area: row.area,
      ownerName: row.ownerName,
      phone: row.phone,
      familyPopulation: row.familyPopulation || 3,
    }));

    setHouseholds((prev) => [...prev, ...newHouseholds]);
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

  const phoneErrors = useMemo(() => {
    return households.map((h) => {
      if (!h.phone.trim()) return true;
      return validatePhone(h.phone);
    });
  }, [households]);

  const canProceed = () => {
    if (currentStep === 'basic') {
      return name.trim() && address.trim() && totalFloors > 0 && totalCost > 0;
    }
    if (currentStep === 'households') {
      return households.every(
        (h, idx) => h.floor > 0 && h.unit && h.area > 0 && h.ownerName && phoneErrors[idx]
      );
    }
    return true;
  };

  const goNext = () => {
    if (currentStep === 'basic') setCurrentStep('households');
    else if (currentStep === 'households') setCurrentStep('preview');
  };

  const goPrev = () => {
    if (currentStep === 'preview') setCurrentStep('households');
    else if (currentStep === 'households') setCurrentStep('basic');
  };

  const handleSubmit = () => {
    const projectId = addProject({
      name,
      address,
      totalFloors,
      totalCost,
      households,
    });
    navigate(`/projects/${projectId}/households`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回项目列表
      </Link>

      <div className="card p-6 md:p-8">
        <h1 className="font-serif text-2xl font-bold text-slate-800 mb-6">
          发起加装电梯项目
        </h1>

        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.key;
            const isDone =
              (step.key === 'basic' && currentStep !== 'basic') ||
              (step.key === 'households' && currentStep === 'preview');
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                        : isDone
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      isActive ? 'text-primary-700' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 md:mx-4 ${
                      isDone ? 'bg-green-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {currentStep === 'basic' && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="label-field">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    项目名称
                  </span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="例如：阳光花园 3 栋 2 单元"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label-field">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    详细地址
                  </span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field"
                  placeholder="小区完整地址"
                />
              </div>
              <div>
                <label className="label-field">
                  <span className="flex items-center gap-1.5">
                    <Home className="w-4 h-4" />
                    总楼层数
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    预估总费用（万元）
                  </span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={totalCost}
                  onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <label className="label-field !mb-0">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    电梯品牌选型（可选）
                  </span>
                </label>
                {(selectedBrandId || selectedModelId) && (
                  <button
                    onClick={clearSelection}
                    className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    清除选择
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                    className="w-full input-field text-left flex items-center justify-between"
                  >
                    <span className={selectedBrand ? 'text-slate-800' : 'text-slate-400'}>
                      {selectedBrand ? selectedBrand.name : '选择电梯品牌'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        showBrandDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showBrandDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      {brands.map((brand) => (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => handleBrandSelect(brand.id)}
                          className={`w-full px-4 py-2.5 text-left hover:bg-primary-50 flex items-center justify-between transition-colors ${
                            selectedBrandId === brand.id
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{brand.name}</p>
                              <p className="text-xs text-slate-500">{brand.country} · {brand.models.length} 个型号</p>
                            </div>
                          </div>
                          {selectedBrandId === brand.id && (
                            <Check className="w-4 h-4 text-primary-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => selectedBrandId && setShowModelDropdown(!showModelDropdown)}
                    disabled={!selectedBrandId}
                    className={`w-full input-field text-left flex items-center justify-between ${
                      !selectedBrandId
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <span
                      className={selectedModel ? 'text-slate-800' : 'text-slate-400'}
                    >
                      {selectedModel
                        ? selectedModel.modelName
                        : selectedBrandId
                        ? '选择型号'
                        : '请先选择品牌'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        showModelDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showModelDropdown && selectedBrand && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
                      {selectedBrand.models.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleModelSelect(model)}
                          className={`w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors ${
                            selectedModelId === model.id
                              ? 'bg-primary-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-medium text-sm text-slate-800">
                              {model.modelName}
                            </p>
                            <p className="text-sm font-semibold text-amber-600">
                              {model.priceMin}-{model.priceMax}万
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              {model.ratedLoad}kg
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {model.ratedSpeed}m/s
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {model.minFloors}-{model.maxFloors}层
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedModel && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-100 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-primary-800 mb-2">
                        已选择 {selectedBrand?.name} {selectedModel.modelName}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-primary-600">额定载重</p>
                          <p className="font-medium text-primary-800">{selectedModel.ratedLoad}kg</p>
                        </div>
                        <div>
                          <p className="text-primary-600">额定速度</p>
                          <p className="font-medium text-primary-800">{selectedModel.ratedSpeed}m/s</p>
                        </div>
                        <div>
                          <p className="text-primary-600">适用楼层</p>
                          <p className="font-medium text-primary-800">{selectedModel.minFloors}-{selectedModel.maxFloors}层</p>
                        </div>
                        <div>
                          <p className="text-primary-600">参考价格</p>
                          <p className="font-medium text-amber-600">{selectedModel.priceMin}-{selectedModel.priceMax}万元</p>
                        </div>
                      </div>
                      {selectedModel.features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {selectedModel.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white/60 text-primary-700 text-xs rounded-full border border-primary-200"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {recommendedModels.length > 0 && !selectedModelId && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-primary-500" />
                    根据 {totalFloors} 层楼为您推荐以下型号：
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {recommendedModels.slice(0, 4).map(({ brand, model }) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedBrandId(brand.id);
                          handleModelSelect(model);
                        }}
                        className="p-3 text-left bg-white border border-slate-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                      >
                        <p className="font-medium text-sm text-slate-800">
                          {brand.name} {model.modelName}
                        </p>
                        <p className="text-xs text-amber-600 font-medium mt-0.5">
                          {model.priceMin}-{model.priceMax}万元
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-sm text-primary-700">
                费用将根据楼层自动计算各户分摊比例，一楼不分摊，二楼起按楼层系数递增
              </p>
            </div>
          </div>
        )}

        {currentStep === 'households' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-medium text-slate-700">
                住户列表（{households.length} 户）
              </h3>
              <div className="flex items-center gap-2">
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
                  onClick={addHousehold}
                  className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  添加住户
                </button>
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

            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-2">
              {households.map((h, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">楼层</label>
                    <input
                      type="number"
                      min={1}
                      value={h.floor}
                      onChange={(e) =>
                        updateHousehold(idx, 'floor', parseInt(e.target.value) || 0)
                      }
                      className="input-field !py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">室号</label>
                    <input
                      type="text"
                      value={h.unit}
                      onChange={(e) => updateHousehold(idx, 'unit', e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="如 201"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-slate-500 mb-1 block">面积(㎡)</label>
                    <input
                      type="number"
                      min={0}
                      value={h.area}
                      onChange={(e) =>
                        updateHousehold(idx, 'area', parseFloat(e.target.value) || 0)
                      }
                      className="input-field !py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-slate-500 mb-1 block">家庭人口</label>
                    <input
                      type="number"
                      min={1}
                      value={h.familyPopulation}
                      onChange={(e) =>
                        updateHousehold(idx, 'familyPopulation', parseInt(e.target.value) || 1)
                      }
                      className="input-field !py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-slate-500 mb-1 block">户主姓名</label>
                    <input
                      type="text"
                      value={h.ownerName}
                      onChange={(e) => updateHousehold(idx, 'ownerName', e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="姓名"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">电话</label>
                    <input
                      type="tel"
                      value={formatPhoneDisplay(h.phone)}
                      onChange={(e) => updateHousehold(idx, 'phone', e.target.value)}
                      className={`input-field !py-2 text-sm ${
                        !phoneErrors[idx] && h.phone.trim()
                          ? '!border-red-400 !ring-red-200 focus:!ring-red-400'
                          : ''
                      }`}
                      placeholder="手机号"
                    />
                    {!phoneErrors[idx] && h.phone.trim() && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        请输入有效的手机号码（11位）或座机号（7-12位）
                      </p>
                    )}
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-1">
                    <button
                      onClick={() => removeHousehold(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
                        ...households,
                        ...importResult.validRows.map((r) => ({
                          floor: r.floor,
                          unit: r.unit,
                          area: r.area,
                          ownerName: r.ownerName,
                          phone: r.phone,
                          familyPopulation: r.familyPopulation || 3,
                        })),
                      ];

                      const calculated = calculateShareRatio(
                        combinedHouseholds.map((h, idx) => ({
                          ...h,
                          id: `temp-${idx}`,
                          projectId: 'temp',
                          shareRatio: 0,
                          shareAmount: 0,
                        })),
                        totalCost
                      );

                      const newCalculated = calculated.slice(households.length);

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
                                  <th className="px-4 py-3 text-right font-medium text-slate-600">家庭人口</th>
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
                                    <td className="px-4 py-3 text-right text-slate-700">{row.familyPopulation || 3} 人</td>
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
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 bg-primary-50 rounded-xl border border-primary-100">
              <h3 className="font-semibold text-primary-800 mb-4">项目信息确认</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">项目名称：</span>
                  <span className="font-medium text-slate-800 ml-1">{name}</span>
                </div>
                <div>
                  <span className="text-slate-500">总楼层：</span>
                  <span className="font-medium text-slate-800 ml-1">{totalFloors} 层</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-500">地址：</span>
                  <span className="font-medium text-slate-800 ml-1">{address}</span>
                </div>
                <div>
                  <span className="text-slate-500">总费用：</span>
                  <span className="font-bold text-amber-600 ml-1">{totalCost} 万元</span>
                </div>
                <div>
                  <span className="text-slate-500">总户数：</span>
                  <span className="font-medium text-slate-800 ml-1">{households.length} 户</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-3">费用分摊方案</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">楼层</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">室号</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">户主</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">面积</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">分摊比例</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">分摊金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculatedHouseholds.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{h.floor} 层</td>
                        <td className="px-4 py-3 text-slate-700">{h.unit}</td>
                        <td className="px-4 py-3 text-slate-700">{maskName(h.ownerName)}</td>
                        <td className="px-4 py-3 text-slate-700">{h.area} ㎡</td>
                        <td className="px-4 py-3 text-right font-medium text-primary-700">
                          {h.shareRatio}%
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-600">
                          {formatCurrency(h.shareAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={goPrev}
            disabled={currentStep === 'basic'}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一步
          </button>
          {currentStep !== 'preview' ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary">
              创建项目
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
