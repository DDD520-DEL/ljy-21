import { create } from 'zustand';
import type {
  Project,
  Household,
  SurveyResponse,
  SurveyReminder,
  ProgressNode,
  MediaFile,
  ProjectStatus,
  Publication,
  Feedback,
  FeedbackStatus,
  Notification,
  NotificationType,
  ArchiveStatus,
  OperationLog,
  OperationType,
  FeeObjection,
  FeeObjectionStatus,
  DelayApplication,
  DelayApprovalStatus,
  DailyProgressLog,
  MaterialItem,
} from '@/types';
import { mockProjects } from '@/utils/mockData';
import { STAGE_LIST, PROJECT_STATUS_LABEL } from '@/types';
import { calculateShareRatio } from '@/utils/feeCalculator';

const STORAGE_KEY = 'elevator_projects';
const STORAGE_VERSION_KEY = 'elevator_projects_version';
const NOTIFICATION_STORAGE_KEY = 'elevator_notifications';
const CURRENT_VERSION = 9;

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

  batchRemind: (projectId: string, householdIds: string[]) => { success: number; skipped: number; skippedIds: string[] };
  getHouseholdReminderCount: (projectId: string, householdId: string) => number;
  getHouseholdLastReminder: (projectId: string, householdId: string) => string | null;
  canRemindHousehold: (projectId: string, householdId: string) => boolean;

  updateProgressNode: (projectId: string, nodeId: string, data: Partial<ProgressNode>) => void;
  addMediaFile: (projectId: string, nodeId: string, file: Omit<MediaFile, 'id' | 'nodeId' | 'createdAt'>) => void;
  deleteMediaFile: (projectId: string, nodeId: string, fileId: string) => void;
  deleteMediaFiles: (projectId: string, nodeId: string, fileIds: string[]) => void;
  getNodeMediaFiles: (projectId: string, nodeId: string) => MediaFile[];

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

  checkPendingArchive: () => Project[];
  archiveProject: (projectId: string, operator: string) => void;
  restoreProject: (projectId: string, operator: string, reason?: string) => void;
  addOperationLog: (projectId: string, data: {
    type: OperationType;
    operator: string;
    description: string;
    oldStatus?: string;
    newStatus?: string;
  }) => void;
  getProjectOperationLogs: (projectId: string) => OperationLog[];

  addFeeObjection: (projectId: string, data: {
    householdId: string;
    reason: string;
    requestedAmount?: number;
  }) => FeeObjection | null;
  getProjectFeeObjections: (projectId: string) => FeeObjection[];
  getPendingFeeObjectionCount: (projectId: string) => number;
  handleFeeObjection: (projectId: string, objectionId: string, data: {
    status: FeeObjectionStatus;
    handleReason: string;
    adjustedAmount?: number;
    handler: string;
  }) => void;

  addDelayApplication: (projectId: string, data: {
    nodeId: string;
    stageKey: 'planning' | 'bidding' | 'constructing' | 'completed';
    applicant: string;
    delayDays: number;
    reason: string;
    originalPlannedDate?: string;
  }) => DelayApplication | null;
  getProjectDelayApplications: (projectId: string) => DelayApplication[];
  getNodeDelayApplications: (projectId: string, nodeId: string) => DelayApplication[];
  getTotalApprovedDelayDays: (projectId: string) => number;
  reviewDelayApplication: (projectId: string, applicationId: string, data: {
    status: DelayApprovalStatus;
    approver: string;
    approvalComment?: string;
  }) => void;

  addDailyLog: (projectId: string, nodeId: string, data: {
    contentSummary: string;
    attendanceCount: number;
    materials: MaterialItem[];
  }) => DailyProgressLog | null;
  deleteDailyLog: (projectId: string, nodeId: string, logId: string) => void;
  getNodeDailyLogs: (projectId: string, nodeId: string) => DailyProgressLog[];
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
    dailyLogs: [],
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
          archiveStatus: p.archiveStatus || 'active',
          operationLogs: p.operationLogs || [],
          feeObjections: p.feeObjections || [],
          delayApplications: p.delayApplications || [],
          surveyReminders: p.surveyReminders || [],
          progressNodes: (p.progressNodes || []).map((node: ProgressNode) => ({
            ...node,
            dailyLogs: node.dailyLogs || [],
          })),
        }));
        set({ projects });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      } else if (stored && storedVersion) {
        let projects = JSON.parse(stored);
        
        projects = projects.map((p: Project) => ({
          ...p,
          publications: p.publications || [],
          feedbacks: p.feedbacks || [],
          archiveStatus: p.archiveStatus || 'active',
          operationLogs: p.operationLogs || [],
          feeObjections: p.feeObjections || [],
          delayApplications: p.delayApplications || [],
          progressNodes: (p.progressNodes || []).map((node: ProgressNode) => ({
            ...node,
            mediaFiles: (node.mediaFiles || []).map((file: MediaFile) => ({
              ...file,
              createdAt: file.createdAt || new Date().toISOString(),
            })),
            dailyLogs: node.dailyLogs || [],
          })),
          surveyReminders: p.surveyReminders || [],
        }));
        
        set({ projects });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      } else {
        const migratedProjects = mockProjects.map((p: Project) => ({
          ...p,
          archiveStatus: p.archiveStatus || 'active',
          operationLogs: p.operationLogs || [],
          feeObjections: p.feeObjections || [],
          delayApplications: p.delayApplications || [],
          surveyReminders: p.surveyReminders || [],
          progressNodes: (p.progressNodes || []).map((node: ProgressNode) => ({
            ...node,
            dailyLogs: node.dailyLogs || [],
          })),
        }));
        set({ projects: migratedProjects });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedProjects));
        localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      }

      const storedNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (storedNotifications) {
        set({ notifications: JSON.parse(storedNotifications) });
      }
    } catch {
      const migratedProjects = mockProjects.map((p: Project) => ({
        ...p,
        archiveStatus: p.archiveStatus || 'active',
        operationLogs: p.operationLogs || [],
        progressNodes: (p.progressNodes || []).map((node: ProgressNode) => ({
          ...node,
          dailyLogs: node.dailyLogs || [],
        })),
      }));
      set({ projects: migratedProjects });
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
      archiveStatus: 'active',
      createdAt: new Date().toISOString(),
      households,
      surveyResponses: [],
      surveyReminders: [],
      progressNodes: initProgressNodes(projectId),
      publications: [],
      feedbacks: [],
      feeObjections: [],
      operationLogs: [],
      delayApplications: [],
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
    const now = new Date().toISOString();
    const updates: Partial<Project> = { status };
    
    if (status === 'completed' && !project.completedAt) {
      updates.completedAt = now;
    }

    const projects = get().projects.map((p) => {
      if (p.id === id) {
        return { ...p, ...updates };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    if (oldStatus !== status) {
      get().addOperationLog(id, {
        type: 'status_change',
        operator: '系统',
        description: `项目状态从「${PROJECT_STATUS_LABEL[oldStatus]}」变更为「${PROJECT_STATUS_LABEL[status]}」`,
        oldStatus,
        newStatus: status,
      });

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

  batchRemind: (projectId, householdIds) => {
    const project = get().getProject(projectId);
    if (!project) return { success: 0, skipped: 0, skippedIds: [] };

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const successIds: string[] = [];
    const skippedIds: string[] = [];

    const newReminders: SurveyReminder[] = [];

    for (const householdId of householdIds) {
      const hasResponse = project.surveyResponses.some(
        (r) => r.householdId === householdId
      );
      if (hasResponse) {
        skippedIds.push(householdId);
        continue;
      }

      const lastReminder = project.surveyReminders
        .filter((r) => r.householdId === householdId)
        .sort((a, b) => new Date(b.remindedAt).getTime() - new Date(a.remindedAt).getTime())[0];

      if (lastReminder && new Date(lastReminder.remindedAt) > twentyFourHoursAgo) {
        skippedIds.push(householdId);
        continue;
      }

      const newReminder: SurveyReminder = {
        id: generateId(),
        projectId,
        householdId,
        remindedAt: now.toISOString(),
      };
      newReminders.push(newReminder);
      successIds.push(householdId);
    }

    if (newReminders.length > 0) {
      const projects = get().projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            surveyReminders: [...p.surveyReminders, ...newReminders],
          };
        }
        return p;
      });
      set({ projects });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }

    return {
      success: successIds.length,
      skipped: skippedIds.length,
      skippedIds,
    };
  },

  getHouseholdReminderCount: (projectId, householdId) => {
    const project = get().getProject(projectId);
    if (!project) return 0;
    return project.surveyReminders.filter((r) => r.householdId === householdId).length;
  },

  getHouseholdLastReminder: (projectId, householdId) => {
    const project = get().getProject(projectId);
    if (!project) return null;
    const reminders = project.surveyReminders
      .filter((r) => r.householdId === householdId)
      .sort((a, b) => new Date(b.remindedAt).getTime() - new Date(a.remindedAt).getTime());
    return reminders.length > 0 ? reminders[0].remindedAt : null;
  },

  canRemindHousehold: (projectId, householdId) => {
    const project = get().getProject(projectId);
    if (!project) return false;

    const hasResponse = project.surveyResponses.some(
      (r) => r.householdId === householdId
    );
    if (hasResponse) return false;

    const lastReminder = get().getHouseholdLastReminder(projectId, householdId);
    if (!lastReminder) return true;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return new Date(lastReminder) <= twentyFourHoursAgo;
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
              createdAt: new Date().toISOString(),
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

  deleteMediaFile: (projectId, nodeId, fileId) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const nodes = p.progressNodes.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              mediaFiles: n.mediaFiles.filter((f) => f.id !== fileId),
            };
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

  deleteMediaFiles: (projectId, nodeId, fileIds) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const nodes = p.progressNodes.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              mediaFiles: n.mediaFiles.filter((f) => !fileIds.includes(f.id)),
            };
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

  getNodeMediaFiles: (projectId, nodeId) => {
    const project = get().getProject(projectId);
    if (!project) return [];
    const node = project.progressNodes.find((n) => n.id === nodeId);
    if (!node) return [];
    return [...node.mediaFiles].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

  checkPendingArchive: () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const pendingProjects = get().projects.filter((p) => {
      if (p.status !== 'completed') return false;
      if (p.archiveStatus === 'archived') return false;
      if (!p.completedAt) return false;
      
      const completedDate = new Date(p.completedAt);
      return completedDate <= thirtyDaysAgo;
    });

    const updatedProjects = get().projects.map((p) => {
      const isPending = pendingProjects.some((pp) => pp.id === p.id);
      if (isPending && p.archiveStatus === 'active') {
        return { ...p, archiveStatus: 'pending_archive' as ArchiveStatus };
      }
      return p;
    });

    if (JSON.stringify(updatedProjects) !== JSON.stringify(get().projects)) {
      set({ projects: updatedProjects });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    }

    return pendingProjects;
  },

  archiveProject: (projectId, operator) => {
    const project = get().getProject(projectId);
    if (!project) return;

    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          archiveStatus: 'archived' as ArchiveStatus,
          archivedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    get().addOperationLog(projectId, {
      type: 'archive',
      operator,
      description: `项目已被归档`,
      oldStatus: project.archiveStatus,
      newStatus: 'archived',
    });

    get().addNotification({
      type: 'project_completed',
      projectId,
      projectName: project.name,
      title: '项目已归档',
      description: `${project.name} 已被 ${operator} 归档，将不再显示在首页默认列表中`,
      targetPath: `/projects/${projectId}`,
    });
  },

  restoreProject: (projectId, operator, reason) => {
    const project = get().getProject(projectId);
    if (!project) return;

    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          archiveStatus: 'active' as ArchiveStatus,
          archivedAt: undefined,
        };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    const description = reason 
      ? `项目已从归档状态恢复，恢复原因：${reason}`
      : `项目已从归档状态恢复`;

    get().addOperationLog(projectId, {
      type: 'restore',
      operator,
      description,
      oldStatus: project.archiveStatus,
      newStatus: 'active',
    });

    get().addNotification({
      type: 'project_completed',
      projectId,
      projectName: project.name,
      title: '项目已恢复',
      description: `${project.name} 已被 ${operator} 恢复为活跃状态`,
      targetPath: `/projects/${projectId}`,
    });
  },

  addOperationLog: (projectId, data) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const newLog: OperationLog = {
          id: generateId(),
          projectId,
          ...data,
          createdAt: new Date().toISOString(),
        };
        return {
          ...p,
          operationLogs: [...p.operationLogs, newLog],
        };
      }
      return p;
    });
    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  getProjectOperationLogs: (projectId) => {
    const project = get().getProject(projectId);
    if (!project) return [];
    return [...project.operationLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addFeeObjection: (projectId, data) => {
    const project = get().getProject(projectId);
    if (!project) return null;

    const household = project.households.find((h) => h.id === data.householdId);
    if (!household) return null;

    const newObjection: FeeObjection = {
      id: generateId(),
      projectId,
      householdId: data.householdId,
      householdName: household.ownerName,
      floor: household.floor,
      unit: household.unit,
      originalAmount: household.shareAmount,
      requestedAmount: data.requestedAmount,
      reason: data.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        return { ...p, feeObjections: [...p.feeObjections, newObjection] };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    get().addNotification({
      type: 'fee_updated',
      projectId,
      projectName: project.name,
      title: '新的费用分摊异议',
      description: `${household.floor}层${household.unit} ${household.ownerName} 对分摊金额提出异议`,
      targetPath: `/projects/${projectId}/households`,
    });

    return newObjection;
  },

  getProjectFeeObjections: (projectId) => {
    const project = get().getProject(projectId);
    if (!project) return [];
    return [...project.feeObjections].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getPendingFeeObjectionCount: (projectId) => {
    const project = get().getProject(projectId);
    if (!project) return 0;
    return project.feeObjections.filter((o) => o.status === 'pending').length;
  },

  handleFeeObjection: (projectId, objectionId, data) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const objections = p.feeObjections.map((o) => {
          if (o.id === objectionId) {
            return {
              ...o,
              status: data.status,
              handler: data.handler,
              handleReason: data.handleReason,
              adjustedAmount: data.adjustedAmount,
              handledAt: new Date().toISOString(),
            };
          }
          return o;
        });

        let updatedHouseholds = p.households;
        if (data.status === 'adjusted' && data.adjustedAmount !== undefined) {
          const objection = p.feeObjections.find((o) => o.id === objectionId);
          if (objection) {
            updatedHouseholds = p.households.map((h) => {
              if (h.id === objection.householdId) {
                return { ...h, shareAmount: data.adjustedAmount! };
              }
              return h;
            });
          }
        }

        return { ...p, feeObjections: objections, households: updatedHouseholds };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    const project = get().getProject(projectId);
    const objection = project?.feeObjections.find((o) => o.id === objectionId);
    if (objection && project) {
      get().addNotification({
        type: 'fee_updated',
        projectId,
        projectName: project.name,
        title: '费用异议已处理',
        description: `${objection.floor}层${objection.unit} 的分摊异议已${
          data.status === 'upheld' ? '维持原方案' : '调整金额'
        }`,
        targetPath: `/projects/${projectId}/households`,
      });
    }
  },

  addDelayApplication: (projectId, data) => {
    const project = get().getProject(projectId);
    if (!project) return null;

    const newApplication: DelayApplication = {
      id: generateId(),
      projectId,
      nodeId: data.nodeId,
      stageKey: data.stageKey,
      applicant: data.applicant,
      delayDays: data.delayDays,
      reason: data.reason,
      status: 'pending',
      originalPlannedDate: data.originalPlannedDate,
      createdAt: new Date().toISOString(),
    };

    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        return { ...p, delayApplications: [...p.delayApplications, newApplication] };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    get().addNotification({
      type: 'delay_request',
      projectId,
      projectName: project.name,
      title: '新的工程延期申请',
      description: `${data.applicant} 申请「${project.progressNodes.find(n => n.id === data.nodeId)?.stage}」阶段延期 ${data.delayDays} 天`,
      targetPath: `/projects/${projectId}/progress`,
    });

    return newApplication;
  },

  getProjectDelayApplications: (projectId) => {
    const project = get().getProject(projectId);
    if (!project) return [];
    return [...project.delayApplications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getNodeDelayApplications: (projectId, nodeId) => {
    const project = get().getProject(projectId);
    if (!project) return [];
    return project.delayApplications
      .filter((a) => a.nodeId === nodeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getTotalApprovedDelayDays: (projectId) => {
    const project = get().getProject(projectId);
    if (!project) return 0;
    return project.delayApplications
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + a.delayDays, 0);
  },

  reviewDelayApplication: (projectId, applicationId, data) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const applications = p.delayApplications.map((a) => {
          if (a.id === applicationId) {
            return {
              ...a,
              status: data.status,
              approver: data.approver,
              approvalComment: data.approvalComment,
              approvedAt: new Date().toISOString(),
            };
          }
          return a;
        });
        return { ...p, delayApplications: applications };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    const project = get().getProject(projectId);
    const application = project?.delayApplications.find((a) => a.id === applicationId);
    if (application && project) {
      const notificationType = data.status === 'approved' ? 'delay_approved' : 'delay_rejected';
      const title = data.status === 'approved' ? '延期申请已通过' : '延期申请已驳回';
      const description =
        data.status === 'approved'
          ? `${application.applicant} 申请的「${project.progressNodes.find(n => n.id === application.nodeId)?.stage}」阶段延期 ${application.delayDays} 天已通过审批`
          : `${application.applicant} 申请的「${project.progressNodes.find(n => n.id === application.nodeId)?.stage}」阶段延期 ${application.delayDays} 天已被驳回`;

      get().addNotification({
        type: notificationType,
        projectId,
        projectName: project.name,
        title,
        description,
        targetPath: `/projects/${projectId}/progress`,
      });
    }
  },

  addDailyLog: (projectId, nodeId, data) => {
    const project = get().getProject(projectId);
    if (!project) return null;

    const newLog: DailyProgressLog = {
      id: generateId(),
      nodeId,
      projectId,
      contentSummary: data.contentSummary,
      attendanceCount: data.attendanceCount,
      materials: data.materials,
      createdAt: new Date().toISOString(),
    };

    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const nodes = p.progressNodes.map((n) => {
          if (n.id === nodeId) {
            return { ...n, dailyLogs: [...n.dailyLogs, newLog] };
          }
          return n;
        });
        return { ...p, progressNodes: nodes };
      }
      return p;
    });

    set({ projects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    return newLog;
  },

  deleteDailyLog: (projectId, nodeId, logId) => {
    const projects = get().projects.map((p) => {
      if (p.id === projectId) {
        const nodes = p.progressNodes.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              dailyLogs: n.dailyLogs.filter((l) => l.id !== logId),
            };
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

  getNodeDailyLogs: (projectId, nodeId) => {
    const project = get().getProject(projectId);
    if (!project) return [];
    const node = project.progressNodes.find((n) => n.id === nodeId);
    if (!node) return [];
    const logs = node.dailyLogs || [];
    return [...logs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
}));
