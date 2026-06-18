import { create } from 'zustand';
import type {
  Project,
  Household,
  SurveyResponse,
  ProgressNode,
  MediaFile,
  ProjectStatus,
  Publication,
  Feedback,
  FeedbackStatus,
  Notification,
  NotificationType,
} from '@/types';
import { mockProjects } from '@/utils/mockData';
import { STAGE_LIST, PROJECT_STATUS_LABEL } from '@/types';
import { calculateShareRatio } from '@/utils/feeCalculator';

const STORAGE_KEY = 'elevator_projects';
const STORAGE_VERSION_KEY = 'elevator_projects_version';
const NOTIFICATION_STORAGE_KEY = 'elevator_notifications';
const CURRENT_VERSION = 3;

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
  notifications: Notification[];

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

  createPublication: (projectId: string, data: {
    title: string;
    description: string;
    durationDays: number;
  }) => Publication;
  getPublicationByToken: (token: string) => { publication: Publication; project: Project } | null;
  isPublicationActive: (publication: Publication) => boolean;
  deactivatePublication: (projectId: string, publicationId: string) => void;

  addFeedback: (publicationToken: string, data: {
    content: string;
    contact?: string;
  }) => Feedback | null;
  updateFeedbackStatus: (projectId: string, feedbackId: string, status: FeedbackStatus) => void;
  replyToFeedback: (projectId: string, feedbackId: string, reply: string) => void;
  getProjectFeedbacks: (projectId: string) => Feedback[];

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
}

function generateId(): string {
  return 'id-' + Math.random().toString(36).slice(2, 11);
}

function generateToken(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
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
  notifications: [],

  initProjects: () => {
    try {
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored && storedVersion === String(CURRENT_VERSION)) {
        let projects = JSON.parse(stored);
        projects = projects.map((p: Project) => ({
          ...p,
          publications: p.publications || [],
          feedbacks: p.feedbacks || [],
        }));
        set({ projects });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      } else {
        set({ projects: mockProjects });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProjects));
        localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      }

      const storedNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (storedNotifications) {
        set({ notifications: JSON.parse(storedNotifications) });
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
      publications: [],
      feedbacks: [],
    };

    const newProjects = [...get().projects, newProject];
    set({ projects: newProjects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));

    return projectId;
  },

  updateProjectStatus: (id, status) => {
    const project = get().getProject(id);
    if (!project) return;

    const oldStatus = project.status;
    const projects = get().projects.map((p) => {
      if (p.id === id) {
        return { ...p, status };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    if (oldStatus !== status) {
      let notificationType: NotificationType | null = null;
      let title = '';
      let description = '';
      let targetPath = `/projects/${id}`;

      if (oldStatus === 'surveying' && status === 'approved') {
        notificationType = 'project_approved';
        title = '项目立项审批通过';
        description = `${project.name} 已通过立项审批，可以进入实施阶段`;
        targetPath = `/projects/${id}/progress`;
      } else if (status === 'planning' || status === 'bidding' || status === 'constructing') {
        notificationType = 'stage_progress';
        title = '项目进入新阶段';
        description = `${project.name} 已进入「${PROJECT_STATUS_LABEL[status]}」阶段`;
        targetPath = `/projects/${id}/progress`;
      } else if (status === 'completed') {
        notificationType = 'project_completed';
        title = '项目竣工完成';
        description = `${project.name} 已竣工验收，正式投入使用`;
        targetPath = `/projects/${id}`;
      }

      if (notificationType) {
        get().addNotification({
          type: notificationType,
          projectId: id,
          projectName: project.name,
          title,
          description,
          targetPath,
        });
      }
    }
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

    if (successCount > 0) {
      const project = get().getProject(projectId);
      if (project) {
        get().addNotification({
          type: 'fee_updated',
          projectId,
          projectName: project.name,
          title: '费用分摊方案已更新',
          description: `成功导入 ${successCount} 户住户信息，费用分摊方案已重新计算`,
          targetPath: `/projects/${projectId}/households`,
        });
      }
    }

    return {
      successCount,
      failCount: householdInputs.length - successCount,
      errors,
    };
  },

  createPublication: (projectId, data) => {
    const now = new Date();
    const endTime = new Date(now.getTime() + data.durationDays * 24 * 60 * 60 * 1000);

    const newPublication: Publication = {
      id: generateId(),
      projectId,
      token: generateToken(),
      title: data.title,
      description: data.description,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      isActive: true,
      createdAt: now.toISOString(),
    };

    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        return { ...p, publications: [...p.publications, newPublication] };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    return newPublication;
  },

  getPublicationByToken: (token) => {
    for (const project of get().projects) {
      const publication = project.publications.find((p) => p.token === token);
      if (publication) {
        return { publication, project };
      }
    }
    return null;
  },

  isPublicationActive: (publication) => {
    if (!publication.isActive) return false;
    const now = new Date();
    const endTime = new Date(publication.endTime);
    return now <= endTime;
  },

  deactivatePublication: (projectId, publicationId) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const publications = p.publications.map((pub) => {
          if (pub.id === publicationId) {
            return { ...pub, isActive: false };
          }
          return pub;
        });
        return { ...p, publications };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  addFeedback: (publicationToken, data) => {
    const result = get().getPublicationByToken(publicationToken);
    if (!result) return null;

    const { publication, project } = result;

    if (!get().isPublicationActive(publication)) {
      return null;
    }

    const newFeedback: Feedback = {
      id: generateId(),
      projectId: project.id,
      publicationId: publication.id,
      content: data.content,
      contact: data.contact,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const projects = get().projects.map((p) => {
      if (p.id === project.id) {
        return { ...p, feedbacks: [...p.feedbacks, newFeedback] };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    return newFeedback;
  },

  updateFeedbackStatus: (projectId, feedbackId, status) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const feedbacks = p.feedbacks.map((f) => {
          if (f.id === feedbackId) {
            return { ...f, status };
          }
          return f;
        });
        return { ...p, feedbacks };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  replyToFeedback: (projectId, feedbackId, reply) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const feedbacks = p.feedbacks.map((f) => {
          if (f.id === feedbackId) {
            return {
              ...f,
              reply,
              status: 'replied' as FeedbackStatus,
              repliedAt: new Date().toISOString(),
            };
          }
          return f;
        });
        return { ...p, feedbacks };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  getProjectFeedbacks: (projectId) => {
    const project = get().getProject(projectId);
    if (!project) return [];
    return [...project.feedbacks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      id: generateId(),
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const notifications = [newNotification, ...get().notifications];
    set({ notifications });
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  },

  markNotificationAsRead: (id) => {
    const notifications = get().notifications.map((n) => {
      if (n.id === id) {
        return { ...n, isRead: true };
      }
      return n;
    });
    set({ notifications });
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  },

  markAllNotificationsAsRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications });
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  },

  clearNotifications: () => {
    set({ notifications: [] });
    localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.isRead).length;
  },
}));
