export type ProjectStatus =
  | 'draft'
  | 'surveying'
  | 'approved'
  | 'planning'
  | 'bidding'
  | 'constructing'
  | 'completed';

export type ArchiveStatus = 'active' | 'pending_archive' | 'archived';

export type OperationType = 'archive' | 'restore' | 'status_change';

export type OpinionType = 'agree' | 'oppose' | 'abstain';

export type NodeStatus = 'pending' | 'in_progress' | 'completed';

export type MediaType = 'photo' | 'file';

export type FeedbackStatus = 'pending' | 'replied' | 'adopted';

export type FeeObjectionStatus = 'pending' | 'upheld' | 'adjusted';

export type DelayApprovalStatus = 'pending' | 'approved' | 'rejected';

export type NotificationType =
  | 'project_approved'
  | 'stage_progress'
  | 'fee_updated'
  | 'project_completed'
  | 'delay_request'
  | 'delay_approved'
  | 'delay_rejected';

export interface DelayApplication {
  id: string;
  projectId: string;
  nodeId: string;
  stageKey: 'planning' | 'bidding' | 'constructing' | 'completed';
  applicant: string;
  delayDays: number;
  reason: string;
  status: DelayApprovalStatus;
  originalPlannedDate?: string;
  approver?: string;
  approvalComment?: string;
  approvedAt?: string;
  createdAt: string;
}


export interface OperationLog {
  id: string;
  projectId: string;
  type: OperationType;
  operator: string;
  description: string;
  oldStatus?: string;
  newStatus?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  targetPath: string;
}

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

export interface FeeObjection {
  id: string;
  projectId: string;
  householdId: string;
  householdName: string;
  floor: number;
  unit: string;
  originalAmount: number;
  requestedAmount?: number;
  reason: string;
  status: FeeObjectionStatus;
  handler?: string;
  handleReason?: string;
  adjustedAmount?: number;
  createdAt: string;
  handledAt?: string;
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
  familyPopulation: number;
}

export interface SurveyResponse {
  id: string;
  projectId: string;
  householdId: string;
  opinion: OpinionType;
  reason: string;
  signedAt: string;
}

export interface SurveyReminder {
  id: string;
  projectId: string;
  householdId: string;
  remindedAt: string;
}

export interface MediaFile {
  id: string;
  nodeId: string;
  type: MediaType;
  name: string;
  url: string;
  createdAt: string;
}

export interface MaterialItem {
  name: string;
  quantity: string;
  unit?: string;
}

export interface DailyProgressLog {
  id: string;
  nodeId: string;
  projectId: string;
  contentSummary: string;
  attendanceCount: number;
  materials: MaterialItem[];
  createdAt: string;
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
  dailyLogs: DailyProgressLog[];
}

export interface Project {
  id: string;
  name: string;
  address: string;
  totalFloors: number;
  totalCost: number;
  status: ProjectStatus;
  archiveStatus: ArchiveStatus;
  createdAt: string;
  completedAt?: string;
  archivedAt?: string;
  households: Household[];
  surveyResponses: SurveyResponse[];
  surveyReminders: SurveyReminder[];
  progressNodes: ProgressNode[];
  publications: Publication[];
  feedbacks: Feedback[];
  feeObjections: FeeObjection[];
  operationLogs: OperationLog[];
  delayApplications: DelayApplication[];
  fundRecords?: FundRecord[];
  repairOrders?: RepairOrder[];
  elevatorArchives?: ElevatorArchive[];
  maintenanceRecords?: MaintenanceRecord[];
  elevatorConvention?: ElevatorConvention;
  conventionReadRecords?: ConventionReadRecord[];
  adContracts?: AdContract[];
  meetingRecords?: MeetingRecord[];
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

export const FEE_OBJECTION_STATUS_LABEL: Record<FeeObjectionStatus, string> = {
  pending: '待处理',
  upheld: '维持原方案',
  adjusted: '已调整',
};

export const FEE_OBJECTION_STATUS_COLOR: Record<FeeObjectionStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  upheld: 'bg-slate-100 text-slate-700 border-slate-300',
  adjusted: 'bg-green-100 text-green-700 border-green-300',
};

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  project_approved: '立项审批',
  stage_progress: '施工进度',
  fee_updated: '费用更新',
  project_completed: '项目竣工',
  delay_request: '延期申请',
  delay_approved: '延期审批通过',
  delay_rejected: '延期审批驳回',
};

export const NOTIFICATION_TYPE_COLOR: Record<NotificationType, string> = {
  project_approved: 'bg-blue-100 text-blue-700',
  stage_progress: 'bg-primary-100 text-primary-700',
  fee_updated: 'bg-amber-100 text-amber-700',
  project_completed: 'bg-green-100 text-green-700',
  delay_request: 'bg-orange-100 text-orange-700',
  delay_approved: 'bg-green-100 text-green-700',
  delay_rejected: 'bg-red-100 text-red-700',
};

export const DELAY_APPROVAL_STATUS_LABEL: Record<DelayApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
};

export const DELAY_APPROVAL_STATUS_COLOR: Record<DelayApprovalStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
};

export const TOTAL_DELAY_WARNING_THRESHOLD = 60;

export const ARCHIVE_STATUS_LABEL: Record<ArchiveStatus, string> = {
  active: '活跃',
  pending_archive: '待归档',
  archived: '已归档',
};

export const ARCHIVE_STATUS_COLOR: Record<ArchiveStatus, string> = {
  active: 'bg-green-100 text-green-700',
  pending_archive: 'bg-amber-100 text-amber-700',
  archived: 'bg-slate-300 text-slate-700',
};

export const OPERATION_TYPE_LABEL: Record<OperationType, string> = {
  archive: '项目归档',
  restore: '项目恢复',
  status_change: '状态变更',
};

export interface ElevatorBrand {
  id: string;
  name: string;
  country: string;
  description: string;
  logoUrl?: string;
  models: ElevatorModel[];
  createdAt: string;
  updatedAt: string;
}

export interface ElevatorModel {
  id: string;
  brandId: string;
  modelName: string;
  ratedLoad: number;
  ratedSpeed: number;
  minFloors: number;
  maxFloors: number;
  priceMin: number;
  priceMax: number;
  features: string[];
  remarks?: string;
}

export const ELEVATOR_RATED_LOAD_OPTIONS = [
  { value: 400, label: '400kg（4人）' },
  { value: 630, label: '630kg（8人）' },
  { value: 800, label: '800kg（10人）' },
  { value: 1000, label: '1000kg（13人）' },
  { value: 1250, label: '1250kg（16人）' },
  { value: 1600, label: '1600kg（21人）' },
];

export const ELEVATOR_RATED_SPEED_OPTIONS = [
  { value: 1.0, label: '1.0 m/s' },
  { value: 1.5, label: '1.5 m/s' },
  { value: 1.6, label: '1.6 m/s' },
  { value: 1.75, label: '1.75 m/s' },
  { value: 2.0, label: '2.0 m/s' },
  { value: 2.5, label: '2.5 m/s' },
];

export type PolicyLevel = 'national' | 'province' | 'city' | 'district';

export const POLICY_LEVEL_LABEL: Record<PolicyLevel, string> = {
  national: '国家级',
  province: '省级',
  city: '市级',
  district: '区县级',
};

export const POLICY_LEVEL_COLOR: Record<PolicyLevel, string> = {
  national: 'bg-red-100 text-red-700 border-red-200',
  province: 'bg-purple-100 text-purple-700 border-purple-200',
  city: 'bg-blue-100 text-blue-700 border-blue-200',
  district: 'bg-green-100 text-green-700 border-green-200',
};

export interface SubsidyMaterial {
  name: string;
  description?: string;
  required: boolean;
}

export interface SubsidyPolicy {
  id: string;
  title: string;
  level: PolicyLevel;
  province: string;
  city: string;
  district?: string;
  subsidyStandard: string;
  subsidyAmount?: {
    min: number;
    max: number;
    unit: string;
  };
  applicationConditions: string[];
  requiredMaterials: SubsidyMaterial[];
  sourceUrl: string;
  sourceName: string;
  effectiveDate: string;
  expiryDate?: string;
  issuingDepartment: string;
  documentNumber?: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export type FundRecordType = 'income' | 'expense';

export interface FundRecord {
  id: string;
  projectId: string;
  type: FundRecordType;
  category: string;
  amount: number;
  handler: string;
  occurrenceDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyFundSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  records: FundRecord[];
}

export const FUND_RECORD_TYPE_LABEL: Record<FundRecordType, string> = {
  income: '收入',
  expense: '支出',
};

export const FUND_RECORD_TYPE_COLOR: Record<FundRecordType, string> = {
  income: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
};

export const FUND_INCOME_CATEGORIES = [
  '业主集资',
  '政府补贴',
  '社会捐赠',
  '其他收入',
];

export const FUND_EXPENSE_CATEGORIES = [
  '设计费用',
  '施工费用',
  '设备采购',
  '监理费用',
  '审批费用',
  '其他支出',
];

export type RepairOrderStatus = 'pending' | 'processing' | 'completed';

export type FaultType =
  | 'door_fault'
  | 'lift_stuck'
  | 'button_fault'
  | 'light_fault'
  | 'noise'
  | 'other';

export interface RepairPhoto {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
  uploader: string;
}

export interface RepairOrder {
  id: string;
  orderNo: string;
  projectId: string;
  faultType: FaultType;
  location: string;
  description: string;
  reporterName: string;
  reporterPhone: string;
  status: RepairOrderStatus;
  assignee?: string;
  repairNote?: string;
  completedPhotos: RepairPhoto[];
  createdAt: string;
  processingAt?: string;
  completedAt?: string;
}

export const FAULT_TYPE_LABEL: Record<FaultType, string> = {
  door_fault: '门机故障',
  lift_stuck: '电梯困人',
  button_fault: '按钮故障',
  light_fault: '照明故障',
  noise: '运行异响',
  other: '其他故障',
};

export const REPAIR_STATUS_LABEL: Record<RepairOrderStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已修复',
};

export const REPAIR_STATUS_COLOR: Record<RepairOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  processing: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
};

export const FAULT_TYPE_OPTIONS: { value: FaultType; label: string }[] = [
  { value: 'door_fault', label: '门机故障（开关门异常）' },
  { value: 'lift_stuck', label: '电梯困人（停运故障）' },
  { value: 'button_fault', label: '按钮故障（楼层/开关）' },
  { value: 'light_fault', label: '照明故障（轿厢/按钮灯）' },
  { value: 'noise', label: '运行异响（异常噪音）' },
  { value: 'other', label: '其他故障' },
];

export interface ReplacementPart {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  specification?: string;
}

export interface MaintenanceRecord {
  id: string;
  projectId: string;
  maintenanceDate: string;
  maintenanceCompany: string;
  maintenanceContent: string;
  replacementParts: ReplacementPart[];
  technician: string;
  nextMaintenanceDate: string;
  remarks?: string;
  createdAt: string;
}

export interface ElevatorArchive {
  id: string;
  projectId: string;
  elevatorNo: string;
  brand: string;
  model: string;
  installationDate: string;
  acceptanceDate: string;
  maintenanceIntervalMonths: number;
  createdAt: string;
}

export const MAINTENANCE_INTERVAL_OPTIONS = [
  { value: 1, label: '每月一次' },
  { value: 3, label: '每季度一次' },
  { value: 6, label: '每半年一次' },
  { value: 12, label: '每年一次' },
];

export const DEFAULT_MAINTENANCE_INTERVAL = 3;

export interface ElevatorConvention {
  id: string;
  projectId: string;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConventionReadRecord {
  id: string;
  projectId: string;
  conventionId: string;
  householdId: string;
  householdName: string;
  floor: number;
  unit: string;
  confirmedAt: string;
}

export const ELEVATOR_CONVENTION_DEFAULT_TITLE = '电梯使用公约';

export interface AdContract {
  id: string;
  projectId: string;
  customerName: string;
  contractAmount: number;
  startDate: string;
  endDate: string;
  adPosition: string;
  contactPerson?: string;
  contactPhone?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdAdShare {
  householdId: string;
  householdName: string;
  floor: number;
  unit: string;
  area: number;
  shareRatio: number;
  shareAmount: number;
  contractBreakdown: {
    contractId: string;
    customerName: string;
    contractAmount: number;
    yearlyAllocation: number;
    shareAmount: number;
  }[];
}

export interface YearlyAdRevenueSummary {
  year: number;
  totalRevenue: number;
  contractCount: number;
  contracts: AdContract[];
  householdShares: HouseholdAdShare[];
}

export const AD_POSITION_OPTIONS = [
  { value: 'elevator_inner_wall', label: '电梯轿厢内壁' },
  { value: 'elevator_door', label: '电梯门' },
  { value: 'elevator_ceiling', label: '电梯天花板' },
  { value: 'elevator_floor', label: '电梯地面' },
  { value: 'elevator_screen', label: '电梯电子屏' },
  { value: 'other', label: '其他位置' },
];

export type VoteResult = 'passed' | 'rejected' | 'pending';

export interface MeetingAttendee {
  id: string;
  name: string;
  floor?: number;
  unit?: string;
  role?: string;
}

export interface MeetingResolution {
  id: string;
  content: string;
  voteResult: VoteResult;
  agreeCount?: number;
  opposeCount?: number;
  abstainCount?: number;
  relatedNodeIds: string[];
  remarks?: string;
}

export interface MeetingRecord {
  id: string;
  projectId: string;
  meetingDate: string;
  location: string;
  host: string;
  attendees: MeetingAttendee[];
  topics: string[];
  resolutions: MeetingResolution[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const VOTE_RESULT_LABEL: Record<VoteResult, string> = {
  passed: '表决通过',
  rejected: '表决未通过',
  pending: '待表决',
};

export const VOTE_RESULT_COLOR: Record<VoteResult, string> = {
  passed: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
};

export const MEETING_ATTENDEE_ROLE_OPTIONS = [
  { value: 'owner_rep', label: '业主代表' },
  { value: 'community_staff', label: '社区工作人员' },
  { value: 'construction', label: '施工方代表' },
  { value: 'design', label: '设计方代表' },
  { value: 'supervision', label: '监理方代表' },
  { value: 'property', label: '物业代表' },
  { value: 'other', label: '其他' },
];
