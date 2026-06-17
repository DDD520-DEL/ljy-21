import { create } from 'zustand';
import type {
  Project,
  Household,
  SurveyResponse,
  ProgressNode,
  MediaFile,
  ProjectStatus,
} from '@/types';
import { mockProjects } from '@/utils/mockData';
import { STAGE_LIST } from '@/types';
import { calculateShareRatio } from '@/utils/feeCalculator';

const STORAGE_KEY = 'elevator_projects';

interface HouseholdInput {
  floor: number;
  unit: string;
  area: number;
  ownerName: string;
  phone: string;
}

interface ImportHouseholdResult {
  successCount: number;
  failCount: number;
  errors: { rowNumber: number; errors: string[] }[];
}

interface ProjectStore {
  projects: Project[];
  selectedProjectId: string | null;

  initProjects: () => void;
  getProject: (id: string) => Project | undefined;
  addProject: (project: {
    name: string;
    address: string;
    totalFloors: number;
    totalCost: number;
    households: HouseholdInput[];
  }) => string;
  importHouseholds: (projectId: string, households: HouseholdInput[]) => ImportHouseholdResult;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;

  addSurveyResponse: (projectId: string, response: Omit<SurveyResponse, 'id' | 'projectId' | 'signedAt'>) => void;

  updateProgressNode: (projectId: string, nodeId: string, data: Partial<ProgressNode>) => void;
  addMediaFile: (projectId: string, nodeId: string, file: Omit<MediaFile, 'id' | 'nodeId'>) => void;
}

function generateId(): string {
  return 'id-' + Math.random().toString(36).slice(2, 11);
}

function initProgressNodes(projectId: string): ProgressNode[] {
  return STAGE_LIST.map((stage, index) => ({
    id: `node-${projectId}-${index}`,
    projectId,
    stage: stage.label,
    stageKey: stage.key,
    description: '',
    date: '',
    status: index === 0 ? 'in_progress' : 'pending',
    mediaFiles: [],
  }));
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  selectedProjectId: null,

  initProjects: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ projects: JSON.parse(stored) });
      } else {
        set({ projects: mockProjects });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProjects));
      }
    } catch {
      set({ projects: mockProjects });
    }
  },

  getProject: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },

  addProject: (data) => {
    const projectId = generateId();

    const households: Household[] = data.households.map((h, idx) => ({
      ...h,
      id: `h-${projectId}-${idx}`,
      projectId,
      shareRatio: 0,
      shareAmount: 0,
    }));

    const newProject: Project = {
      id: projectId,
      name: data.name,
      address: data.address,
      totalFloors: data.totalFloors,
      totalCost: data.totalCost,
      status: 'draft',
      createdAt: new Date().toISOString(),
      households,
      surveyResponses: [],
      progressNodes: initProgressNodes(projectId),
    };

    const newProjects = [...get().projects, newProject];
    set({ projects: newProjects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));

    return projectId;
  },

  updateProjectStatus: (id, status) => {
    const projects = get().projects.map((p) => {
      if (p.id === id) {
        return { ...p, status };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  addSurveyResponse: (projectId, response) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const existingIdx = p.surveyResponses.findIndex(
          (r) => r.householdId === response.householdId
        );
        const newResponse: SurveyResponse = {
          id: generateId(),
          projectId,
          ...response,
          signedAt: new Date().toISOString(),
        };

        let newResponses: SurveyResponse[];
        if (existingIdx >= 0) {
          newResponses = [...p.surveyResponses];
          newResponses[existingIdx] = newResponse;
        } else {
          newResponses = [...p.surveyResponses, newResponse];
        }

        return { ...p, surveyResponses: newResponses };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  updateProgressNode: (projectId, nodeId, data) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const nodes = p.progressNodes.map((n) => {
          if (n.id === nodeId) {
            return { ...n, ...data };
          }
          return n;
        });
        return { ...p, progressNodes: nodes };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  addMediaFile: (projectId, nodeId, file) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const nodes = p.progressNodes.map((n) => {
          if (n.id === nodeId) {
            const newFile: MediaFile = {
              ...file,
              id: generateId(),
              nodeId,
            };
            return { ...n, mediaFiles: [...n.mediaFiles, newFile] };
          }
          return n;
        });
        return { ...p, progressNodes: nodes };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  importHouseholds: (projectId, householdInputs) => {
    let successCount = 0;
    const errors: { rowNumber: number; errors: string[] }[] = [];

    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const newHouseholdsWithIds: Omit<Household, 'shareRatio' | 'shareAmount'>[] = householdInputs.map(
          (h, idx) => ({
            ...h,
            id: `h-${projectId}-import-${idx}-${Date.now()}`,
            projectId,
          })
        );

        successCount = newHouseholdsWithIds.length;

        const existingHouseholds: Omit<Household, 'shareRatio' | 'shareAmount'>[] = p.households.map(
          (h) => ({
            id: h.id,
            projectId: h.projectId,
            floor: h.floor,
            unit: h.unit,
            area: h.area,
            ownerName: h.ownerName,
            phone: h.phone,
          })
        );

        const allHouseholds = [...existingHouseholds, ...newHouseholdsWithIds];

        const recalculatedHouseholds = calculateShareRatio(
          allHouseholds,
          p.totalCost
        );

        return { ...p, households: recalculatedHouseholds };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    return {
      successCount,
      failCount: householdInputs.length - successCount,
      errors,
    };
  },
}));
