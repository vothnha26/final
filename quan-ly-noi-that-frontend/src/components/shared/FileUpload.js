import React, { useState, useRef } from 'react';
import api from '../../api';
import { IoCloudUpload, IoImage, IoDocument, IoClose, IoCheckmark } from 'react-icons/io5';

const FileUpload = ({
  accept = 'image/*',
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  onUpload,
  onRemove,
  onToggleMain,
  files = [],
  className = '',
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = async (fileList) => {
    const validFiles = [];
    const errors = [];

    for (const file of fileList) {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} quá lớn (tối đa ${formatFileSize(maxSize)})`);
        continue;
      }

      // Check file type
      if (accept && !file.type.match(accept.replace('*', '.*'))) {
        errors.push(`${file.name} không đúng định dạng`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setUploading(true);
      try {
        if (onUpload) {
          await onUpload(multiple ? validFiles : validFiles[0]);
        }
      } catch (error) {
        alert('Có lỗi xảy ra khi tải lên file');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemove = (index) => {
    if (onRemove) {
      onRemove(index);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <IoImage className="w-6 h-6 text-blue-500" />;
    }
    return <IoDocument className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <IoCloudUpload className={`w-12 h-12 mx-auto ${dragActive ? 'text-primary' : 'text-gray-400'}`} />
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Thả file vào đây' : 'Kéo thả file hoặc click để chọn'}
            </p>
            <p className="text-sm text-gray-500">
              Tối đa {formatFileSize(maxSize)} • {accept}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-blue-700">Đang tải lên...</span>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Files đã tải lên:</h4>
          <div className="space-y-2">
            {files.map((file, index) => {
              // normalize file representation for display
              const name = file.name || file.duongDanHinhAnh || (file.file && file.file.name) || `file-${index}`;
              const size = file.size || (file.file && file.file.size) || 0;
              const isMain = !!(file.laAnhChinh || file.isMain || file.main || file.isPrimary || file._isMain);
              
              // Get image preview URL
              let imageUrl = null;
              if (file instanceof File) {
                imageUrl = URL.createObjectURL(file);
              } else if (file.duongDanHinhAnh) {
                // Existing image from server - prepend base URL if needed
                imageUrl = file.duongDanHinhAnh.startsWith('http')
                  ? file.duongDanHinhAnh
                  : api.buildUrl(file.duongDanHinhAnh);
              }
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {/* Show image preview if available */}
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      getFileIcon({ type: (file.type || (file.file && file.file.type) || 'image/*') })
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {size ? formatFileSize(size) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onToggleMain ? (
                      <button
                        onClick={() => onToggleMain(index)}
                        className={`p-1 rounded ${isMain ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title={isMain ? 'Ảnh chính' : 'Đặt làm ảnh chính'}
                        type="button"
                      >
                        <IoCheckmark className="w-5 h-5" />
                      </button>
                    ) : (
                      <IoCheckmark className={`w-5 h-5 ${isMain ? 'text-green-500' : 'text-gray-300'}`} />
                    )}
                    <button
                      onClick={() => handleRemove(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={disabled}
                    >
                      <IoClose className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;



