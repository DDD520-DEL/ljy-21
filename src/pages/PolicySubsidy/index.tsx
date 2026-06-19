import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Clock,
  FileText,
  MapPin,
  Building,
  Award,
  BookOpen,
  ListChecks,
  Folder,
  Filter,
} from 'lucide-react';
import { useSubsidyStore } from '@/store/subsidyStore';
import {
  POLICY_LEVEL_LABEL,
  POLICY_LEVEL_COLOR,
} from '@/types';
import type {
  SubsidyPolicy,
  PolicyLevel,
  SubsidyMaterial,
} from '@/types';

const LEVEL_FILTERS: (PolicyLevel | 'all')[] = [
  'all',
  'national',
  'province',
  'city',
  'district',
];

const LEVEL_LABEL_MAP: Record<string, string> = {
  all: '全部',
  ...POLICY_LEVEL_LABEL,
};

interface PolicyForm {
  title: string;
  level: PolicyLevel;
  province: string;
  city: string;
  district: string;
  subsidyStandard: string;
  subsidyMin: string;
  subsidyMax: string;
  subsidyUnit: string;
  applicationConditions: string[];
  requiredMaterials: SubsidyMaterial[];
  sourceUrl: string;
  sourceName: string;
  effectiveDate: string;
  expiryDate: string;
  issuingDepartment: string;
  documentNumber: string;
  summary: string;
}

const emptyPolicyForm: PolicyForm = {
  title: '',
  level: 'city',
  province: '',
  city: '',
  district: '',
  subsidyStandard: '',
  subsidyMin: '',
  subsidyMax: '',
  subsidyUnit: '万元',
  applicationConditions: [],
  requiredMaterials: [],
  sourceUrl: '',
  sourceName: '',
  effectiveDate: '',
  expiryDate: '',
  issuingDepartment: '',
  documentNumber: '',
  summary: '',
};

export default function PolicySubsidy() {
  const {
    policies,
    initPolicies,
    addPolicy,
    updatePolicy,
    deletePolicy,
    searchPolicies,
    getProvinces,
    getCities,
    getDistricts,
  } = useSubsidyStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<PolicyLevel | 'all'>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('全部');
  const [cityFilter, setCityFilter] = useState<string>('全部');
  const [districtFilter, setDistrictFilter] = useState<string>('全部');

  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(
    new Set()
  );

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SubsidyPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState<PolicyForm>(emptyPolicyForm);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPolicy, setDetailPolicy] = useState<SubsidyPolicy | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [conditionInput, setConditionInput] = useState('');
  const [materialNameInput, setMaterialNameInput] = useState('');
  const [materialDescInput, setMaterialDescInput] = useState('');
  const [materialRequiredInput, setMaterialRequiredInput] = useState(true);

  useEffect(() => {
    initPolicies();
  }, [initPolicies]);

  useEffect(() => {
    setCityFilter('全部');
    setDistrictFilter('全部');
  }, [provinceFilter]);

  useEffect(() => {
    setDistrictFilter('全部');
  }, [cityFilter]);

  const provinces = useMemo(() => ['全部', ...getProvinces()], [getProvinces, policies]);
  const cities = useMemo(
    () => (provinceFilter && provinceFilter !== '全部' ? ['全部', ...getCities(provinceFilter)] : ['全部']),
    [getCities, provinceFilter, policies]
  );
  const districts = useMemo(
    () =>
      provinceFilter && provinceFilter !== '全部' && cityFilter && cityFilter !== '全部'
        ? ['全部', ...getDistricts(provinceFilter, cityFilter)]
        : ['全部'],
    [getDistricts, provinceFilter, cityFilter, policies]
  );

  const filteredPolicies = useMemo(
    () =>
      searchPolicies({
        level: levelFilter === 'all' ? undefined : levelFilter,
        province: provinceFilter,
        city: cityFilter,
        district: districtFilter,
        keyword: searchKeyword,
      }),
    [
      searchPolicies,
      levelFilter,
      provinceFilter,
      cityFilter,
      districtFilter,
      searchKeyword,
    ]
  );

  const togglePolicyExpand = (policyId: string) => {
    const newExpanded = new Set(expandedPolicies);
    if (newExpanded.has(policyId)) {
      newExpanded.delete(policyId);
    } else {
      newExpanded.add(policyId);
    }
    setExpandedPolicies(newExpanded);
  };

  const openAddPolicyModal = () => {
    setEditingPolicy(null);
    setPolicyForm({ ...emptyPolicyForm });
    setConditionInput('');
    setMaterialNameInput('');
    setMaterialDescInput('');
    setMaterialRequiredInput(true);
    setShowPolicyModal(true);
  };

  const openEditPolicyModal = (policy: SubsidyPolicy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      title: policy.title,
      level: policy.level,
      province: policy.province,
      city: policy.city,
      district: policy.district || '',
      subsidyStandard: policy.subsidyStandard,
      subsidyMin: policy.subsidyAmount ? String(policy.subsidyAmount.min) : '',
      subsidyMax: policy.subsidyAmount ? String(policy.subsidyAmount.max) : '',
      subsidyUnit: policy.subsidyAmount ? policy.subsidyAmount.unit : '万元',
      applicationConditions: [...policy.applicationConditions],
      requiredMaterials: policy.requiredMaterials.map((m) => ({ ...m })),
      sourceUrl: policy.sourceUrl,
      sourceName: policy.sourceName,
      effectiveDate: policy.effectiveDate,
      expiryDate: policy.expiryDate || '',
      issuingDepartment: policy.issuingDepartment,
      documentNumber: policy.documentNumber || '',
      summary: policy.summary,
    });
    setConditionInput('');
    setMaterialNameInput('');
    setMaterialDescInput('');
    setMaterialRequiredInput(true);
    setShowPolicyModal(true);
  };

  const openDetailModal = (policy: SubsidyPolicy) => {
    setDetailPolicy(policy);
    setShowDetailModal(true);
  };

  const handlePolicySubmit = () => {
    if (!policyForm.title.trim()) return;
    if (!policyForm.province.trim() || !policyForm.city.trim()) return;

    const data = {
      title: policyForm.title,
      level: policyForm.level,
      province: policyForm.province,
      city: policyForm.city,
      district: policyForm.district || undefined,
      subsidyStandard: policyForm.subsidyStandard,
      subsidyAmount:
        policyForm.subsidyMin || policyForm.subsidyMax
          ? {
              min: parseFloat(policyForm.subsidyMin) || 0,
              max: parseFloat(policyForm.subsidyMax) || 0,
              unit: policyForm.subsidyUnit,
            }
          : undefined,
      applicationConditions: policyForm.applicationConditions,
      requiredMaterials: policyForm.requiredMaterials,
      sourceUrl: policyForm.sourceUrl,
      sourceName: policyForm.sourceName,
      effectiveDate: policyForm.effectiveDate,
      expiryDate: policyForm.expiryDate || undefined,
      issuingDepartment: policyForm.issuingDepartment,
      documentNumber: policyForm.documentNumber || undefined,
      summary: policyForm.summary,
    };

    if (editingPolicy) {
      updatePolicy(editingPolicy.id, data);
    } else {
      addPolicy(data);
    }
    setShowPolicyModal(false);
  };

  const addCondition = () => {
    if (!conditionInput.trim()) return;
    setPolicyForm({
      ...policyForm,
      applicationConditions: [...policyForm.applicationConditions, conditionInput.trim()],
    });
    setConditionInput('');
  };

  const removeCondition = (index: number) => {
    setPolicyForm({
      ...policyForm,
      applicationConditions: policyForm.applicationConditions.filter((_, i) => i !== index),
    });
  };

  const addMaterial = () => {
    if (!materialNameInput.trim()) return;
    setPolicyForm({
      ...policyForm,
      requiredMaterials: [
        ...policyForm.requiredMaterials,
        {
          name: materialNameInput.trim(),
          description: materialDescInput.trim() || undefined,
          required: materialRequiredInput,
        },
      ],
    });
    setMaterialNameInput('');
    setMaterialDescInput('');
    setMaterialRequiredInput(true);
  };

  const removeMaterial = (index: number) => {
    setPolicyForm({
      ...policyForm,
      requiredMaterials: policyForm.requiredMaterials.filter((_, i) => i !== index),
    });
  };

  const handleDeleteClick = (policy: SubsidyPolicy) => {
    setDeleteTarget({ id: policy.id, name: policy.title });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deletePolicy(deleteTarget.id);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回项目列表
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">
            政策补贴知识库
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            收录各级政府对老旧小区加装电梯的财政补贴政策
          </p>
        </div>
        <button
          onClick={openAddPolicyModal}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加政策
        </button>
      </div>

      <div className="card p-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索政策标题、补贴标准、发布部门..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="input-field pl-12"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-500 whitespace-nowrap">政策层级：</span>
            <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 overflow-x-auto flex-1">
              {LEVEL_FILTERS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    levelFilter === l
                      ? 'bg-primary-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {LEVEL_LABEL_MAP[l]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">省份</label>
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="input-field"
            >
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">城市</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="input-field"
              disabled={cities.length <= 1}
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">区县</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="input-field"
              disabled={districts.length <= 1}
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPolicies.map((policy) => (
          <div key={policy.id} className="card overflow-hidden">
            <div
              className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => togglePolicyExpand(policy.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                    <Award className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${POLICY_LEVEL_COLOR[policy.level]}`}
                      >
                        {POLICY_LEVEL_LABEL[policy.level]}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {policy.province}
                        {policy.city && policy.city !== '全省' && policy.city !== '全国'
                          ? ` · ${policy.city}`
                          : ''}
                        {policy.district ? ` · ${policy.district}` : ''}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-2">
                      {policy.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {policy.summary}
                    </p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {policy.subsidyAmount && policy.subsidyAmount.max > 0 && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5" />
                          补贴：
                          {policy.subsidyAmount.min === policy.subsidyAmount.max
                            ? `${policy.subsidyAmount.max}${policy.subsidyAmount.unit}/台`
                            : `${policy.subsidyAmount.min}-${policy.subsidyAmount.max}${policy.subsidyAmount.unit}/台`}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {policy.issuingDepartment}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        生效：{policy.effectiveDate}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" />
                        {policy.applicationConditions.length} 项条件 · {policy.requiredMaterials.length} 项材料
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetailModal(policy);
                    }}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="查看详情"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditPolicyModal(policy);
                    }}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(policy);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedPolicies.has(policy.id) ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedPolicies.has(policy.id) && (
              <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-primary-600" />
                      补贴标准
                    </h4>
                    <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm text-slate-700 leading-relaxed">
                      {policy.subsidyStandard}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                      <ListChecks className="w-4 h-4 text-green-600" />
                      申请条件
                    </h4>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      {policy.applicationConditions.length > 0 ? (
                        <ul className="space-y-2">
                          {policy.applicationConditions.map((cond, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{cond}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">暂无申请条件信息</p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                      <Folder className="w-4 h-4 text-purple-600" />
                      所需材料清单
                    </h4>
                    {policy.requiredMaterials.length > 0 ? (
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-12 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 border-b border-slate-200">
                          <div className="col-span-1">序号</div>
                          <div className="col-span-1">必填</div>
                          <div className="col-span-4">材料名称</div>
                          <div className="col-span-6">说明</div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {policy.requiredMaterials.map((mat, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-12 px-4 py-3 text-sm items-center"
                            >
                              <div className="col-span-1 text-slate-400">{idx + 1}</div>
                              <div className="col-span-1">
                                {mat.required ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                    必须
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    可选
                                  </span>
                                )}
                              </div>
                              <div className="col-span-4 font-medium text-slate-700">
                                {mat.name}
                              </div>
                              <div className="col-span-6 text-slate-500 text-sm">
                                {mat.description || '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm text-slate-400">
                        暂无材料清单信息
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-4 bg-white rounded-lg border border-slate-200 p-4">
                      {policy.documentNumber && (
                        <div className="text-sm">
                          <span className="text-slate-500">文号：</span>
                          <span className="text-slate-700 font-medium">{policy.documentNumber}</span>
                        </div>
                      )}
                      {policy.expiryDate && (
                        <div className="text-sm">
                          <span className="text-slate-500">失效日期：</span>
                          <span className="text-slate-700">{policy.expiryDate}</span>
                        </div>
                      )}
                      {policy.sourceUrl && (
                        <a
                          href={policy.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 hover:underline ml-auto"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          查看原文（{policy.sourceName || '来源'}）
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredPolicies.length === 0 && (
          <div className="card p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">未找到匹配的政策文件</p>
            <p className="text-sm text-slate-400 mt-1">尝试调整筛选条件或搜索关键词</p>
          </div>
        )}
      </div>

      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingPolicy ? '编辑政策' : '添加政策'}
              </h3>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div>
                <label className="label-field">政策标题 *</label>
                <input
                  type="text"
                  value={policyForm.title}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, title: e.target.value })
                  }
                  className="input-field"
                  placeholder="例如：上海市既有多层住宅加装电梯资金补贴实施办法"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">政策层级 *</label>
                  <select
                    value={policyForm.level}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        level: e.target.value as PolicyLevel,
                      })
                    }
                    className="input-field"
                  >
                    <option value="national">国家级</option>
                    <option value="province">省级</option>
                    <option value="city">市级</option>
                    <option value="district">区县级</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">发布部门</label>
                  <input
                    type="text"
                    value={policyForm.issuingDepartment}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        issuingDepartment: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="例如：上海市住房和城乡建设管理委员会"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-field">省份 *</label>
                  <input
                    type="text"
                    value={policyForm.province}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, province: e.target.value })
                    }
                    className="input-field"
                    placeholder="例如：上海市"
                  />
                </div>
                <div>
                  <label className="label-field">城市 *</label>
                  <input
                    type="text"
                    value={policyForm.city}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, city: e.target.value })
                    }
                    className="input-field"
                    placeholder="例如：上海市 / 全省 / 全国"
                  />
                </div>
                <div>
                  <label className="label-field">区县</label>
                  <input
                    type="text"
                    value={policyForm.district}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, district: e.target.value })
                    }
                    className="input-field"
                    placeholder="选填"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">文号</label>
                  <input
                    type="text"
                    value={policyForm.documentNumber}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        documentNumber: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="例如：沪建房管联〔2019〕876号"
                  />
                </div>
                <div>
                  <label className="label-field">政策摘要</label>
                  <input
                    type="text"
                    value={policyForm.summary}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, summary: e.target.value })
                    }
                    className="input-field"
                    placeholder="简要概括政策内容"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="label-field">生效日期 *</label>
                  <input
                    type="date"
                    value={policyForm.effectiveDate}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        effectiveDate: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">失效日期</label>
                  <input
                    type="date"
                    value={policyForm.expiryDate}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        expiryDate: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">补贴下限</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={policyForm.subsidyMin}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        subsidyMin: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="例如：10"
                  />
                </div>
                <div>
                  <label className="label-field">补贴上限</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={policyForm.subsidyMax}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        subsidyMax: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="例如：28"
                  />
                </div>
              </div>

              <div>
                <label className="label-field">补贴标准说明 *</label>
                <textarea
                  value={policyForm.subsidyStandard}
                  onChange={(e) =>
                    setPolicyForm({
                      ...policyForm,
                      subsidyStandard: e.target.value,
                    })
                  }
                  className="input-field min-h-[80px] resize-y"
                  placeholder="详细说明补贴标准、计算方式等..."
                />
              </div>

              <div>
                <label className="label-field">原文链接</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={policyForm.sourceUrl}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, sourceUrl: e.target.value })
                    }
                    className="input-field"
                    placeholder="https://..."
                  />
                  <input
                    type="text"
                    value={policyForm.sourceName}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, sourceName: e.target.value })
                    }
                    className="input-field"
                    placeholder="来源名称（如：中国政府网）"
                  />
                </div>
              </div>

              <div>
                <label className="label-field">申请条件</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCondition();
                      }
                    }}
                    className="input-field flex-1"
                    placeholder="输入申请条件后按回车添加"
                  />
                  <button
                    onClick={addCondition}
                    type="button"
                    className="btn-secondary !px-4"
                  >
                    添加
                  </button>
                </div>
                {policyForm.applicationConditions.length > 0 && (
                  <div className="space-y-2">
                    {policyForm.applicationConditions.map((cond, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2"
                      >
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 flex-1">{cond}</span>
                        <button
                          onClick={() => removeCondition(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label-field">所需材料清单</label>
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={materialNameInput}
                      onChange={(e) => setMaterialNameInput(e.target.value)}
                      className="input-field"
                      placeholder="材料名称"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={materialDescInput}
                      onChange={(e) => setMaterialDescInput(e.target.value)}
                      className="input-field"
                      placeholder="材料说明（选填）"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <label className="flex items-center gap-1 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={materialRequiredInput}
                        onChange={(e) =>
                          setMaterialRequiredInput(e.target.checked)
                        }
                        className="rounded border-slate-300"
                      />
                      必填
                    </label>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={addMaterial}
                      type="button"
                      className="btn-secondary w-full"
                    >
                      添加
                    </button>
                  </div>
                </div>
                {policyForm.requiredMaterials.length > 0 && (
                  <div className="space-y-2">
                    {policyForm.requiredMaterials.map((mat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2"
                      >
                        {mat.required ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 flex-shrink-0">
                            必须
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex-shrink-0">
                            可选
                          </span>
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          {mat.name}
                        </span>
                        {mat.description && (
                          <span className="text-sm text-slate-500 flex-1">
                            ({mat.description})
                          </span>
                        )}
                        <button
                          onClick={() => removeMaterial(idx)}
                          className="text-slate-400 hover:text-red-500 ml-auto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handlePolicySubmit}
                className="btn-primary inline-flex items-center gap-1.5"
                disabled={!policyForm.title.trim() || !policyForm.province.trim() || !policyForm.city.trim()}
              >
                <Check className="w-4 h-4" />
                {editingPolicy ? '保存修改' : '添加政策'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${POLICY_LEVEL_COLOR[detailPolicy.level]}`}
                  >
                    {POLICY_LEVEL_LABEL[detailPolicy.level]}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {detailPolicy.province}
                    {detailPolicy.city &&
                    detailPolicy.city !== '全省' &&
                    detailPolicy.city !== '全国'
                      ? ` · ${detailPolicy.city}`
                      : ''}
                    {detailPolicy.district ? ` · ${detailPolicy.district}` : ''}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {detailPolicy.title}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-slate-500">发布部门：</span>
                  <span className="text-slate-700">{detailPolicy.issuingDepartment}</span>
                </div>
                {detailPolicy.documentNumber && (
                  <div>
                    <span className="text-slate-500">文号：</span>
                    <span className="text-slate-700">{detailPolicy.documentNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">生效日期：</span>
                  <span className="text-slate-700">{detailPolicy.effectiveDate}</span>
                </div>
                {detailPolicy.expiryDate && (
                  <div>
                    <span className="text-slate-500">失效日期：</span>
                    <span className="text-slate-700">{detailPolicy.expiryDate}</span>
                  </div>
                )}
              </div>

              {detailPolicy.subsidyAmount && detailPolicy.subsidyAmount.max > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800 font-medium">
                    <Award className="w-5 h-5" />
                    补贴金额参考
                  </div>
                  <div className="mt-2 text-2xl font-bold text-amber-700">
                    {detailPolicy.subsidyAmount.min === detailPolicy.subsidyAmount.max
                      ? `${detailPolicy.subsidyAmount.max} ${detailPolicy.subsidyAmount.unit}/台`
                      : `${detailPolicy.subsidyAmount.min} - ${detailPolicy.subsidyAmount.max} ${detailPolicy.subsidyAmount.unit}/台`}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  政策摘要
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">
                  {detailPolicy.summary}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary-600" />
                  补贴标准
                </h4>
                <div className="text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4 whitespace-pre-wrap">
                  {detailPolicy.subsidyStandard}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                  <ListChecks className="w-4 h-4 text-green-600" />
                  申请条件
                </h4>
                {detailPolicy.applicationConditions.length > 0 ? (
                  <ul className="space-y-2 bg-slate-50 rounded-lg p-4">
                    {detailPolicy.applicationConditions.map((cond, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{cond}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">暂无申请条件信息</p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                  <Folder className="w-4 h-4 text-purple-600" />
                  所需材料清单
                </h4>
                {detailPolicy.requiredMaterials.length > 0 ? (
                  <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600">
                          <th className="text-left px-4 py-2 font-medium w-12">序号</th>
                          <th className="text-left px-4 py-2 font-medium w-20">要求</th>
                          <th className="text-left px-4 py-2 font-medium">材料名称</th>
                          <th className="text-left px-4 py-2 font-medium">说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailPolicy.requiredMaterials.map((mat, idx) => (
                          <tr key={idx} className="border-t border-slate-200">
                            <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              {mat.required ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                  必须
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                  可选
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {mat.name}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {mat.description || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400">暂无材料清单信息</p>
                )}
              </div>

              {detailPolicy.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={detailPolicy.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    查看政策原文（{detailPolicy.sourceName || '来源'}）
                  </a>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">确认删除</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    确定要删除政策「{deleteTarget.name}」吗？此操作不可撤销。
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={confirmDelete} className="btn-danger">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
