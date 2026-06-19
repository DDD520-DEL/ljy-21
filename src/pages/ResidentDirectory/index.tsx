import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Building2,
  Phone,
  Home,
  Users2,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import type { Project, Household } from '@/types';
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR } from '@/types';
import { maskPhone } from '@/utils/maskData';

interface HouseholdWithProject extends Household {
  project: Project;
}

interface ResidentDetailModalProps {
  household: HouseholdWithProject;
  allProjects: Project[];
  onClose: () => void;
}

function ResidentDetailModal({ household, allProjects, onClose }: ResidentDetailModalProps) {
  const residentProjects = useMemo(() => {
    return allProjects.filter((p) =>
      p.households.some(
        (h) =>
          h.ownerName === household.ownerName &&
          h.phone === household.phone
      )
    );
  }, [household, allProjects]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{household.ownerName}</h2>
                <p className="text-primary-100 text-sm">
                  {household.project.name} · {household.floor}层{household.unit}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Phone className="w-4 h-4" />
                <span>联系电话</span>
              </div>
              <p className="font-semibold text-slate-800">{maskPhone(household.phone)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Home className="w-4 h-4" />
                <span>房屋面积</span>
              </div>
              <p className="font-semibold text-slate-800">{household.area} ㎡</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <MapPin className="w-4 h-4" />
                <span>房号</span>
              </div>
              <p className="font-semibold text-slate-800">{household.floor}层{household.unit}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Users2 className="w-4 h-4" />
                <span>家庭常住人口</span>
              </div>
              <p className="font-semibold text-slate-800">{household.familyPopulation} 人</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-slate-800">
                参与的加装电梯项目 ({residentProjects.length})
              </h3>
            </div>

            {residentProjects.length > 0 ? (
              <div className="space-y-3">
                {residentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-4 bg-slate-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-800 group-hover:text-primary-700 transition-colors">
                            {project.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLOR[project.status]}`}>
                            {PROJECT_STATUS_LABEL[project.status]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {project.address}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users2 className="w-3.5 h-3.5" />
                            {project.households.length} 户参与
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>暂无参与的其他项目</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResidentDirectory() {
  const projects = useProjectStore((s) => s.projects);

  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [selectedUnit, setSelectedUnit] = useState<string | 'all'>('all');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdWithProject | null>(null);

  const allHouseholds = useMemo(() => {
    const households: HouseholdWithProject[] = [];
    projects.forEach((project) => {
      project.households.forEach((household) => {
        households.push({
          ...household,
          project,
        });
      });
    });
    return households;
  }, [projects]);

  const availableFloors = useMemo(() => {
    const floors = new Set<number>();
    allHouseholds.forEach((h) => floors.add(h.floor));
    return Array.from(floors).sort((a, b) => a - b);
  }, [allHouseholds]);

  const availableUnits = useMemo(() => {
    const units = new Set<string>();
    allHouseholds.forEach((h) => units.add(h.unit));
    return Array.from(units).sort();
  }, [allHouseholds]);

  const filteredHouseholds = useMemo(() => {
    return allHouseholds.filter((h) => {
      const matchSearch =
        !search ||
        h.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        h.phone.includes(search) ||
        h.project.name.toLowerCase().includes(search.toLowerCase());
      const matchProject = selectedProjectId === 'all' || h.projectId === selectedProjectId;
      const matchFloor = selectedFloor === 'all' || h.floor === selectedFloor;
      const matchUnit = selectedUnit === 'all' || h.unit === selectedUnit;
      return matchSearch && matchProject && matchFloor && matchUnit;
    });
  }, [allHouseholds, search, selectedProjectId, selectedFloor, selectedUnit]);

  const householdsByProject = useMemo(() => {
    const grouped: Record<string, HouseholdWithProject[]> = {};
    filteredHouseholds.forEach((h) => {
      if (!grouped[h.projectId]) {
        grouped[h.projectId] = [];
      }
      grouped[h.projectId].push(h);
    });
    Object.keys(grouped).forEach((projectId) => {
      grouped[projectId].sort((a, b) => {
        if (a.floor !== b.floor) return a.floor - b.floor;
        return a.unit.localeCompare(b.unit);
      });
    });
    return grouped;
  }, [filteredHouseholds]);

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const expandAll = () => {
    const allIds = Object.keys(householdsByProject);
    setExpandedProjects(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedProjects(new Set());
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedProjectId('all');
    setSelectedFloor('all');
    setSelectedUnit('all');
  };

  const hasActiveFilters = search || selectedProjectId !== 'all' || selectedFloor !== 'all' || selectedUnit !== 'all';

  const stats = useMemo(() => ({
    totalHouseholds: allHouseholds.length,
    totalProjects: projects.filter((p) => p.archiveStatus !== 'archived').length,
    totalPopulation: allHouseholds.reduce((sum, h) => sum + h.familyPopulation, 0),
    filteredCount: filteredHouseholds.length,
  }), [allHouseholds, projects, filteredHouseholds]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">居民通讯录</h1>
              <p className="text-primary-100 text-sm">以项目为单位，统一管理所有参与住户信息</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <Building2 className="w-4 h-4" />
                <span>活跃项目</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <Users className="w-4 h-4" />
                <span>住户总数</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalHouseholds}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <Users2 className="w-4 h-4" />
                <span>覆盖人口</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalPopulation}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <Filter className="w-4 h-4" />
                <span>筛选结果</span>
              </div>
              <p className="text-2xl font-bold">{stats.filteredCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索姓名、电话或项目名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !pl-10 w-full"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="input-field min-w-[180px]"
              >
                <option value="all">全部项目</option>
                {projects
                  .filter((p) => p.archiveStatus !== 'archived')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>

              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="input-field min-w-[120px]"
              >
                <option value="all">全部楼层</option>
                {availableFloors.map((f) => (
                  <option key={f} value={f}>
                    {f} 层
                  </option>
                ))}
              </select>

              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="input-field min-w-[120px]"
              >
                <option value="all">全部单元</option>
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  清除筛选
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              共找到 <span className="font-semibold text-slate-700">{filteredHouseholds.length}</span> 位住户，
              分布在 <span className="font-semibold text-slate-700">{Object.keys(householdsByProject).length}</span> 个项目中
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                展开全部
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={collapseAll}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                收起全部
              </button>
            </div>
          </div>
        </div>

        {Object.keys(householdsByProject).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(householdsByProject).map(([projectId, households]) => {
              const project = households[0].project;
              const isExpanded = expandedProjects.has(projectId);
              const totalPopulation = households.reduce((sum, h) => sum + h.familyPopulation, 0);

              return (
                <div
                  key={projectId}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleProject(projectId)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{project.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLOR[project.status]}`}>
                            {PROJECT_STATUS_LABEL[project.status]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {project.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Users className="w-4 h-4" />
                          {households.length} 户
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Users2 className="w-4 h-4" />
                          {totalPopulation} 人
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {project.surveyResponses.filter((r) => r.opinion === 'agree').length}/{households.length} 同意
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                楼层
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                房号
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                姓名
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                联系电话
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                面积
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                家庭人口
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                操作
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {households.map((household) => (
                              <tr
                                key={household.id}
                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                                onClick={() => setSelectedHousehold(household)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                  {household.floor} 层
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                                    {household.unit}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                                      {household.ownerName.charAt(0)}
                                    </div>
                                    <span className="font-medium text-slate-800">{household.ownerName}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                  {maskPhone(household.phone)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                  {household.area} ㎡
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                    <Users2 className="w-3 h-3" />
                                    {household.familyPopulation} 人
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                    查看详情
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              暂无匹配的住户信息
            </h3>
            <p className="text-slate-500 mb-6">
              尝试调整搜索关键词或筛选条件
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-primary inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                清除筛选条件
              </button>
            )}
          </div>
        )}
      </div>

      {selectedHousehold && (
        <ResidentDetailModal
          household={selectedHousehold}
          allProjects={projects}
          onClose={() => setSelectedHousehold(null)}
        />
      )}
    </div>
  );
}
