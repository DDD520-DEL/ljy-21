import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import type { MediaFile } from '@/types';

interface ImageViewerProps {
  images: MediaFile[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (fileId: string) => void;
  onDownload?: (file: MediaFile) => void;
}

export default function ImageViewer({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  onDelete,
  onDownload,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setScale(1);
    setRotation(0);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setScale(1);
    setRotation(0);
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => prev + 90);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrev, goToNext, onClose]);

  const handleDownload = () => {
    if (onDownload && images[currentIndex]) {
      onDownload(images[currentIndex]);
    }
  };

  const handleDelete = () => {
    if (onDelete && images[currentIndex]) {
      const fileId = images[currentIndex].id;
      if (images.length <= 1) {
        onClose();
      } else if (currentIndex === images.length - 1) {
        setCurrentIndex(currentIndex - 1);
      }
      onDelete(fileId);
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            {currentIndex + 1} / {images.length}
          </span>
          <h3 className="font-medium truncate max-w-md">{currentImage.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-slate-400 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="放大"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-2"
            title="旋转"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-2"
            title="下载"
          >
            <Download className="w-5 h-5" />
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors ml-2"
              title="删除"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-2"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div
          className="max-w-full max-h-full overflow-auto flex items-center justify-center"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          <img
            src={currentImage.url}
            alt={currentImage.name}
            className="max-w-[90vw] max-h-[75vh] object-contain select-none"
            draggable={false}
          />
        </div>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      <div className="px-6 py-3 text-center">
        <p className="text-sm text-slate-500">
          上传时间：{formatDate(currentImage.createdAt)}
        </p>
      </div>

      {images.length > 1 && (
        <div className="px-6 pb-4">
          <div className="flex gap-2 overflow-x-auto py-2 justify-center">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setScale(1);
                  setRotation(0);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-primary-500 scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
