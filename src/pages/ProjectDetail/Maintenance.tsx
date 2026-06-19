import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Wrench,
  Calendar,
  Building2,
  FileText,
  User,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Package,
  Info,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { MAINTENANCE_INTERVAL_OPTIONS, DEFAULT_MAINTENANCE_INTERVAL } from '@/types';
import type { MaintenanceRecord, ReplacementPart } from '@/types';

export default function Maintenance() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const getProjectMaintenanceRecords = useProjectStore((s) => s.getProjectMaintenanceRecords);
  const getProjectElevatorArchives = useProjectStore((s) => s.getProjectElevatorArchives);
  const getNextMaintenanceDate = useProjectStore((s) => s.getNextMaintenanceDate);
  const addMaintenanceRecord = useProjectStore((s) => s.addMaintenanceRecord);

  const [showForm, setShowForm] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    maintenanceDate: new Date().toISOString().split('T')[0],
    maintenanceCompany: '',
    maintenanceContent: '',
    technician: '',
    nextMaintenanceDate: '',
    remarks: '',
  });

  const [parts, setParts] = useState<Omit<ReplacementPart, 'id'>[]>([]);
  const [newPart, setNewPart] = useState({
    name: '',
    quantity: 1,
    unit: '个',
    specification: '',
  });

  if (!project) return null;

  const records = getProjectMaintenanceRecords(project.id);
  const archives = getProjectElevatorArchives(project.id);
  const nextDate = getNextMaintenanceDate(project.id);
  const archive = archives[0];

  const today = new Date();
  const daysUntilNext = nextDate
    ? Math.ceil((new Date(nextDate).getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const handleAddPart = () => {
    if (!newPart.name.trim()) return;
    setParts([...parts, { ...newPart }]);
    setNewPart({ name: '', quantity: 1, unit: '个', specification: '' });
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.maintenanceDate ||
      !formData.maintenanceCompany.trim() ||
      !formData.maintenanceContent.trim() ||
      !formData.technician.trim() ||
      !formData.nextMaintenanceDate
    ) {
      alert('请填写完整的维保信息');
      return;
    }

    const result = addMaintenanceRecord(project.id, {
      ...formData,
      replacementParts: parts,
    });

    if (result) {
      alert('维保记录添加成功！');
      setShowForm(false);
      setFormData({
        maintenanceDate: new Date().toISOString().split('T')[0],
        maintenanceCompany: '',
        maintenanceContent: '',
        technician: '',
        nextMaintenanceDate: '',
        remarks: '',
      });
      setParts([]);
    }
  };

  const toggleExpand = (recordId: string) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getIntervalLabel = (months: number) => {
    const opt = MAINTENANCE_INTERVAL_OPTIONS.find((o) => o.value === months);
    return opt ? opt.label : `每${months}个月`;
  };

  const getDaysStatus = (days: number | null) => {
    if (days === null) return { text: '暂无计划', color: 'text-slate-500', bg: 'bg-slate-100' };
    if (days < 0) return { text: `已逾期${Math.abs(days)}天`, color: 'text-red-600', bg: 'bg-red-100' };
    if (days <= 7) return { text: `${days}天后到期`, color: 'text-amber-600', bg: 'bg-amber-100' };
    return { text: `${days}天后`, color: 'text-green-600', bg: 'bg-green-100' };
  };

  const daysStatus = getDaysStatus(daysUntilNext);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-sm text-slate-500">维保次数</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{records.length}</p>
          <p className="text-sm text-slate-400 mt-1">累计维保记录</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">下次维保</span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {nextDate ? formatDate(nextDate) : '暂无'}
          </p>
          <p className={`text-sm mt-1 ${daysStatus.color}`}>
            {daysStatus.text}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-slate-500">维保周期</span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {archive ? getIntervalLabel(archive.maintenanceIntervalMonths) : `每${DEFAULT_MAINTENANCE_INTERVAL}个月`}
          </p>
          <p className="text-sm text-slate-400 mt-1">定期维保</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-slate-500">更换配件</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {records.reduce((sum, r) => sum + r.replacementParts.length, 0)}
          </p>
          <p className="text-sm text-slate-400 mt-1">累计更换配件数</p>
        </div>
      </div>

      {archive && (
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-semibold text-slate-800">电梯档案信息</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">电梯编号</p>
              <p className="text-sm font-medium text-slate-700">{archive.elevatorNo}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">电梯品牌</p>
              <p className="text-sm font-medium text-slate-700">{archive.brand}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">型号</p>
              <p className="text-sm font-medium text-slate-700">{archive.model}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">验收日期</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(archive.acceptanceDate)}</p>
            </div>
          </div>
        </div>
      )}

      {daysUntilNext !== null && daysUntilNext <= 7 && daysUntilNext >= 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">
                维保即将到期提醒
              </p>
              <p className="text-sm text-amber-600">
                距离下次维保还有 {daysUntilNext} 天（{nextDate && formatDate(nextDate)}），请及时联系维保单位安排维保。
              </p>
            </div>
          </div>
        </div>
      )}

      {daysUntilNext !== null && daysUntilNext < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-800">
                维保已逾期！
              </p>
              <p className="text-sm text-red-600">
                维保已逾期 {Math.abs(daysUntilNext)} 天，请尽快安排维保，确保电梯安全运行。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-800">维保记录</h2>
          <p className="text-sm text-slate-500 mt-1">
            共 {records.length} 条维保记录
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加维保记录
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">添加维保记录</h3>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setParts([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    维保日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.maintenanceDate}
                    onChange={(e) => setFormData({ ...formData, maintenanceDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    下次维保日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.nextMaintenanceDate}
                    onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  维保单位 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.maintenanceCompany}
                    onChange={(e) => setFormData({ ...formData, maintenanceCompany: e.target.value })}
                    placeholder="请输入维保单位名称"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  维保人员 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    placeholder="请输入维保人员姓名"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  保养内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.maintenanceContent}
                  onChange={(e) => setFormData({ ...formData, maintenanceContent: e.target.value })}
                  placeholder="请详细描述本次维保的内容，如：清洁、润滑、检查、测试等"
                  className="input-field min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  更换配件清单
                </label>
                <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                  {parts.length > 0 && (
                    <div className="space-y-2">
                      {parts.map((part, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                          <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {part.name}
                              {part.specification && <span className="text-slate-400 ml-2">({part.specification})</span>}
                            </p>
                            <p className="text-xs text-slate-500">
                              数量：{part.quantity} {part.unit}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(index)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={newPart.name}
                        onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                        placeholder="配件名称"
                        className="input-field !py-2 !text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={newPart.quantity}
                        onChange={(e) => setNewPart({ ...newPart, quantity: Number(e.target.value) })}
                        placeholder="数量"
                        className="input-field !py-2 !text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={newPart.unit}
                        onChange={(e) => setNewPart({ ...newPart, unit: e.target.value })}
                        placeholder="单位"
                        className="input-field !py-2 !text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={newPart.specification}
                        onChange={(e) => setNewPart({ ...newPart, specification: e.target.value })}
                        placeholder="规格"
                        className="input-field !py-2 !text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="w-full px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  备注
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="其他需要记录的信息（可选）"
                  className="input-field min-h-[60px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setParts([]);
                  }}
                  className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无维保记录</h3>
          <p className="text-slate-500 mb-4">
            点击上方「添加维保记录」按钮登记维保信息
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加第一条维保记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="card overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(record.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">
                          {formatDate(record.maintenanceDate)} 维保
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          {record.maintenanceCompany}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {record.technician}
                        </span>
                        {record.replacementParts.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            更换配件 {record.replacementParts.length} 件
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">下次维保</p>
                      <p className="text-sm font-medium text-slate-700">
                        {formatDate(record.nextMaintenanceDate)}
                      </p>
                    </div>
                    {expandedRecordId === record.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedRecordId === record.id && (
                <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
                  <div>
                    <p className="text-xs text-slate-500 mb-2">保养内容</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {record.maintenanceContent}
                    </p>
                  </div>

                  {record.replacementParts.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">更换配件清单</p>
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">配件名称</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">规格</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">数量</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">单位</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {record.replacementParts.map((part) => (
                              <tr key={part.id}>
                                <td className="px-3 py-2 text-slate-700">{part.name}</td>
                                <td className="px-3 py-2 text-slate-500">{part.specification || '-'}</td>
                                <td className="px-3 py-2 text-center text-slate-700">{part.quantity}</td>
                                <td className="px-3 py-2 text-slate-500">{part.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {record.remarks && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">备注</p>
                      <p className="text-sm text-slate-600">{record.remarks}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">维保单位</p>
                      <p className="text-sm font-medium text-slate-700">{record.maintenanceCompany}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">维保人员</p>
                      <p className="text-sm font-medium text-slate-700">{record.technician}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">维保日期</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(record.maintenanceDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">下次维保</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(record.nextMaintenanceDate)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
