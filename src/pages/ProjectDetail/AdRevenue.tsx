import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText,
  PiggyBank,
  Building2,
  X,
  CheckCircle2,
  Info,
  Search,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { formatCurrency } from '@/utils/feeCalculator';
import { AD_POSITION_OPTIONS } from '@/types';
import type { AdContract, HouseholdAdShare, YearlyAdRevenueSummary } from '@/types';

type TabKey = 'contracts' | 'summary' | 'households';

interface AdContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  contract?: AdContract | null;
  onSave: (data: {
    customerName: string;
    contractAmount: number;
    startDate: string;
    endDate: string;
    adPosition: string;
    contactPerson?: string;
    contactPhone?: string;
    remarks?: string;
  }) => void;
}

function AdContractModal({ isOpen, onClose, projectId, contract, onSave }: AdContractModalProps) {
  const [customerName, setCustomerName] = useState(contract?.customerName || '');
  const [contractAmount, setContractAmount] = useState<string>(contract ? String(contract.contractAmount) : '');
  const [startDate, setStartDate] = useState(contract?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(contract?.endDate || '');
  const [adPosition, setAdPosition] = useState(contract?.adPosition || 'elevator_inner_wall');
  const [contactPerson, setContactPerson] = useState(contract?.contactPerson || '');
  const [contactPhone, setContactPhone] = useState(contract?.contactPhone || '');
  const [remarks, setRemarks] = useState(contract?.remarks || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setCustomerName(contract?.customerName || '');
      setContractAmount(contract ? String(contract.contractAmount) : '');
      setStartDate(contract?.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(contract?.endDate || '');
      setAdPosition(contract?.adPosition || 'elevator_inner_wall');
      setContactPerson(contract?.contactPerson || '');
      setContactPhone(contract?.contactPhone || '');
      setRemarks(contract?.remarks || '');
      setErrors({});
    }
  }, [isOpen, contract]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) newErrors.customerName = '请输入广告客户名称';
    const amount = parseFloat(contractAmount);
    if (!contractAmount || isNaN(amount) || amount <= 0) newErrors.contractAmount = '请输入有效的合同金额';
    if (!startDate) newErrors.startDate = '请选择合同开始日期';
    if (!endDate) newErrors.endDate = '请选择合同结束日期';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = '结束日期不能早于开始日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      customerName: customerName.trim(),
      contractAmount: parseFloat(contractAmount),
      startDate,
      endDate,
      adPosition,
      contactPerson: contactPerson.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {contract ? '编辑广告合同' : '新增广告合同'}
              </h3>
              <p className="text-sm text-slate-500">项目 ID: {projectId.slice(0, 12)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                广告客户名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="例如：某某广告公司、某某品牌"
                className={`input-field ${errors.customerName ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              {errors.customerName && (
                <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                合同金额（元） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                placeholder="请输入合同总金额"
                min="0"
                step="0.01"
                className={`input-field ${errors.contractAmount ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              {errors.contractAmount && (
                <p className="mt-1 text-xs text-red-600">{errors.contractAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                广告位置
              </label>
              <select
                value={adPosition}
                onChange={(e) => setAdPosition(e.target.value)}
                className="input-field"
              >
                {AD_POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                开始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`input-field ${errors.startDate ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                结束日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`input-field ${errors.endDate ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                联系人
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="客户方联系人（可选）"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                联系电话
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="客户方联系电话（可选）"
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                备注说明
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="合同条款说明、特殊约定等（可选）"
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {contract ? '保存修改' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdRevenue() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const getProjectAdContracts = useProjectStore((s) => s.getProjectAdContracts);
  const addAdContract = useProjectStore((s) => s.addAdContract);
  const updateAdContract = useProjectStore((s) => s.updateAdContract);
  const deleteAdContract = useProjectStore((s) => s.deleteAdContract);
  const getContractYearlyAllocation = useProjectStore((s) => s.getContractYearlyAllocation);
  const getAvailableAdYears = useProjectStore((s) => s.getAvailableAdYears);
  const getYearlyAdRevenueSummary = useProjectStore((s) => s.getYearlyAdRevenueSummary);

  const [activeTab, setActiveTab] = useState<TabKey>('contracts');
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<AdContract | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [expandedHouseholds, setExpandedHouseholds] = useState<Set<string>>(new Set());
  const [householdSearch, setHouseholdSearch] = useState('');

  const contracts = useMemo(() => (id ? getProjectAdContracts(id) : []), [id, getProjectAdContracts]);
  const availableYears = useMemo(() => (id ? getAvailableAdYears(id) : []), [id, getAvailableAdYears]);
  const yearlySummary = useMemo<YearlyAdRevenueSummary | null>(
    () => (id ? getYearlyAdRevenueSummary(id, selectedYear) : null),
    [id, selectedYear, getYearlyAdRevenueSummary]
  );

  if (!project) return null;

  const totalContracts = contracts.length;
  const allTimeTotalRevenue = contracts.reduce((sum, c) => sum + c.contractAmount, 0);

  const adPositionLabel = (value: string) => {
    return AD_POSITION_OPTIONS.find((o) => o.value === value)?.label || value;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getContractStatus = (contract: AdContract) => {
    const now = new Date();
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    if (now < start) return { label: '未开始', color: 'bg-slate-100 text-slate-600' };
    if (now > end) return { label: '已到期', color: 'bg-red-100 text-red-600' };
    return { label: '执行中', color: 'bg-green-100 text-green-600' };
  };

  const handleSaveContract = (data: {
    customerName: string;
    contractAmount: number;
    startDate: string;
    endDate: string;
    adPosition: string;
    contactPerson?: string;
    contactPhone?: string;
    remarks?: string;
  }) => {
    if (!id) return;
    if (editingContract) {
      updateAdContract(id, editingContract.id, data);
    } else {
      addAdContract(id, data);
    }
    setShowModal(false);
    setEditingContract(null);
  };

  const handleDeleteContract = (contractId: string) => {
    if (!id) return;
    if (confirm('确定要删除这条广告合同吗？删除后将无法恢复。')) {
      deleteAdContract(id, contractId);
    }
  };

  const toggleHouseholdExpand = (householdId: string) => {
    const newExpanded = new Set(expandedHouseholds);
    if (newExpanded.has(householdId)) {
      newExpanded.delete(householdId);
    } else {
      newExpanded.add(householdId);
    }
    setExpandedHouseholds(newExpanded);
  };

  const filteredHouseholdShares = useMemo(() => {
    if (!yearlySummary) return [];
    if (!householdSearch.trim()) return yearlySummary.householdShares;
    const search = householdSearch.trim().toLowerCase();
    return yearlySummary.householdShares.filter(
      (h) =>
        h.householdName.toLowerCase().includes(search) ||
        `${h.floor}层${h.unit}`.toLowerCase().includes(search) ||
        h.unit.toLowerCase().includes(search)
    );
  }, [yearlySummary, householdSearch]);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'contracts', label: '合同管理', icon: FileText },
    { key: 'summary', label: '年度汇总', icon: PiggyBank },
    { key: 'households', label: '分成明细', icon: Building2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
            <span className="text-sm opacity-80">合同总数</span>
          </div>
          <p className="text-3xl font-bold mb-1">{totalContracts}</p>
          <p className="text-sm opacity-70">累计登记广告合同</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-violet-600" />
            </div>
            <span className="text-sm text-slate-500">合同总金额</span>
          </div>
          <p className="text-3xl font-bold text-violet-600 mb-1">
            {formatCurrency(allTimeTotalRevenue)}
          </p>
          <p className="text-sm text-slate-400">所有合同累计金额</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-slate-500">{selectedYear}年收益</span>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {formatCurrency(yearlySummary?.totalRevenue || 0)}
          </p>
          <p className="text-sm text-slate-400">
            {yearlySummary?.contractCount || 0} 份合同贡献
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">参与户数</span>
          </div>
          <p className="text-3xl font-bold text-amber-600 mb-1">
            {project.households.length}
          </p>
          <p className="text-sm text-slate-400">按比例参与收益分成</p>
        </div>
      </div>

      <div className="card p-1">
        <div className="flex border-b border-slate-200 p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-800">广告租赁合同列表</h2>
              <p className="text-sm text-slate-500 mt-1">
                共 {totalContracts} 条合同记录，支持新增、编辑和删除
              </p>
            </div>
            <button
              onClick={() => {
                setEditingContract(null);
                setShowModal(true);
              }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新增合同
            </button>
          </div>

          {contracts.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无广告合同记录</h3>
              <p className="text-slate-500 mb-4">
                点击上方「新增合同」按钮，开始登记电梯轿厢广告位的租赁信息
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">功能说明</p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• 记录广告客户名称、合同金额、起止日期</li>
                      <li>• 系统自动按年度汇总广告收益</li>
                      <li>• 按照每户分摊比例自动计算分成金额</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingContract(null);
                  setShowModal(true);
                }}
                className="btn-primary inline-flex items-center gap-2 mt-6"
              >
                <Plus className="w-4 h-4" />
                添加第一份合同
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto card p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">广告客户</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">合同金额</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">广告位置</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">合同期限</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600">状态</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">联系信息</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map((contract) => {
                    const status = getContractStatus(contract);
                    return (
                      <tr key={contract.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-800">{contract.customerName}</div>
                          {contract.remarks && (
                            <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                              {contract.remarks}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-primary-700">
                            {formatCurrency(contract.contractAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {adPositionLabel(contract.adPosition)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-slate-700">{formatDate(contract.startDate)}</div>
                          <div className="text-slate-400 text-xs">至 {formatDate(contract.endDate)}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {contract.contactPerson || contract.contactPhone ? (
                            <div className="space-y-0.5">
                              {contract.contactPerson && (
                                <div className="text-slate-700 flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  {contract.contactPerson}
                                </div>
                              )}
                              {contract.contactPhone && (
                                <div className="text-slate-500 text-xs flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {contract.contactPhone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">未填写</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingContract(contract);
                                setShowModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteContract(contract.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-800">年度收益汇总</h2>
              <p className="text-sm text-slate-500 mt-1">
                按合同起止日期自动分摊到各年度，查看每年的广告收益构成
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">选择年份：</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input-field !w-auto !py-2"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
          </div>

          {!yearlySummary || yearlySummary.contractCount === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {selectedYear} 年暂无广告收益
              </h3>
              <p className="text-slate-500">
                请先在「合同管理」中添加起止日期覆盖 {selectedYear} 年的广告合同
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                    <PiggyBank className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-slate-800">
                      {selectedYear} 年度广告总收益
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      来自 {yearlySummary.contractCount} 份广告合同的年度分摊
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-4xl font-bold text-green-600">
                      {formatCurrency(yearlySummary.totalRevenue)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    年度收益构成明细
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">广告客户</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">广告位置</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">合同期限</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-600">合同总金额</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-600">
                            {selectedYear}年分摊
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-slate-600">占比</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {yearlySummary.contracts.map((contract) => {
                          const yearlyAllocation = getContractYearlyAllocation(contract, selectedYear);
                          const percentage = yearlySummary.totalRevenue > 0
                            ? ((yearlyAllocation / yearlySummary.totalRevenue) * 100).toFixed(1)
                            : '0';
                          return (
                            <tr key={contract.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {contract.customerName}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {adPositionLabel(contract.adPosition)}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {formatCurrency(contract.contractAmount)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-green-600">
                                +{formatCurrency(yearlyAllocation)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full"
                                      style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-semibold">
                          <td className="px-4 py-3 text-slate-700" colSpan={4}>
                            合计 {yearlySummary.contractCount} 份合同
                          </td>
                          <td className="px-4 py-3 text-right text-green-700">
                            +{formatCurrency(yearlySummary.totalRevenue)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-slate-700">收益分摊规则说明</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="font-medium text-blue-800 mb-2">年度分摊算法</p>
                    <p className="text-blue-700">
                      系统根据合同起止日期与自然年的重叠天数，按比例将合同金额分摊到各年度。
                      例如：2024年10月1日至2025年9月30日的12000元合同，将按实际天数分摊到2024年和2025年。
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="font-medium text-green-800 mb-2">住户分成算法</p>
                    <p className="text-green-700">
                      年度总收益按各住户的分摊比例（与电梯加装费用分摊比例一致）进行分配。
                      每户分成金额 = 年度总收益 × (该户分摊比例 / 所有住户分摊比例之和)。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'households' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-800">住户收益分成明细</h2>
              <p className="text-sm text-slate-500 mt-1">
                按户查看 {selectedYear} 年度广告收益分成，点击住户行查看合同明细
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={householdSearch}
                  onChange={(e) => setHouseholdSearch(e.target.value)}
                  placeholder="搜索户主姓名/楼层/室号"
                  className="input-field !pl-9 !py-2 !w-60"
                />
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input-field !w-auto !py-2"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
          </div>

          {!yearlySummary || yearlySummary.totalRevenue === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {selectedYear} 年暂无可分成的收益
              </h3>
              <p className="text-slate-500">
                请先添加覆盖 {selectedYear} 年的广告合同后再查看分成明细
              </p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <PiggyBank className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-700">{selectedYear} 年度可分配总收益</p>
                      <p className="text-2xl font-bold text-amber-800">
                        {formatCurrency(yearlySummary.totalRevenue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-amber-700">参与分成户数</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {filteredHouseholdShares.length} 户
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">楼层室号</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">户主姓名</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">房屋面积</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">分摊比例</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">
                        {selectedYear}年分成金额
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHouseholdShares.map((share) => (
                      <>
                        <tr
                          key={share.householdId}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => toggleHouseholdExpand(share.householdId)}
                        >
                          <td className="px-4 py-3">
                            {expandedHouseholds.has(share.householdId) ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                              {share.floor}层 {share.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {share.householdName}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {share.area.toFixed(1)} m²
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {share.shareRatio.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-green-600 text-base">
                              +{formatCurrency(share.shareAmount)}
                            </span>
                          </td>
                        </tr>
                        {expandedHouseholds.has(share.householdId) && (
                          <tr key={`${share.householdId}-detail`} className="bg-slate-50/60">
                            <td colSpan={6} className="px-8 py-4">
                              <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                                  <FileText className="w-4 h-4 text-primary-600" />
                                  <h5 className="font-semibold text-slate-700">
                                    {share.floor}层{share.unit} · {share.householdName} 的{selectedYear}年分成构成
                                  </h5>
                                </div>
                                {share.contractBreakdown.length === 0 ? (
                                  <p className="text-slate-400 text-sm py-2">该户本年度暂无收益分成记录</p>
                                ) : (
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-xs text-slate-500">
                                        <th className="px-3 py-2 text-left font-medium">广告客户</th>
                                        <th className="px-3 py-2 text-right font-medium">合同总金额</th>
                                        <th className="px-3 py-2 text-right font-medium">{selectedYear}年分摊</th>
                                        <th className="px-3 py-2 text-right font-medium">该户分成</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {share.contractBreakdown.map((bd) => (
                                        <tr key={bd.contractId}>
                                          <td className="px-3 py-2.5 text-slate-700">{bd.customerName}</td>
                                          <td className="px-3 py-2.5 text-right text-slate-500">
                                            {formatCurrency(bd.contractAmount)}
                                          </td>
                                          <td className="px-3 py-2.5 text-right text-slate-600">
                                            {formatCurrency(bd.yearlyAllocation)}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-medium text-green-600">
                                            +{formatCurrency(bd.shareAmount)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="bg-slate-50 font-semibold rounded-lg overflow-hidden">
                                        <td className="px-3 py-3 text-slate-700 rounded-bl-lg">合计</td>
                                        <td className="px-3 py-3 text-right text-slate-500">
                                          {formatCurrency(
                                            share.contractBreakdown.reduce((s, b) => s + b.contractAmount, 0)
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-right text-slate-600">
                                          {formatCurrency(
                                            share.contractBreakdown.reduce((s, b) => s + b.yearlyAllocation, 0)
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-right text-green-700 rounded-br-lg">
                                          +{formatCurrency(share.shareAmount)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                      <td className="px-4 py-4" colSpan={3}>
                        共 {filteredHouseholdShares.length} 户合计分成
                      </td>
                      <td className="px-4 py-4 text-right text-slate-500">
                        {filteredHouseholdShares.reduce((s, h) => s + h.area, 0).toFixed(1)} m²
                      </td>
                      <td className="px-4 py-4 text-right text-slate-500">
                        {filteredHouseholdShares.reduce((s, h) => s + h.shareRatio, 0).toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-lg font-bold text-green-700">
                          +{formatCurrency(
                            filteredHouseholdShares.reduce((s, h) => s + h.shareAmount, 0)
                          )}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <AdContractModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingContract(null);
        }}
        projectId={id || ''}
        contract={editingContract}
        onSave={handleSaveContract}
      />
    </div>
  );
}
