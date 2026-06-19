import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Phone,
  Calendar,
  FileText,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Camera,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import {
  FAULT_TYPE_LABEL,
  REPAIR_STATUS_LABEL,
  REPAIR_STATUS_COLOR,
  FAULT_TYPE_OPTIONS,
} from '@/types';
import type { RepairOrder, FaultType } from '@/types';

export default function RepairOrders() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const getProjectRepairOrders = useProjectStore((s) => s.getProjectRepairOrders);
  const addRepairOrder = useProjectStore((s) => s.addRepairOrder);
  const updateRepairOrderStatus = useProjectStore((s) => s.updateRepairOrderStatus);
  const completeRepairOrder = useProjectStore((s) => s.completeRepairOrder);

  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    faultType: 'door_fault' as FaultType,
    location: '',
    description: '',
    reporterName: '',
    reporterPhone: '',
  });

  const [completeForm, setCompleteForm] = useState({
    repairNote: '',
    assignee: '',
    photos: [] as { url: string; name: string }[],
  });

  const [viewerImage, setViewerImage] = useState<string | null>(null);

  if (!project) return null;

  const orders = getProjectRepairOrders(project.id);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location.trim() || !formData.description.trim() || !formData.reporterName.trim() || !formData.reporterPhone.trim()) {
      alert('请填写完整的报修信息');
      return;
    }

    const result = addRepairOrder(project.id, formData);
    if (result) {
      alert(`报修成功！工单编号：${result.orderNo}`);
      setShowForm(false);
      setFormData({
        faultType: 'door_fault',
        location: '',
        description: '',
        reporterName: '',
        reporterPhone: '',
      });
    }
  };

  const handleStartProcessing = (order: RepairOrder) => {
    if (confirm('确认开始处理此工单吗？')) {
      updateRepairOrderStatus(project.id, order.id, 'processing', {
        assignee: '维修人员',
      });
    }
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!completeForm.repairNote.trim() || !completeForm.assignee.trim()) {
      alert('请填写维修说明和维修人员');
      return;
    }
    if (completeForm.photos.length === 0) {
      alert('请上传至少一张完工照片');
      return;
    }

    completeRepairOrder(project.id, selectedOrder.id, {
      repairNote: completeForm.repairNote,
      assignee: completeForm.assignee,
      photos: completeForm.photos.map((p) => ({
        url: p.url,
        name: p.name,
        uploader: completeForm.assignee,
      })),
    });

    setShowCompleteModal(false);
    setSelectedOrder(null);
    setCompleteForm({
      repairNote: '',
      assignee: '',
      photos: [],
    });
    alert('工单已完成！');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setCompleteForm((prev) => ({
          ...prev,
          photos: [...prev.photos, { url, name: file.name }],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setCompleteForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-sm text-slate-500">工单总数</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{orders.length}</p>
          <p className="text-sm text-slate-400 mt-1">累计报修工单</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">待处理</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-sm text-slate-400 mt-1">等待维修处理</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">处理中</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{processingCount}</p>
          <p className="text-sm text-slate-400 mt-1">正在维修作业</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-slate-500">已修复</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{completedCount}</p>
          <p className="text-sm text-slate-400 mt-1">维修完成结单</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-800">电梯故障报修工单</h2>
          <p className="text-sm text-slate-500 mt-1">
            共 {orders.length} 条工单记录
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          提交报修
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">提交电梯故障报修</h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  故障类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.faultType}
                  onChange={(e) => setFormData({ ...formData, faultType: e.target.value as FaultType })}
                  className="input-field"
                >
                  {FAULT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  具体位置 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="如：1号电梯、2单元电梯轿厢内"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  故障描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请详细描述故障现象，如：电梯到达3楼后无法开门、运行时有异响等"
                  className="input-field min-h-[100px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    报修人姓名 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.reporterName}
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      placeholder="请输入姓名"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.reporterPhone}
                      onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                      placeholder="请输入手机号"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  提交报修
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">工单完工确认</h3>
              </div>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedOrder(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">工单编号</p>
              <p className="font-semibold text-slate-800">{selectedOrder.orderNo}</p>
            </div>

            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  维修人员 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={completeForm.assignee}
                  onChange={(e) => setCompleteForm({ ...completeForm, assignee: e.target.value })}
                  placeholder="请输入维修人员姓名"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  维修说明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completeForm.repairNote}
                  onChange={(e) => setCompleteForm({ ...completeForm, repairNote: e.target.value })}
                  placeholder="请详细说明维修内容和处理结果"
                  className="input-field min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  完工照片 <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Camera className="w-8 h-8 text-slate-400" />
                    <span className="text-sm text-slate-600">点击上传完工照片</span>
                    <span className="text-xs text-slate-400">支持 JPG、PNG 格式，可多选</span>
                  </label>
                </div>

                {completeForm.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {completeForm.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  确认完工
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewerImage && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] animate-fade-in"
          onClick={() => setViewerImage(null)}
        >
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewerImage}
            alt="查看大图"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无报修工单</h3>
          <p className="text-slate-500 mb-4">
            点击上方「提交报修」按钮登记电梯故障
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            提交第一笔报修
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        order.status === 'pending'
                          ? 'bg-amber-100'
                          : order.status === 'processing'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                      }`}
                    >
                      {order.status === 'pending' && (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                      {order.status === 'processing' && (
                        <Wrench className="w-5 h-5 text-blue-600" />
                      )}
                      {order.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">
                          {order.orderNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${REPAIR_STATUS_COLOR[order.status]}`}
                        >
                          {REPAIR_STATUS_LABEL[order.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{FAULT_TYPE_LABEL[order.faultType]}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {formatDate(order.createdAt)}
                    </span>
                    {expandedOrderId === order.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">故障描述</p>
                      <p className="text-sm text-slate-700">{order.description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">报修人信息</p>
                      <p className="text-sm text-slate-700">
                        {order.reporterName} · {order.reporterPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">提交时间</p>
                      <p className="text-sm text-slate-700">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    {order.processingAt && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">开始处理时间</p>
                        <p className="text-sm text-slate-700">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDate(order.processingAt)}
                        </p>
                      </div>
                    )}
                    {order.completedAt && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">完成时间</p>
                        <p className="text-sm text-slate-700">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          {formatDate(order.completedAt)}
                        </p>
                      </div>
                    )}
                    {order.assignee && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">维修人员</p>
                        <p className="text-sm text-slate-700">{order.assignee}</p>
                      </div>
                    )}
                  </div>

                  {order.repairNote && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">维修说明</p>
                      <p className="text-sm text-slate-700 p-3 bg-green-50 rounded-lg border border-green-100">
                        {order.repairNote}
                      </p>
                    </div>
                  )}

                  {order.completedPhotos.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">完工照片</p>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {order.completedPhotos.map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.url}
                            alt={photo.name}
                            className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewerImage(photo.url)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartProcessing(order);
                        }}
                        className="btn-secondary inline-flex items-center gap-2"
                      >
                        <Wrench className="w-4 h-4" />
                        开始处理
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowCompleteModal(true);
                        }}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        完工结单
                      </button>
                    )}
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
