import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Calculator,
  RefreshCw,
  DollarSign,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { calculateShareRatio, formatCurrency } from '@/utils/feeCalculator';
import { maskName, maskPhone } from '@/utils/maskData';

export default function HouseholdsPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const [showNames, setShowNames] = useState(false);

  if (!project) return null;

  const recalculated = calculateShareRatio(
    project.households.map((h) => ({
      ...h,
      shareRatio: 0,
      shareAmount: 0,
    })),
    project.totalCost
  );

  const totalShare = project.households.reduce(
    (sum, h) => sum + h.shareAmount,
    0
  );

  const householdsByFloor: Record<number, typeof project.households> = {};
  project.households.forEach((h) => {
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
            {project.households.length} 户
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
            {project.households.filter((h) => h.shareAmount > 0).length} 户
          </p>
        </div>
      </div>

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
                  {project.households.reduce((s, h) => s + h.shareRatio, 0).toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right text-amber-600">
                  {formatCurrency(totalShare)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
