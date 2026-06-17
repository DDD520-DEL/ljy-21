import type { Project } from '@/types';
import { ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react';

interface SurveyChartProps {
  project: Project;
}

export default function SurveyChart({ project }: SurveyChartProps) {
  const totalHouseholds = project.households.length;
  const agreeCount = project.surveyResponses.filter(
    (r) => r.opinion === 'agree'
  ).length;
  const opposeCount = project.surveyResponses.filter(
    (r) => r.opinion === 'oppose'
  ).length;
  const abstainCount = project.surveyResponses.filter(
    (r) => r.opinion === 'abstain'
  ).length;
  const unsignedCount = totalHouseholds - project.surveyResponses.length;

  const totalSigned = agreeCount + opposeCount + abstainCount;
  const agreeRate =
    totalHouseholds > 0
      ? Math.round((agreeCount / totalHouseholds) * 100)
      : 0;
  const signRate =
    totalHouseholds > 0
      ? Math.round((totalSigned / totalHouseholds) * 100)
      : 0;
  const thresholdPercent = (2 / 3) * 100;

  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference - (signRate / 100) * circumference;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="60"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="14"
            />
            <circle
              cx="96"
              cy="96"
              r="60"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-slate-800">{signRate}%</span>
            <span className="text-sm text-slate-500 mt-1">已签署比例</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">同意</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{agreeCount}</p>
            <p className="text-xs text-green-600 mt-0.5">
              {totalHouseholds > 0
                ? Math.round((agreeCount / totalHouseholds) * 100)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">反对</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{opposeCount}</p>
            <p className="text-xs text-red-600 mt-0.5">
              {totalHouseholds > 0
                ? Math.round((opposeCount / totalHouseholds) * 100)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <MinusCircle className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">弃权</span>
            </div>
            <p className="text-2xl font-bold text-slate-700">{abstainCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalHouseholds > 0
                ? Math.round((abstainCount / totalHouseholds) * 100)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-amber-500" />
              <span className="text-sm font-medium text-amber-700">未签署</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{unsignedCount}</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {totalHouseholds > 0
                ? Math.round((unsignedCount / totalHouseholds) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700">法定同意率门槛</span>
            <span className="font-bold text-primary-800">2/3（约 66.7%）</span>
          </div>
          <div className="mt-2 h-3 bg-white rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-500" style={{ width: `${agreeRate}%` }} />
            <div className="absolute inset-y-0 w-0.5 bg-amber-500" style={{ left: `${thresholdPercent}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs">
            <span className="text-green-700 font-medium">当前 {agreeRate}%</span>
            <span className="text-amber-600">达标线 2/3（{thresholdPercent.toFixed(1)}%）</span>
          </div>
        </div>
      </div>
    </div>
  );
}
