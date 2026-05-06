import React, { useRef, useState } from 'react';
import { X, ImagePlus, Loader } from 'lucide-react';
import { classNames } from '../../lib/utils';
import { images as imagesApi } from '../../lib/api';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  className?: string;
}

export function ImageUpload({ images, onChange, maxImages = 5, label = "Upload Images", className }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files as Iterable<File> | ArrayLike<File>).slice(0, remainingSlots);

    setIsUploading(true);
    try {
      const uploadedUrls = await Promise.all(filesToProcess.map(file => imagesApi.upload(file)));
      onChange([...images, ...uploadedUrls]);
    } catch (error) {
      console.error('Failed to upload images', error);
      alert('Failed to upload one or more images. Please try again.');
    } finally {
      setIsUploading(false);
    }

    // Clear input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={classNames("space-y-3", className)}>
      <div className="flex justify-between items-end">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
        <span className="text-[10px] text-slate-400 font-bold">{images.length} / {maxImages}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {images.map((imgSrc, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
            <img src={imgSrc} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow-sm text-slate-600 hover:text-red-500 hover:bg-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-60 disabled:cursor-wait"
          >
            {isUploading ? (
              <Loader size={24} className="animate-spin" />
            ) : (
              <ImagePlus size={24} />
            )}
            <span className="text-[10px] font-bold">{isUploading ? 'Uploading...' : 'Add Photo'}</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
}
