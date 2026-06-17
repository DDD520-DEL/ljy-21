import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowLeft,
  MessageSquare,
  Shield,
  Loader2,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { MapPin, Building2 } from 'lucide-react';

export default function PublicationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const initProjects = useProjectStore((s) => s.initProjects);
  const getPublicationByToken = useProjectStore((s) => s.getPublicationByToken);
  const isPublicationActive = useProjectStore((s) => s.isPublicationActive);
  const addFeedback = useProjectStore((s) => s.addFeedback);

  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projects.length === 0) {
      initProjects();
    }
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [projects.length, initProjects]);

  const result = token ? getPublicationByToken(token) : null;
  const isActive = result ? isPublicationActive(result.publication) : false;

  if (isLoading || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">链接无效</h2>
          <p className="text-slate-600 mb-6">
            该公示链接不存在或已被删除。
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const { publication, project } = result;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRemainingTime = () => {
    const now = new Date();
    const end = new Date(publication.endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return '已过期';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `剩余 ${days} 天 ${hours} 小时`;
    if (hours > 0) return `剩余 ${hours} 小时 ${minutes} 分钟`;
    return `剩余 ${minutes} 分钟`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('请输入您的意见或建议');
      return;
    }

    if (!isActive) {
      setError('公示期已结束，无法提交反馈');
      return;
    }

    const result = addFeedback(token!, {
      content: content.trim(),
      contact: contact.trim() || undefined,
    });

    if (result) {
      setSubmitted(true);
    } else {
      setError('提交失败，请稍后重试');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">提交成功</h2>
          <p className="text-slate-600 mb-6">
            感谢您的宝贵意见！我们会认真处理每一条反馈。
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setContent('');
              setContact('');
            }}
            className="btn btn-secondary inline-flex items-center gap-2 mr-3"
          >
            <MessageSquare className="w-4 h-4" />
            继续提交
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-primary-700 via-primary-800 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-primary-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">{publication.title}</h1>
              <div className="flex items-center gap-2 text-primary-200 text-sm mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{project.name}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-primary-200">
              <MapPin className="w-4 h-4" />
              <span>{project.address}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${isActive ? 'text-green-300' : 'text-red-300'}`}>
              <Clock className="w-4 h-4" />
              <span>{isActive ? getRemainingTime() : '公示已结束'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!isActive && (
          <div className="card p-4 mb-6 bg-red-50 border-red-200 border animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">公示期已结束</p>
                <p className="text-sm text-red-600">
                  该公示于 {formatDate(publication.endTime)} 截止，现已无法提交反馈。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6 mb-6 animate-slide-up">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            公示说明
          </h3>
          <p className="text-slate-600 leading-relaxed">{publication.description}</p>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">开始时间</span>
              <p className="font-medium text-slate-800">{formatDate(publication.startTime)}</p>
            </div>
            <div>
              <span className="text-slate-500">截止时间</span>
              <p className="font-medium text-slate-800">{formatDate(publication.endTime)}</p>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              提交意见和建议
            </h3>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  您的反馈将匿名提交，联系方式仅用于必要时与您沟通，我们将严格保密。
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  意见和建议 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入您对该方案的意见或建议..."
                  rows={5}
                  className="input"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <p className="text-xs text-slate-400 ml-auto">{content.length}/1000</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  联系方式（可选）
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="手机号或邮箱，方便我们与您沟通"
                  className="input"
                  maxLength={50}
                />
                <p className="text-xs text-slate-400 mt-1">选填，我们将严格保密</p>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                提交反馈
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
