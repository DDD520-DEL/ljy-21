import { useState } from 'react';
import {
  FileText,
  Gavel,
  Hammer,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  Upload,
  Image,
  File,
  Download,
  Trash2,
  Calendar,
} from 'lucide-react';
import type { Project, ProgressNode, MediaFile } from '@/types';
import { NODE_STATUS_LABEL } from '@/types';
import { useProjectStore } from '@/store/projectStore';

const STAGE_ICONS: Record<string, typeof FileText> = {
  planning: FileText,
  bidding: Gavel,
  constructing: Hammer,
  completed: CheckCircle2,
};

interface ProgressTimelineProps {
  project: Project;
  editable?: boolean;
}

export default function ProgressTimeline({
  project,
  editable = true,
}: ProgressTimelineProps) {
  const [expandedNode, setExpandedNode] = useState<string | null>(
    project.progressNodes.find((n) => n.status === 'in_progress')?.id ||
      project.progressNodes[0]?.id ||
      null
  );
  const updateProgressNode = useProjectStore((s) => s.updateProgressNode);
  const addMediaFile = useProjectStore((s) => s.addMediaFile);

  const toggleNode = (id: string) => {
    setExpandedNode(expandedNode === id ? null : id);
  };

  const handleStatusChange = (nodeId: string, status: 'pending' | 'in_progress' | 'completed') => {
    const node = project.progressNodes.find((n) => n.id === nodeId);
    if (!node) return;

    updateProgressNode(project.id, nodeId, {
      status,
      date: status === 'completed' ? new Date().toISOString().slice(0, 10) : node.date,
    });
  };

  const handleDescriptionChange = (nodeId: string, description: string) => {
    updateProgressNode(project.id, nodeId, { description });
  };

  const handleFileUpload = (nodeId: string, files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const isImage = file.type.startsWith('image/');
        addMediaFile(project.id, nodeId, {
          type: isImage ? 'photo' : 'file',
          name: file.name,
          url: isImage ? url : '#',
        });
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        addMediaFile(project.id, nodeId, {
          type: 'file',
          name: file.name,
          url: '#',
        });
      }
    });
  };

  return (
    <div className="relative">
      <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200" />

      <div className="space-y-4">
        {project.progressNodes.map((node, index) => (
          <TimelineNode
            key={node.id}
            node={node}
            index={index}
            isExpanded={expandedNode === node.id}
            onToggle={() => toggleNode(node.id)}
            onStatusChange={(status) => handleStatusChange(node.id, status)}
            onDescriptionChange={(desc) => handleDescriptionChange(node.id, desc)}
            onFileUpload={(files) => handleFileUpload(node.id, files)}
            editable={editable && node.status !== 'pending'}
          />
        ))}
      </div>
    </div>
  );
}

interface TimelineNodeProps {
  node: ProgressNode;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: 'pending' | 'in_progress' | 'completed') => void;
  onDescriptionChange: (desc: string) => void;
  onFileUpload: (files: FileList) => void;
  editable: boolean;
}

function TimelineNode({
  node,
  index,
  isExpanded,
  onToggle,
  onStatusChange,
  onDescriptionChange,
  onFileUpload,
  editable,
}: TimelineNodeProps) {
  const IconComponent = STAGE_ICONS[node.stageKey] || FileText;

  const statusConfig = {
    completed: {
      iconBg: 'bg-green-500',
      icon: CheckCircle2,
      badge: 'bg-green-100 text-green-700',
    },
    in_progress: {
      iconBg: 'bg-primary-600 animate-pulse-slow',
      icon: Clock,
      badge: 'bg-primary-100 text-primary-700',
    },
    pending: {
      iconBg: 'bg-slate-300',
      icon: Circle,
      badge: 'bg-slate-100 text-slate-600',
    },
  }[node.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative pl-16">
      <div
        className={`absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center ${statusConfig.iconBg} text-white shadow-lg z-10`}
      >
        <StatusIcon className="w-3 h-3" />
      </div>

      <div className="card">
        <button
          onClick={onToggle}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-800">
                  阶段 {index + 1}：{node.stage}
                </h4>
                <span className={`badge ${statusConfig.badge}`}>
                  {NODE_STATUS_LABEL[node.status]}
                </span>
              </div>
              {node.date && (
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {node.date}
                </p>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
            {editable ? (
              <>
                <div>
                  <label className="label-field">节点状态</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onStatusChange('pending')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        node.status === 'pending'
                          ? 'bg-slate-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      待开始
                    </button>
                    <button
                      onClick={() => onStatusChange('in_progress')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        node.status === 'in_progress'
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      进行中
                    </button>
                    <button
                      onClick={() => onStatusChange('completed')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        node.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      已完成
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label-field">进度描述</label>
                  <textarea
                    value={node.description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    className="input-field min-h-[100px] resize-none"
                    placeholder="请输入当前阶段的详细进度描述..."
                  />
                </div>

                <div>
                  <label className="label-field">上传照片/文件</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">点击或拖拽上传照片和文件</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) onFileUpload(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                {node.description ? (
                  <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">
                    {node.description}
                  </p>
                ) : (
                  <p className="text-slate-400 text-sm italic">暂无进度描述</p>
                )}
              </>
            )}

            {node.mediaFiles.length > 0 && (
              <div>
                <p className="label-field mb-2">
                  相关资料 ({node.mediaFiles.length})
                </p>
                <MediaGallery files={node.mediaFiles} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MediaGallery({ files }: { files: MediaFile[] }) {
  const photos = files.filter((f) => f.type === 'photo');
  const documents = files.filter((f) => f.type === 'file');

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map((file) => (
            <div
              key={file.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100"
            >
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p className="text-white text-xs truncate w-full">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <File className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{file.name}</p>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
