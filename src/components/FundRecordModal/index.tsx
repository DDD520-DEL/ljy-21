import { useState, useEffect } from 'react';
import { X, DollarSign, User, Calendar, FileText, Tag } from 'lucide-react';
import type { FundRecord, FundRecordType } from '@/types';
import { FUND_INCOME_CATEGORIES, FUND_EXPENSE_CATEGORIES } from '@/types';
import { useProjectStore } from '@/store/projectStore';

interface FundRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  record?: FundRecord | null;
}

export default function FundRecordModal({
  isOpen,
  onClose,
  projectId,
  record,
}: FundRecordModalProps) {
  const [type, setType] = useState<FundRecordType>('income');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [handler, setHandler] = useState('');
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [description, setDescription] = useState('');

  const addFundRecord = useProjectStore((s) => s.addFundRecord);
  const updateFundRecord = useProjectStore((s) => s.updateFundRecord);

  useEffect(() => {
    if (record) {
      setType(record.type);
      setCategory(record.category);
      setAmount(String(record.amount));
      setHandler(record.handler);
      setOccurrenceDate(record.occurrenceDate.split('T')[0]);
      setDescription(record.description || '');
    } else {
      resetForm();
    }
  }, [record, isOpen]);

  const resetForm = () => {
    setType('income');
    setCategory('');
    setAmount('');
    setHandler('');
    setOccurrenceDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!category.trim()) {
      alert('请选择收支类别');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('请输入有效的金额');
      return;
    }
    if (!handler.trim()) {
      alert('请输入经办人');
      return;
    }
    if (!occurrenceDate) {
      alert('请选择发生日期');
      return;
    }

    if (record) {
      updateFundRecord(projectId, record.id, {
        type,
        category: category.trim(),
        amount: amountNum,
        handler: handler.trim(),
        occurrenceDate: new Date(occurrenceDate).toISOString(),
        description: description.trim() || undefined,
      });
      alert('记录已更新');
    } else {
      const result = addFundRecord(projectId, {
        type,
        category: category.trim(),
        amount: amountNum,
        handler: handler.trim(),
        occurrenceDate: new Date(occurrenceDate).toISOString(),
        description: description.trim() || undefined,
      });
      if (result) {
        alert('记录已添加');
      }
    }

    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  const categories = type === 'income' ? FUND_INCOME_CATEGORIES : FUND_EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              type === 'income' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                type === 'income' ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-800">
                {record ? '编辑资金记录' : '新增资金记录'}
              </h3>
              <p className="text-sm text-slate-500">
                {record ? '修改收支明细信息' : '登记一笔新的收支明细'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label-field">收支类型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('');
                }}
                className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-lg font-bold">收入</div>
                <div className="text-xs opacity-70">资金流入</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('');
                }}
                className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-lg font-bold">支出</div>
                <div className="text-xs opacity-70">资金流出</div>
              </button>
            </div>
          </div>

          <div>
            <label className="label-field">
              <Tag className="w-4 h-4 inline mr-1" />
              {type === 'income' ? '收款来源' : '支出用途'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    category === cat
                      ? type === 'income'
                        ? 'bg-green-100 text-green-700 border-2 border-green-400'
                        : 'bg-red-100 text-red-700 border-2 border-red-400'
                      : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">
              <DollarSign className="w-4 h-4 inline mr-1" />
              金额（元）
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field pl-8 text-lg font-semibold"
                placeholder="请输入金额"
              />
            </div>
          </div>

          <div>
            <label className="label-field">
              <User className="w-4 h-4 inline mr-1" />
              经办人
            </label>
            <input
              type="text"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
              className="input-field"
              placeholder="请输入经办人姓名"
            />
          </div>

          <div>
            <label className="label-field">
              <Calendar className="w-4 h-4 inline mr-1" />
              发生日期
            </label>
            <input
              type="date"
              value={occurrenceDate}
              onChange={(e) => setOccurrenceDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label-field">
              <FileText className="w-4 h-4 inline mr-1" />
              备注说明（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[80px] resize-none"
              placeholder="请输入备注说明..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`btn-primary inline-flex items-center gap-2 ${
              type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            {record ? '保存修改' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
