import React, { useState } from 'react';
import { File, FileType } from '../types';
import { FileCode, FileText, FileJson, X, Plus, File as FileIcon } from 'lucide-react';
import CustomFileModal from './CustomFileModal';

interface FileTabsProps {
  files: File[];
  activeFileId: string;
  onChangeFile: (id: string) => void;
  onAddFile?: (type: FileType, fileName?: string) => void;
  onNewTemplate?: () => void;
}

const FileTabs: React.FC<FileTabsProps> = ({ files, activeFileId, onChangeFile, onAddFile, onNewTemplate }) => {
  const [showCustomFileModal, setShowCustomFileModal] = useState(false);

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case FileType.HTML:
        return <FileCode size={16} className="text-orange-400" />;
      case FileType.CSS:
        return <FileText size={16} className="text-blue-400" />;
      case FileType.JS:
        return <FileJson size={16} className="text-yellow-400" />;
      case FileType.CUSTOM:
        return <FileIcon size={16} className="text-green-400" />;
      default:
        return <FileText size={16} />;
    }
  };

  const hasFileType = (type: FileType) => {
    return files.some(file => file.type === type);
  };

  const handleAddCustomFile = (fileName: string) => {
    if (onAddFile) {
      onAddFile(FileType.CUSTOM, fileName);
    }
  };

  return (
    <>
      <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto items-stretch">
        {files.map((file) => (
          <div
            key={file.id}
            className={`
              flex items-center py-2 px-4 border-r border-gray-700 cursor-pointer transition-colors
              ${activeFileId === file.id ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-700'}
            `}
            onClick={() => onChangeFile(file.id)}
          >
            {getFileIcon(file.type)}
            <span className="ml-2 text-sm whitespace-nowrap">{file.name}</span>
          </div>
        ))}
        
        {/* Add file buttons */}
        {onAddFile && (
          <div className="flex items-center border-r border-gray-700">
            {!hasFileType(FileType.CSS) && (
              <button
                onClick={() => onAddFile(FileType.CSS)}
                className="flex items-center py-2 px-3 text-gray-400 hover:bg-gray-700 transition-colors"
                title="Add CSS file"
              >
                <Plus size={14} className="mr-1" />
                <FileText size={16} className="text-blue-400" />
              </button>
            )}
            {!hasFileType(FileType.JS) && (
              <button
                onClick={() => onAddFile(FileType.JS)}
                className="flex items-center py-2 px-3 text-gray-400 hover:bg-gray-700 transition-colors"
                title="Add JavaScript file"
              >
                <Plus size={14} className="mr-1" />
                <FileJson size={16} className="text-yellow-400" />
              </button>
            )}
            <button
              onClick={() => setShowCustomFileModal(true)}
              className="flex items-center py-2 px-3 text-gray-400 hover:bg-gray-700 transition-colors"
              title="Add custom file"
            >
              <Plus size={14} className="mr-1" />
              <FileIcon size={16} className="text-green-400" />
            </button>
          </div>
        )}
        {/* New Template button */}
        {onNewTemplate && (
          <button
            onClick={onNewTemplate}
            className="flex items-center py-2 px-4 text-xs bg-green-600 hover:bg-green-700 text-white rounded-none border-l border-gray-700 transition-colors"
            style={{ height: '100%' }}
            title="Create a new template"
          >
            New
          </button>
        )}
      </div>
      
      <CustomFileModal
        isOpen={showCustomFileModal}
        onClose={() => setShowCustomFileModal(false)}
        onConfirm={handleAddCustomFile}
      />
    </>
  );
};

export default FileTabs;