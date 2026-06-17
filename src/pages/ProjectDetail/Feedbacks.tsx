import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Reply,
  ThumbsUp,
  Copy,
  Link,
  Plus,
  X,
  Calendar,
  User,
  EyeOff,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { FEEDBACK_STATUS_LABEL, FEEDBACK_STATUS_COLOR } from '@/types';
import type { Feedback, FeedbackStatus } from '@/types';

export default function FeedbacksPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.getProject(id || ''));
  const getProjectFeedbacks = useProjectStore((s) => s.getProjectFeedbacks);
  const replyToFeedback = useProjectStore((s) => s.replyToFeedback);
  const updateFeedbackStatus = useProjectStore((s) => s.updateFeedbackStatus);
  const createPublication = useProjectStore((s) => s.createPublication);
  const isPublicationActive = useProjectStore((s) => s.isPublicationActive);

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publicationTitle, setPublicationTitle] = useState('电梯加装方案公示');
  const [publicationDesc, setPublicationDesc] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const feedbacks = getProjectFeedbacks(project.id);
  const activePublication = project.publications.find((p) => isPublicationActive(p));
  const latestPublication = [...project.publications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleReply = (feedbackId: string) => {
    if (!replyContent.trim()) return;
    replyToFeedback(project.id, feedbackId, replyContent.trim());
    setReplyingId(null);
    setReplyContent('');
  };

  const handleMarkAdopted = (feedbackId: string) => {
    updateFeedbackStatus(project.id, feedbackId, 'adopted');
  };

  const handleCreatePublication = () => {
    if (!publicationTitle.trim() || !publicationDesc.trim()) return;
    createPublication(project.id, {
      title: publicationTitle.trim(),
      description: publicationDesc.trim(),
      durationDays,
    });
    setShowCreateModal(false);
    setPublicationTitle('电梯加装方案公示');
    setPublicationDesc('');
    setDurationDays(7);
  };

  const copyPublicationLink = (token: string) => {
    const link = `${window.location.origin}/publication/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPublicationUrl = (token: string) => {
    return `${window.location.origin}/publication/${token}`;
  };

  const getRemainingDays = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter((f) => f.status === 'pending').length,
    replied: feedbacks.filter((f) => f.status === 'replied').length,
    adopted: feedbacks.filter((f) => f.status === 'adopted').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {project.status === 'planning' && (
        <div className="card p-6 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Link className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">方案公示链接</h3>
                {activePublication ? (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">
                      公示进行中，剩余 <span className="font-semibold text-purple-600">{getRemainingDays(activePublication.endTime)}</span> 天
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-100 px-3 py-2 rounded-lg text-sm text-slate-700 font-mono break-all">
                        {getPublicationUrl(activePublication.token)}
                      </code>
                      <button
                        onClick={() => copyPublicationLink(activePublication.token)}
                        className="btn btn-secondary inline-flex items-center gap-1.5 flex-shrink-0"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            复制链接
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      公示期：{formatDateShort(activePublication.startTime)} ~ {formatDateShort(activePublication.endTime)}
                    </p>
                  </div>
                ) : latestPublication ? (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">
                      暂无进行中的公示，上一期公示已于 {formatDateShort(latestPublication.endTime)} 结束
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      创建新公示
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">
                      方案已完成，创建公示链接向居民征求意见
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      创建公示
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500 mb-1">总反馈数</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-sm text-slate-500 mb-1">待处理</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
            <Reply className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-slate-500 mb-1">已回复</p>
          <p className="text-2xl font-bold text-blue-600">{stats.replied}</p>
        </div>
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
            <ThumbsUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-slate-500 mb-1">已采纳</p>
          <p className="text-2xl font-bold text-green-600">{stats.adopted}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg font-bold text-slate-800">
            反馈列表
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            按时间倒序排列
          </div>
        </div>

        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-2">暂无反馈</p>
            <p className="text-sm text-slate-400">
              公示链接发布后，居民可以通过链接提交意见和建议
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback, index) => (
              <FeedbackItem
                key={feedback.id}
                feedback={feedback}
                formatDate={formatDate}
                replyingId={replyingId}
                replyContent={replyContent}
                onReplyStart={(id) => {
                  setReplyingId(id);
                  setReplyContent('');
                }}
                onReplyCancel={() => {
                  setReplyingId(null);
                  setReplyContent('');
                }}
                onReplyContentChange={setReplyContent}
                onReplySubmit={handleReply}
                onMarkAdopted={handleMarkAdopted}
                animationDelay={index * 50}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">创建公示</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  公示标题
                </label>
                <input
                  type="text"
                  value={publicationTitle}
                  onChange={(e) => setPublicationTitle(e.target.value)}
                  className="input"
                  placeholder="请输入公示标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  公示说明
                </label>
                <textarea
                  value={publicationDesc}
                  onChange={(e) => setPublicationDesc(e.target.value)}
                  rows={4}
                  className="input"
                  placeholder="请输入公示说明，介绍方案内容和征求意见的目的"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  公示时长（天）
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="input"
                >
                  <option value={3}>3 天</option>
                  <option value={7}>7 天</option>
                  <option value={10}>10 天</option>
                  <option value={15}>15 天</option>
                  <option value={30}>30 天</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    公示将从今日开始，持续 {durationDays} 天，至{' '}
                    {formatDateShort(
                      new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
                    )}{' '}
                    截止
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleCreatePublication}
                disabled={!publicationTitle.trim() || !publicationDesc.trim()}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建公示
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FeedbackItemProps {
  feedback: Feedback;
  formatDate: (dateStr: string) => string;
  replyingId: string | null;
  replyContent: string;
  onReplyStart: (id: string) => void;
  onReplyCancel: () => void;
  onReplyContentChange: (content: string) => void;
  onReplySubmit: (id: string) => void;
  onMarkAdopted: (id: string) => void;
  animationDelay: number;
}

function FeedbackItem({
  feedback,
  formatDate,
  replyingId,
  replyContent,
  onReplyStart,
  onReplyCancel,
  onReplyContentChange,
  onReplySubmit,
  onMarkAdopted,
  animationDelay,
}: FeedbackItemProps) {
  return (
    <div
      className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors animate-slide-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${FEEDBACK_STATUS_COLOR[feedback.status]}`}
          >
            {FEEDBACK_STATUS_LABEL[feedback.status]}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(feedback.createdAt)}
          </span>
          {feedback.contact && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              {feedback.contact}
            </span>
          )}
          {!feedback.contact && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              匿名
            </span>
          )}
        </div>
      </div>

      <p className="text-slate-700 leading-relaxed mb-3">{feedback.content}</p>

      {feedback.reply && (
        <div className="ml-4 pl-4 border-l-2 border-blue-200 bg-blue-50 p-3 rounded-r-lg mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Reply className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">官方回复</span>
            {feedback.repliedAt && (
              <span className="text-xs text-blue-400">
                {formatDate(feedback.repliedAt)}
              </span>
            )}
          </div>
          <p className="text-blue-800 text-sm">{feedback.reply}</p>
        </div>
      )}

      {replyingId === feedback.id ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={replyContent}
            onChange={(e) => onReplyContentChange(e.target.value)}
            placeholder="请输入回复内容..."
            rows={3}
            className="input"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={onReplyCancel} className="btn btn-outline text-sm py-1.5">
              取消
            </button>
            <button
              onClick={() => onReplySubmit(feedback.id)}
              disabled={!replyContent.trim()}
              className="btn btn-primary text-sm py-1.5 inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              发送回复
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {feedback.status !== 'replied' && feedback.status !== 'adopted' && (
            <button
              onClick={() => onReplyStart(feedback.id)}
              className="btn btn-ghost text-sm py-1.5 inline-flex items-center gap-1.5"
            >
              <Reply className="w-3.5 h-3.5" />
              回复
            </button>
          )}
          {feedback.status !== 'adopted' && (
            <button
              onClick={() => onMarkAdopted(feedback.id)}
              className="btn btn-ghost text-sm py-1.5 inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              标记已采纳
            </button>
          )}
        </div>
      )}
    </div>
  );
}
