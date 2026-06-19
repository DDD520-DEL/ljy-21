import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Gauge,
  Layers,
  DollarSign,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Globe,
  Clock,
  Zap,
  Tag,
} from 'lucide-react';
import { useElevatorStore } from '@/store/elevatorStore';
import {
  ELEVATOR_RATED_LOAD_OPTIONS,
  ELEVATOR_RATED_SPEED_OPTIONS,
} from '@/types';
import type { ElevatorBrand, ElevatorModel } from '@/types';

interface BrandForm {
  name: string;
  country: string;
  description: string;
}

interface ModelForm {
  modelName: string;
  ratedLoad: number;
  ratedSpeed: number;
  minFloors: number;
  maxFloors: number;
  priceMin: number;
  priceMax: number;
  features: string[];
  remarks: string;
}

const emptyBrandForm: BrandForm = {
  name: '',
  country: '',
  description: '',
};

const emptyModelForm: ModelForm = {
  modelName: '',
  ratedLoad: 800,
  ratedSpeed: 1.5,
  minFloors: 2,
  maxFloors: 10,
  priceMin: 20,
  priceMax: 40,
  features: [],
  remarks: '',
};

export default function ElevatorBrands() {
  const { brands, addBrand, updateBrand, deleteBrand, addModel, updateModel, deleteModel } =
    useElevatorStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ElevatorBrand | null>(null);
  const [brandForm, setBrandForm] = useState<BrandForm>(emptyBrandForm);

  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ElevatorModel | null>(null);
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState<ModelForm>(emptyModelForm);
  const [featureInput, setFeatureInput] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'brand'; id: string; name: string }
    | { type: 'model'; id: string; name: string; brandId: string }
    | null
  >(null);

  const toggleBrandExpand = (brandId: string) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedBrands(newExpanded);
  };

  const filteredBrands = brands.filter((brand) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    const brandMatch =
      brand.name.toLowerCase().includes(keyword) ||
      brand.country.toLowerCase().includes(keyword) ||
      brand.description.toLowerCase().includes(keyword);
    const modelMatch = brand.models.some(
      (m) =>
        m.modelName.toLowerCase().includes(keyword) ||
        m.features.some((f) => f.toLowerCase().includes(keyword))
    );
    return brandMatch || modelMatch;
  });

  const openAddBrandModal = () => {
    setEditingBrand(null);
    setBrandForm(emptyBrandForm);
    setShowBrandModal(true);
  };

  const openEditBrandModal = (brand: ElevatorBrand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      country: brand.country,
      description: brand.description,
    });
    setShowBrandModal(true);
  };

  const handleBrandSubmit = () => {
    if (!brandForm.name.trim()) return;

    if (editingBrand) {
      updateBrand(editingBrand.id, brandForm);
    } else {
      addBrand(brandForm);
    }
    setShowBrandModal(false);
  };

  const openAddModelModal = (brandId: string) => {
    setEditingModel(null);
    setCurrentBrandId(brandId);
    setModelForm({ ...emptyModelForm });
    setFeatureInput('');
    setShowModelModal(true);
  };

  const openEditModelModal = (model: ElevatorModel, brandId: string) => {
    setEditingModel(model);
    setCurrentBrandId(brandId);
    setModelForm({
      modelName: model.modelName,
      ratedLoad: model.ratedLoad,
      ratedSpeed: model.ratedSpeed,
      minFloors: model.minFloors,
      maxFloors: model.maxFloors,
      priceMin: model.priceMin,
      priceMax: model.priceMax,
      features: [...model.features],
      remarks: model.remarks || '',
    });
    setFeatureInput('');
    setShowModelModal(true);
  };

  const handleModelSubmit = () => {
    if (!modelForm.modelName.trim() || !currentBrandId) return;

    if (editingModel) {
      updateModel(editingModel.id, modelForm);
    } else {
      addModel(currentBrandId, modelForm);
    }
    setShowModelModal(false);
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setModelForm({
      ...modelForm,
      features: [...modelForm.features, featureInput.trim()],
    });
    setFeatureInput('');
  };

  const removeFeature = (index: number) => {
    setModelForm({
      ...modelForm,
      features: modelForm.features.filter((_, i) => i !== index),
    });
  };

  const handleDeleteClick = (
    target:
      | { type: 'brand'; id: string; name: string }
      | { type: 'model'; id: string; name: string; brandId: string }
  ) => {
    setDeleteTarget(target);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'brand') {
      deleteBrand(deleteTarget.id);
    } else {
      deleteModel(deleteTarget.id);
    }

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
            电梯品牌与型号参考库
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            维护市场常见电梯品牌型号，为项目选型提供参考
          </p>
        </div>
        <button
          onClick={openAddBrandModal}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加品牌
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索品牌名称、型号、特性..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredBrands.map((brand) => (
          <div key={brand.id} className="card overflow-hidden">
            <div
              className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleBrandExpand(brand.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-7 h-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      {brand.name}
                      <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {brand.country}
                      </span>
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                      {brand.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {brand.models.length} 个型号
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditBrandModal(brand);
                    }}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick({
                        type: 'brand',
                        id: brand.id,
                        name: brand.name,
                      });
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedBrands.has(brand.id) ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedBrands.has(brand.id) && (
              <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-700 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    型号列表
                  </h4>
                  <button
                    onClick={() => openAddModelModal(brand.id)}
                    className="btn-secondary !py-1.5 !px-3 text-sm inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    添加型号
                  </button>
                </div>

                {brand.models.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无型号数据，点击上方按钮添加</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {brand.models.map((model) => (
                      <div
                        key={model.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:border-primary-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h5 className="font-semibold text-slate-800">
                            {model.modelName}
                          </h5>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModelModal(model, brand.id)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClick({
                                  type: 'model',
                                  id: model.id,
                                  name: model.modelName,
                                  brandId: brand.id,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Gauge className="w-3.5 h-3.5 text-primary-500" />
                            <span>载重：{model.ratedLoad}kg</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>速度：{model.ratedSpeed}m/s</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Layers className="w-3.5 h-3.5 text-green-500" />
                            <span>
                              楼层：{model.minFloors}-{model.maxFloors}层
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              {model.priceMin}-{model.priceMax}万元
                            </span>
                          </div>
                        </div>

                        {model.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {model.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}

                        {model.remarks && (
                          <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                            备注：{model.remarks}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredBrands.length === 0 && (
          <div className="card p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">未找到匹配的品牌或型号</p>
          </div>
        )}
      </div>

      {showBrandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingBrand ? '编辑品牌' : '添加品牌'}
              </h3>
              <button
                onClick={() => setShowBrandModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div>
                <label className="label-field">品牌名称</label>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(e) =>
                    setBrandForm({ ...brandForm, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="例如：奥的斯"
                />
              </div>
              <div>
                <label className="label-field">所属国家/地区</label>
                <input
                  type="text"
                  value={brandForm.country}
                  onChange={(e) =>
                    setBrandForm({ ...brandForm, country: e.target.value })
                  }
                  className="input-field"
                  placeholder="例如：美国"
                />
              </div>
              <div>
                <label className="label-field">品牌简介</label>
                <textarea
                  value={brandForm.description}
                  onChange={(e) =>
                    setBrandForm({ ...brandForm, description: e.target.value })
                  }
                  className="input-field min-h-[100px] resize-y"
                  placeholder="品牌简要介绍..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBrandModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleBrandSubmit}
                className="btn-primary inline-flex items-center gap-1.5"
                disabled={!brandForm.name.trim()}
              >
                <Check className="w-4 h-4" />
                {editingBrand ? '保存修改' : '添加品牌'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingModel ? '编辑型号' : '添加型号'}
              </h3>
              <button
                onClick={() => setShowModelModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div>
                <label className="label-field">型号名称</label>
                <input
                  type="text"
                  value={modelForm.modelName}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, modelName: e.target.value })
                  }
                  className="input-field"
                  placeholder="例如：Gen2 无机房电梯"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">额定载重</label>
                  <select
                    value={modelForm.ratedLoad}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        ratedLoad: parseInt(e.target.value),
                      })
                    }
                    className="input-field"
                  >
                    {ELEVATOR_RATED_LOAD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">额定速度</label>
                  <select
                    value={modelForm.ratedSpeed}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        ratedSpeed: parseFloat(e.target.value),
                      })
                    }
                    className="input-field"
                  >
                    {ELEVATOR_RATED_SPEED_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">最低楼层</label>
                  <input
                    type="number"
                    min={1}
                    value={modelForm.minFloors}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        minFloors: parseInt(e.target.value) || 1,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">最高楼层</label>
                  <input
                    type="number"
                    min={1}
                    value={modelForm.maxFloors}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        maxFloors: parseInt(e.target.value) || 1,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">参考价格下限（万元）</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={modelForm.priceMin}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        priceMin: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">参考价格上限（万元）</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={modelForm.priceMax}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        priceMax: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label-field">产品特性</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    className="input-field flex-1"
                    placeholder="输入特性后按回车添加"
                  />
                  <button
                    onClick={addFeature}
                    type="button"
                    className="btn-secondary !px-4"
                  >
                    添加
                  </button>
                </div>
                {modelForm.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {modelForm.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                      >
                        {feature}
                        <button
                          onClick={() => removeFeature(idx)}
                          className="ml-1 hover:text-primary-900"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label-field">备注说明</label>
                <textarea
                  value={modelForm.remarks}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, remarks: e.target.value })
                  }
                  className="input-field min-h-[80px] resize-y"
                  placeholder="补充说明..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModelModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleModelSubmit}
                className="btn-primary inline-flex items-center gap-1.5"
                disabled={!modelForm.modelName.trim()}
              >
                <Check className="w-4 h-4" />
                {editingModel ? '保存修改' : '添加型号'}
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
                  <h3 className="text-lg font-bold text-slate-800">
                    确认删除
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {deleteTarget.type === 'brand'
                      ? `确定要删除品牌「${deleteTarget.name}」吗？该品牌下的所有型号也将被删除。`
                      : `确定要删除型号「${deleteTarget.name}」吗？`}
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
