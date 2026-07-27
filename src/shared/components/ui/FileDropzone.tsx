import React, { useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Paperclip } from 'lucide-react';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface FileDropzoneProps {
  files?: FileItem[];
  onChange?: (files: FileItem[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  files = [],
  onChange,
  accept = '.pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg',
  multiple = true,
  maxSizeMB = 10,
  label = 'Tệp đính kèm (Hóa đơn, Hợp đồng, Giấy tờ pháp lý...)',
  className = '',
}) => {
  const [fileList, setFileList] = useState<FileItem[]>(files);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: FileItem[] = Array.from(e.target.files).map((f) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }));

    const updated = multiple ? [...fileList, ...newFiles] : newFiles;
    setFileList(updated);
    if (onChange) onChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = fileList.filter((f) => f.id !== id);
    setFileList(updated);
    if (onChange) onChange(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-gray-400" />
          <span>{label}</span>
        </label>
      )}

      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-gray-900/40">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
          <UploadCloud className="w-8 h-8 text-primary/70 mb-1" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Kéo & thả tệp vào đây hoặc <span className="text-primary underline">Tải lên</span>
          </span>
          <span className="text-[11px] text-gray-400">
            Hỗ trợ PDF, DOCX, XLSX, PNG, JPG (Tối đa {maxSizeMB}MB)
          </span>
        </div>
      </div>

      {fileList.length > 0 && (
        <div className="space-y-2">
          {fileList.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs shadow-sm"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {file.type.includes('image') ? (
                  <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-gray-400 text-[10px] shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                title="Xóa tệp"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
