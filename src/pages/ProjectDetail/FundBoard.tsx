import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { formatCurrency } from '@/utils/feeCalculator';
import { FUND_RECORD_TYPE_LABEL, FUND_RECORD_TYPE_COLOR } from '@/types';
import type { FundRecord } from '@/types';
import FundRecordModal from '@/components/FundRecordModal';

export default function FundBoard() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const getProjectFundRecords = useProjectStore((s) => s.getProjectFundRecords);
  const getFundBalance = useProjectStore((s) => s.getFundBalance);
  const getMonthlyFundSummaries = useProjectStore((s) => s.getMonthlyFundSummaries);
  const deleteFundRecord = useProjectStore((s) => s.deleteFundRecord);

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FundRecord | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  if (!project) return null;

  const records = getProjectFundRecords(project.id);
  const balance = getFundBalance(project.id);
  const monthlySummaries = getMonthlyFundSummaries(project.id);

  const totalIncome = records
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = records
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleAdd = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEdit = (record: FundRecord) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDelete = (recordId: string) => {
    if (confirm('确定要删除这条资金记录吗？')) {
      deleteFundRecord(project.id, recordId);
    }
  };

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-sm opacity-80">当前余额</span>
          </div>
          <p className="text-3xl font-bold mb-1">{formatCurrency(balance)}</p>
          <p className="text-sm opacity-70">项目可用资金</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-slate-500">累计收入</span>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-sm text-slate-400">
            共 {records.filter((r) => r.type === 'income').length} 笔收入
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-slate-500">累计支出</span>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-1">
            {formatCurrency(totalExpense)}
          </p>
          <p className="text-sm text-slate-400">
            共 {records.filter((r) => r.type === 'expense').length} 笔支出
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-800">资金流水明细</h2>
          <p className="text-sm text-slate-500 mt-1">
            共 {records.length} 条记录，按月度汇总展示
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增记录
        </button>
      </div>

      {records.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无资金记录</h3>
          <p className="text-slate-500 mb-4">
            点击上方「新增记录」按钮开始登记项目的收支明细
          </p>
          <button
            onClick={handleAdd}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加第一笔记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {monthlySummaries.map((summary) => (
            <div key={summary.month} className="card overflow-hidden">
              <div
                className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleMonth(summary.month)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedMonths.has(summary.month) ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {formatMonth(summary.month)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        共 {summary.records.length} 条记录
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-green-600 font-medium">
                        +{formatCurrency(summary.totalIncome)}
                      </p>
                      <p className="text-xs text-slate-400">收入</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-600 font-medium">
                        -{formatCurrency(summary.totalExpense)}
                      </p>
                      <p className="text-xs text-slate-400">支出</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {summary.netAmount >= 0 ? '+' : ''}
                        {formatCurrency(summary.netAmount)}
                      </p>
                      <p className="text-xs text-slate-400">本月净额</p>
                    </div>
                  </div>
                </div>
              </div>

              {expandedMonths.has(summary.month) && (
                <div className="divide-y divide-slate-100">
                  {summary.records.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            record.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {record.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                FUND_RECORD_TYPE_COLOR[record.type]
                              }`}
                            >
                              {FUND_RECORD_TYPE_LABEL[record.type]}
                            </span>
                            <span className="font-medium text-slate-800">
                              {record.category}
                            </span>
                          </div>
                          {record.description && (
                            <p className="text-sm text-slate-500 truncate">
                              {record.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(record.occurrenceDate)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {record.handler}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              record.type === 'income'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {record.type === 'income' ? '+' : '-'}
                            {formatCurrency(record.amount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <FundRecordModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingRecord(null);
        }}
        projectId={project.id}
        record={editingRecord}
      />
    </div>
  );
}
