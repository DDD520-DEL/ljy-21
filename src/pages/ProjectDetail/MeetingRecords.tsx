import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  Edit3,
  Trash2,
  X,
  Users,
  FileText,
  CheckSquare,
  MapPin,
  User,
  MessageSquare,
  Vote,
  ChevronDown,
  ChevronUp,
  GanttChart,
  AlertCircle,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import {
  VOTE_RESULT_LABEL,
  VOTE_RESULT_COLOR,
  MEETING_ATTENDEE_ROLE_OPTIONS,
  type MeetingRecord,
  type MeetingAttendee,
  type MeetingResolution,
  type VoteResult,
} from '@/types';

export default function MeetingRecordsPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const addMeetingRecord = useProjectStore((s) => s.addMeetingRecord);
  const updateMeetingRecord = useProjectStore((s) => s.updateMeetingRecord);
  const deleteMeetingRecord = useProjectStore((s) => s.deleteMeetingRecord);
  const getProjectMeetingRecords = useProjectStore((s) => s.getProjectMeetingRecords);

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MeetingRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [meetingDate, setMeetingDate] = useState('');
  const [location, setLocation] = useState('');
  const [host, setHost] = useState('');
  const [attendees, setAttendees] = useState<(Omit<MeetingAttendee, 'id'> & { id?: string })[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [resolutions, setResolutions] = useState<(Omit<MeetingResolution, 'id'> & { id?: string })[]>([]);
  const [notes, setNotes] = useState('');

  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeRole, setNewAttendeeRole] = useState('');
  const [newAttendeeFloor, setNewAttendeeFloor] = useState('');
  const [newAttendeeUnit, setNewAttendeeUnit] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newResolutionContent, setNewResolutionContent] = useState('');
  const [newResolutionVoteResult, setNewResolutionVoteResult] = useState<VoteResult>('pending');
  const [newResolutionAgree, setNewResolutionAgree] = useState('');
  const [newResolutionOppose, setNewResolutionOppose] = useState('');
  const [newResolutionAbstain, setNewResolutionAbstain] = useState('');
  const [newResolutionRemarks, setNewResolutionRemarks] = useState('');
  const [newResolutionNodeIds, setNewResolutionNodeIds] = useState<string[]>([]);

  const meetingRecords = useMemo(() => {
    if (!id) return [];
    return getProjectMeetingRecords(id);
  }, [id, getProjectMeetingRecords]);

  const progressNodes = useMemo(() => {
    return project?.progressNodes || [];
  }, [project]);

  const openAddModal = () => {
    setEditingRecord(null);
    setMeetingDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setHost('');
    setAttendees([]);
    setTopics([]);
    setResolutions([]);
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (record: MeetingRecord) => {
    setEditingRecord(record);
    setMeetingDate(record.meetingDate);
    setLocation(record.location);
    setHost(record.host);
    setAttendees(record.attendees.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      floor: a.floor,
      unit: a.unit,
    })));
    setTopics([...record.topics]);
    setResolutions(
      record.resolutions.map((r) => ({
        id: r.id,
        content: r.content,
        voteResult: r.voteResult,
        agreeCount: r.agreeCount,
        opposeCount: r.opposeCount,
        abstainCount: r.abstainCount,
        relatedNodeIds: [...r.relatedNodeIds],
        remarks: r.remarks,
      }))
    );
    setNotes(record.notes || '');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!id || !meetingDate || !location || !host) return;

    if (editingRecord) {
      updateMeetingRecord(id, editingRecord.id, {
        meetingDate,
        location,
        host,
        attendees,
        topics,
        resolutions,
        notes,
      });
    } else {
      addMeetingRecord(id, {
        meetingDate,
        location,
        host,
        attendees,
        topics,
        resolutions,
        notes,
      });
    }

    setShowModal(false);
    setEditingRecord(null);
  };

  const handleDelete = (recordId: string) => {
    setDeleteTargetId(recordId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!id || !deleteTargetId) return;
    deleteMeetingRecord(id, deleteTargetId);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    if (expandedId === deleteTargetId) {
      setExpandedId(null);
    }
  };

  const addAttendee = () => {
    if (!newAttendeeName.trim()) return;
    setAttendees([
      ...attendees,
      {
        name: newAttendeeName.trim(),
        role: newAttendeeRole || undefined,
        floor: newAttendeeFloor ? parseInt(newAttendeeFloor) : undefined,
        unit: newAttendeeUnit || undefined,
      },
    ]);
    setNewAttendeeName('');
    setNewAttendeeRole('');
    setNewAttendeeFloor('');
    setNewAttendeeUnit('');
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const addTopic = () => {
    if (!newTopic.trim()) return;
    setTopics([...topics, newTopic.trim()]);
    setNewTopic('');
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const addResolution = () => {
    if (!newResolutionContent.trim()) return;
    setResolutions([
      ...resolutions,
      {
        content: newResolutionContent.trim(),
        voteResult: newResolutionVoteResult,
        agreeCount: newResolutionAgree ? parseInt(newResolutionAgree) : undefined,
        opposeCount: newResolutionOppose ? parseInt(newResolutionOppose) : undefined,
        abstainCount: newResolutionAbstain ? parseInt(newResolutionAbstain) : undefined,
        relatedNodeIds: [...newResolutionNodeIds],
        remarks: newResolutionRemarks || undefined,
      },
    ]);
    setNewResolutionContent('');
    setNewResolutionVoteResult('pending');
    setNewResolutionAgree('');
    setNewResolutionOppose('');
    setNewResolutionAbstain('');
    setNewResolutionRemarks('');
    setNewResolutionNodeIds([]);
  };

  const removeResolution = (index: number) => {
    setResolutions(resolutions.filter((_, i) => i !== index));
  };

  const toggleNodeSelection = (nodeId: string) => {
    if (newResolutionNodeIds.includes(nodeId)) {
      setNewResolutionNodeIds(newResolutionNodeIds.filter((nid) => nid !== nodeId));
    } else {
      setNewResolutionNodeIds([...newResolutionNodeIds, nodeId]);
    }
  };

  const getNodeLabel = (nodeId: string) => {
    const node = progressNodes.find((n) => n.id === nodeId);
    return node ? node.stage : '';
  };

  const getRoleLabel = (roleValue: string) => {
    const option = MEETING_ATTENDEE_ROLE_OPTIONS.find((o) => o.value === roleValue);
    return option ? option.label : roleValue;
  };

  if (!project) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-800">
                邻里协调会议记录
              </h2>
              <p className="text-sm text-slate-500">
                共 {meetingRecords.length} 次会议记录
              </p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增会议记录
          </button>
        </div>

        {meetingRecords.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium">暂无会议记录</p>
            <p className="text-sm text-slate-500 mt-1">
              点击「新增会议记录」开始记录第一次协调会议
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetingRecords.map((record) => (
              <div
                key={record.id}
                className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors"
              >
                <div
                  className="bg-slate-50 px-5 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === record.id ? null : record.id)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {new Date(record.meetingDate).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long',
                          })}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {record.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            主持人：{record.host}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {record.attendees.length} 人参会
                          </span>
                          <span className="flex items-center gap-1">
                            <Vote className="w-3.5 h-3.5" />
                            {record.resolutions.length} 项决议
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(record);
                        }}
                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(record.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedId === record.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedId === record.id && (
                  <div className="p-5 border-t border-slate-200 space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-600" />
                        参会人员
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {record.attendees.map((attendee) => (
                          <div
                            key={attendee.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm"
                          >
                            <span className="font-medium text-slate-700">
                              {attendee.name}
                            </span>
                            {attendee.role && (
                              <span className="text-slate-500">
                                （{getRoleLabel(attendee.role)}）
                              </span>
                            )}
                            {attendee.floor && attendee.unit && (
                              <span className="text-slate-500">
                                {attendee.floor}层{attendee.unit}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary-600" />
                        讨论议题
                      </h4>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <ol className="list-decimal list-inside space-y-2 text-slate-700">
                          {record.topics.map((topic, index) => (
                            <li key={index}>{topic}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Vote className="w-4 h-4 text-primary-600" />
                        表决决议
                      </h4>
                      <div className="space-y-3">
                        {record.resolutions.map((resolution) => (
                          <div
                            key={resolution.id}
                            className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-slate-800 mb-2">
                                  {resolution.content}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${VOTE_RESULT_COLOR[resolution.voteResult]}`}
                                  >
                                    {VOTE_RESULT_LABEL[resolution.voteResult]}
                                  </span>
                                  {(resolution.agreeCount !== undefined ||
                                    resolution.opposeCount !== undefined ||
                                    resolution.abstainCount !== undefined) && (
                                    <span className="text-slate-500">
                                      赞成 {resolution.agreeCount || 0}票 / 
                                      反对 {resolution.opposeCount || 0}票 / 
                                      弃权 {resolution.abstainCount || 0}票
                                    </span>
                                  )}
                                </div>
                                {resolution.remarks && (
                                  <p className="text-sm text-slate-500 mt-2">
                                    备注：{resolution.remarks}
                                  </p>
                                )}
                                {resolution.relatedNodeIds.length > 0 && (
                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <GanttChart className="w-3.5 h-3.5" />
                                      关联进度：
                                    </span>
                                    {resolution.relatedNodeIds.map((nodeId) => (
                                      <span
                                        key={nodeId}
                                        className="inline-flex items-center px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium"
                                      >
                                        {getNodeLabel(nodeId)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {record.notes && (
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-600" />
                          会议备注
                        </h4>
                        <div className="bg-slate-50 rounded-lg p-4 text-slate-700 whitespace-pre-wrap">
                          {record.notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingRecord ? '编辑会议记录' : '新增会议记录'}
                  </h3>
                  <p className="text-sm text-slate-500">{project.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRecord(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    会议日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    会议地点 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-field"
                    placeholder="请输入会议地点"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    主持人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="input-field"
                    placeholder="请输入主持人姓名"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-600" />
                  参会人员
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {attendees.map((attendee, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        {attendee.name}
                      </span>
                      {attendee.role && (
                        <span className="text-slate-500">
                          （{getRoleLabel(attendee.role)}）
                        </span>
                      )}
                      {attendee.floor && attendee.unit && (
                        <span className="text-slate-500">
                          {attendee.floor}层{attendee.unit}
                        </span>
                      )}
                      <button
                        onClick={() => removeAttendee(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs text-slate-500 mb-1">姓名</label>
                    <input
                      type="text"
                      value={newAttendeeName}
                      onChange={(e) => setNewAttendeeName(e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="姓名"
                      onKeyDown={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addAttendee())
                      }
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs text-slate-500 mb-1">身份</label>
                    <select
                      value={newAttendeeRole}
                      onChange={(e) => setNewAttendeeRole(e.target.value)}
                      className="input-field !py-2 text-sm"
                    >
                      <option value="">选择身份</option>
                      {MEETING_ATTENDEE_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-16">
                    <label className="block text-xs text-slate-500 mb-1">楼层</label>
                    <input
                      type="number"
                      value={newAttendeeFloor}
                      onChange={(e) => setNewAttendeeFloor(e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="楼层"
                    />
                  </div>
                  <div className="w-16">
                    <label className="block text-xs text-slate-500 mb-1">室号</label>
                    <input
                      type="text"
                      value={newAttendeeUnit}
                      onChange={(e) => setNewAttendeeUnit(e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="室号"
                    />
                  </div>
                  <button onClick={addAttendee} className="btn-secondary !py-2 text-sm">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-600" />
                  讨论议题
                </label>
                <div className="space-y-2 mb-3">
                  {topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm font-medium w-6">
                        {index + 1}.
                      </span>
                      <span className="flex-1 text-slate-700 text-sm">{topic}</span>
                      <button
                        onClick={() => removeTopic(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="input-field flex-1"
                    placeholder="请输入议题内容"
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addTopic())
                    }
                  />
                  <button onClick={addTopic} className="btn-secondary">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Vote className="w-4 h-4 text-primary-600" />
                  表决决议
                </label>
                <div className="space-y-3 mb-4">
                  {resolutions.map((resolution, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-lg p-4 relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm mb-2">
                            {resolution.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium border ${VOTE_RESULT_COLOR[resolution.voteResult]}`}
                            >
                              {VOTE_RESULT_LABEL[resolution.voteResult]}
                            </span>
                            {(resolution.agreeCount !== undefined ||
                              resolution.opposeCount !== undefined ||
                              resolution.abstainCount !== undefined) && (
                              <span className="text-slate-500">
                                赞成{resolution.agreeCount || 0} / 反对
                                {resolution.opposeCount || 0} / 弃权
                                {resolution.abstainCount || 0}
                              </span>
                            )}
                          </div>
                          {resolution.relatedNodeIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                              <span className="text-xs text-slate-500">关联：</span>
                              {resolution.relatedNodeIds.map((nodeId) => (
                                <span
                                  key={nodeId}
                                  className="inline-flex items-center px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-xs"
                                >
                                  {getNodeLabel(nodeId)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeResolution(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      决议内容
                    </label>
                    <input
                      type="text"
                      value={newResolutionContent}
                      onChange={(e) => setNewResolutionContent(e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="请输入决议内容"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        表决结果
                      </label>
                      <select
                        value={newResolutionVoteResult}
                        onChange={(e) =>
                          setNewResolutionVoteResult(e.target.value as VoteResult)
                        }
                        className="input-field !py-2 text-sm"
                      >
                        <option value="pending">待表决</option>
                        <option value="passed">表决通过</option>
                        <option value="rejected">表决未通过</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        赞成票数
                      </label>
                      <input
                        type="number"
                        value={newResolutionAgree}
                        onChange={(e) => setNewResolutionAgree(e.target.value)}
                        className="input-field !py-2 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        反对票数
                      </label>
                      <input
                        type="number"
                        value={newResolutionOppose}
                        onChange={(e) => setNewResolutionOppose(e.target.value)}
                        className="input-field !py-2 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        弃权票数
                      </label>
                      <input
                        type="number"
                        value={newResolutionAbstain}
                        onChange={(e) => setNewResolutionAbstain(e.target.value)}
                        className="input-field !py-2 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      <CheckSquare className="w-3.5 h-3.5 inline mr-1" />
                      关联进度节点
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {progressNodes.map((node) => (
                        <label
                          key={node.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                            newResolutionNodeIds.includes(node.id)
                              ? 'bg-primary-100 text-primary-700 border border-primary-300'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={newResolutionNodeIds.includes(node.id)}
                            onChange={() => toggleNodeSelection(node.id)}
                            className="sr-only"
                          />
                          <span>{node.stage}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      备注（可选）
                    </label>
                    <input
                      type="text"
                      value={newResolutionRemarks}
                      onChange={(e) => setNewResolutionRemarks(e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="请输入备注信息"
                    />
                  </div>
                  <button
                    onClick={addResolution}
                    className="btn-secondary w-full justify-center text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加决议
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  会议备注（可选）
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="请输入会议备注或其他需要记录的信息..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRecord(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!meetingDate || !location || !host}
                className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckSquare className="w-4 h-4" />
                {editingRecord ? '保存修改' : '创建记录'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">确认删除会议记录</h3>
                <p className="text-sm text-slate-500">删除后将无法恢复</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    确定要删除这条会议记录吗？
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    删除后，该会议的所有信息（包括参会人员、议题、决议等）都将被永久删除。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="btn-danger inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
