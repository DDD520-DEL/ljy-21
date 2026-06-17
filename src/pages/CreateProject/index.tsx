import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Building2, Users, Calculator, CheckCircle2, MapPin, Home, DollarSign, FileText, AlertCircle
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { calculateShareRatio, formatCurrency } from '@/utils/feeCalculator';
import type { Household } from '@/types';
import { maskName } from '@/utils/maskData';

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
}

export default function CreateProject() {
  const navigate = useNavigate();
  const addProject = useProjectStore((s) => s.addProject);

  const [currentStep, setCurrentStep] = useState<StepType>('basic');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalFloors, setTotalFloors] = useState(6);
  const [totalCost, setTotalCost] = useState(45);

  const [households, setHouseholds] = useState<HouseholdForm[]>([
    { floor: 1, unit: '101', area: 85, ownerName: '张**', phone: '138****8001' },
    { floor: 1, unit: '102', area: 85, ownerName: '李**', phone: '138****8002' },
    { floor: 2, unit: '201', area: 85, ownerName: '王**', phone: '138****8003' },
    { floor: 2, unit: '202', area: 85, ownerName: '赵**', phone: '138****8004' },
  ]);

  const calculatedHouseholds: Household[] = calculateShareRatio(
    households.map((h, idx) => ({
      ...h,
      id: `temp-${idx}`,
      projectId: 'temp',
      shareRatio: 0,
      shareAmount: 0,
    })),
    totalCost
  );

  const addHousehold = () => {
    const lastFloor = households.length > 0 ? households[households.length - 1].floor : 1;
    setHouseholds([
      ...households,
      { floor: lastFloor, unit: '', area: 80, ownerName: '', phone: '' },
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
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-sm text-primary-700">
                费用将根据楼层自动计算各户分摊比例，一楼不分摊，二楼起按楼层系数递增
              </p>
            </div>
          </div>
        )}

        {currentStep === 'households' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-700">
                住户列表（{households.length} 户）
              </h3>
              <button
                onClick={addHousehold}
                className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                添加住户
              </button>
            </div>

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
                  <div className="col-span-2">
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
