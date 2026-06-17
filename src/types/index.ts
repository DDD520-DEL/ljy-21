export type ProjectStatus =
  | 'draft'
  | 'surveying'
  | 'approved'
  | 'planning'
  | 'bidding'
  | 'constructing'
  | 'completed';

export type OpinionType = 'agree' | 'oppose' | 'abstain';

export type NodeStatus = 'pending' | 'in_progress' | 'completed';

export type MediaType = 'photo' | 'file';

export type FeedbackStatus = 'pending' | 'replied' | 'adopted';

export interface Publication {
  id: string;
  projectId: string;
  token: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface Feedback {
  id: string;
  projectId: string;
  publicationId: string;
  content: string;
  contact?: string;
  status: FeedbackStatus;
  reply?: string;
  createdAt: string;
  repliedAt?: string;
}

export interface Household {
  id: string;
  projectId: string;
  floor: number;
  unit: string;
  area: number;
  ownerName: string;
  phone: string;
  shareRatio: number;
  shareAmount: number;
}

export interface SurveyResponse {
  id: string;
  projectId: string;
  householdId: string;
  opinion: OpinionType;
  reason: string;
  signedAt: string;
}

export interface MediaFile {
  id: string;
  nodeId: string;
  type: MediaType;
  name: string;
  url: string;
}

export interface ProgressNode {
  id: string;
  projectId: string;
  stage: string;
  stageKey: 'planning' | 'bidding' | 'constructing' | 'completed';
  description: string;
  date: string;
  status: NodeStatus;
  mediaFiles: MediaFile[];
}

export interface Project {
  id: string;
  name: string;
  address: string;
  totalFloors: number;
  totalCost: number;
  status: ProjectStatus;
  createdAt: string;
  households: Household[];
  surveyResponses: SurveyResponse[];
  progressNodes: ProgressNode[];
  publications: Publication[];
  feedbacks: Feedback[];
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: '草稿',
  surveying: '意见征询中',
  approved: '已立项',
  planning: '方案公示',
  bidding: '施工招标',
  constructing: '施工中',
  completed: '已竣工',
};

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  surveying: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  planning: 'bg-purple-100 text-purple-700',
  bidding: 'bg-indigo-100 text-indigo-700',
  constructing: 'bg-primary-100 text-primary-700',
  completed: 'bg-green-100 text-green-700',
};

export const OPINION_LABEL: Record<OpinionType, string> = {
  agree: '同意',
  oppose: '反对',
  abstain: '弃权',
};

export const OPINION_COLOR: Record<OpinionType, string> = {
  agree: 'bg-green-100 text-green-700 border-green-300',
  oppose: 'bg-red-100 text-red-700 border-red-300',
  abstain: 'bg-slate-100 text-slate-700 border-slate-300',
};

export const NODE_STATUS_LABEL: Record<NodeStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
};

export const STAGE_LIST = [
  { key: 'planning', label: '方案公示', icon: 'FileText' },
  { key: 'bidding', label: '施工招标', icon: 'Gavel' },
  { key: 'constructing', label: '开工建设', icon: 'Hammer' },
  { key: 'completed', label: '竣工验收', icon: 'CheckCircle2' },
] as const;

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: '待处理',
  replied: '已回复',
  adopted: '已采纳',
};

export const FEEDBACK_STATUS_COLOR: Record<FeedbackStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  replied: 'bg-blue-100 text-blue-700 border-blue-300',
  adopted: 'bg-green-100 text-green-700 border-green-300',
};
