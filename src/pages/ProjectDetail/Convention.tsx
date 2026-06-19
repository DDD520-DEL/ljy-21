import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Edit3,
  Save,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  BookOpen,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { ELEVATOR_CONVENTION_DEFAULT_TITLE } from '@/types';

export default function ConventionPage() {
  const { id } = useParams<{ id: string }>();
  const projects = useProjectStore((s) => s.projects);
  const project = projects.find((p) => p.id === id);
  const saveConvention = useProjectStore((s) => s.saveConvention);
  const publishConvention = useProjectStore((s) => s.publishConvention);
  const getConventionReadRecords = useProjectStore((s) => s.getConventionReadRecords);
  const getConventionUnreadCount = useProjectStore((s) => s.getConventionUnreadCount);
  const getConventionReadCount = useProjectStore((s) => s.getConventionReadCount);
  const confirmConventionRead = useProjectStore((s) => s.confirmConventionRead);

  const convention = project?.elevatorConvention;
  const [isEditing, setIsEditing] = useState(!convention);
  const [title, setTitle] = useState(convention?.title || ELEVATOR_CONVENTION_DEFAULT_TITLE);
  const [content, setContent] = useState(
    convention?.content ||
      `一、电梯使用总则
1. 电梯是全体业主的共有财产，每位住户都有爱护电梯的义务。
2. 使用电梯时请遵守秩序，先下后上，文明乘梯。
3. 电梯仅限载人及轻便物品使用，禁止运送超长、超重物品。

二、安全使用须知
1. 电梯运行中请勿将身体部位伸出轿厢外。
2. 请勿在轿厢内蹦跳、打闹，以免影响电梯正常运行。
3. 遇到电梯故障请勿惊慌，使用紧急呼叫按钮求助。
4. 发生火灾或地震时禁止使用电梯。

三、乘坐礼仪规范
1. 主动照顾老人、孕妇、儿童和行动不便者。
2. 请勿在轿厢内吸烟、吐痰、乱扔垃圾。
3. 保持轿厢内安静，请勿大声喧哗。
4. 请勿携带易燃易爆等危险物品乘坐电梯。

四、儿童乘梯规定
1. 儿童乘坐电梯须由成人陪同。
2. 请勿让儿童在电梯口玩耍逗留。
3. 教育孩子不要随意按动所有楼层按钮。

五、货物搬运规定
1. 搬运家具等大件物品请提前通知物业。
2. 搬运货物时请注意保护电梯内壁和地面。
3. 严禁超载使用电梯。

六、维保与报修
1. 电梯定期维保期间请配合绕行。
2. 发现电梯异常请及时向物业或项目负责人反映。
3. 请勿擅自拆卸或修理电梯部件。

七、费用与责任
1. 电梯日常运行及维保费用由全体业主共同承担。
2. 人为损坏电梯照价赔偿。
3. 违反使用规定造成的安全事故由责任人承担。
`
  );
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<{
    id: string;
    name: string;
    floor: number;
    unit: string;
  } | null>(null);

  const unreadCount = id ? getConventionUnreadCount(id) : 0;
  const readCount = id ? getConventionReadCount(id) : 0;

  const readRecords = useMemo(() => {
    if (!project) return [];
    return [...(project.conventionReadRecords || [])].sort(
      (a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
    );
  }, [project]);

  const unreadHouseholds = useMemo(() => {
    if (!project) return [];
    const readIds = new Set(readRecords.map((r) => r.householdId));
    return project.households
      .filter((h) => !readIds.has(h.id))
      .sort((a, b) => a.floor - b.floor || a.unit.localeCompare(b.unit));
  }, [project, readRecords]);

  const handleSave = () => {
    if (!id) return;
    saveConvention(id, { title, content });
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handlePublish = () => {
    if (!id) return;
    publishConvention(id, '项目负责人');
    setShowPublishConfirm(false);
    setIsEditing(false);
  };

  const openConfirmDialog = (household: {
    id: string;
    name: string;
    floor: number;
    unit: string;
  }) => {
    setSelectedHousehold(household);
    setShowConfirmDialog(true);
  };

  const handleConfirmRead = () => {
    if (!id || !selectedHousehold) return;
    confirmConventionRead(id, selectedHousehold.id);
    setShowConfirmDialog(false);
    setSelectedHousehold(null);
  };

  if (!project) return null;

  const isPublished = convention?.isPublished;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-800">
                电梯使用公约
              </h2>
              <p className="text-sm text-slate-500">
                {isPublished
                  ? `发布于 ${new Date(convention?.publishedAt || '').toLocaleString('zh-CN')} · ${convention?.publishedBy}`
                  : '尚未发布'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPublished && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                已发布
              </span>
            )}
            {!isPublished && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
                <Clock className="w-4 h-4" />
                草稿
              </span>
            )}
            {!isEditing && !isPublished && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                保存草稿
              </button>
            )}
            {!isPublished && (
              <button
                onClick={() => setShowPublishConfirm(true)}
                className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                发布
              </button>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            已保存草稿
          </div>
        )}

        <div className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  公约标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="请输入公约标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  公约内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input-field min-h-[500px] resize-none font-mono text-sm leading-relaxed"
                  placeholder="请输入电梯使用公约内容..."
                />
              </div>
            </>
          ) : (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">
                {convention?.title || ELEVATOR_CONVENTION_DEFAULT_TITLE}
              </h3>
              <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-line leading-relaxed">
                {convention?.content || content}
              </div>
            </div>
          )}
        </div>
      </div>

      {isPublished && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-800">
                  阅读确认情况
                </h3>
                <p className="text-sm text-slate-500">
                  共 {project.households.length} 户，已确认 {readCount} 户，
                  未确认 {unreadCount} 户
                </p>
              </div>
            </div>
          </div>

          <div className="flex border-b border-slate-200 mb-4">
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'unread'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              未确认 ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('read')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'read'
                  ? 'border-green-500 text-green-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              已确认 ({readCount})
            </button>
          </div>

          {activeTab === 'unread' && (
            <div className="overflow-x-auto">
              {unreadHouseholds.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">楼层</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">室号</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">户主</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">联系电话</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">状态</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unreadHouseholds.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{h.floor} 层</td>
                        <td className="px-4 py-3 text-slate-700">{h.unit}</td>
                        <td className="px-4 py-3 text-slate-700">{h.ownerName}</td>
                        <td className="px-4 py-3 text-slate-500">{h.phone}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                            待确认
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              openConfirmDialog({
                                id: h.id,
                                name: h.ownerName,
                                floor: h.floor,
                                unit: h.unit,
                              })
                            }
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            确认已读
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-slate-700 font-medium">所有住户均已确认阅读</p>
                  <p className="text-sm text-slate-500 mt-1">
                    共 {project.households.length} 户住户已全部确认
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'read' && (
            <div className="overflow-x-auto">
              {readRecords.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">楼层</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">室号</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">户主</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">确认时间</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {readRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{r.floor} 层</td>
                        <td className="px-4 py-3 text-slate-700">{r.unit}</td>
                        <td className="px-4 py-3 text-slate-700">{r.householdName}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(r.confirmedAt).toLocaleString('zh-CN')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3" />
                            已确认
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-700 font-medium">暂无已确认住户</p>
                  <p className="text-sm text-slate-500 mt-1">
                    发布公约后，住户确认阅读后将显示在这里
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">确认发布公约</h3>
                <p className="text-sm text-slate-500">{project.name}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">发布后注意事项</p>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    <li>• 所有住户将收到待阅读提示</li>
                    <li>• 发布后不可撤销，但可编辑后重新发布</li>
                    <li>• 重新发布将重置所有已读记录</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handlePublish}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && selectedHousehold && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">电梯使用公约</h3>
                  <p className="text-sm text-slate-500">
                    {selectedHousehold.floor}层 {selectedHousehold.unit} · {selectedHousehold.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedHousehold(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="text-xl font-bold text-slate-800 mb-4 text-center">
                  {convention?.title || ELEVATOR_CONVENTION_DEFAULT_TITLE}
                </h4>
                <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {convention?.content || content}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      确认人信息
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      确认人：<span className="font-medium">{selectedHousehold.name}</span>
                      （{selectedHousehold.floor}层 {selectedHousehold.unit}）
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setSelectedHousehold(null);
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmRead}
                  className="btn-primary inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  确认已阅读
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
