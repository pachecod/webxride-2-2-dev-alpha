import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CustomFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileName: string) => void;
}

const CustomFileModal: React.FC<CustomFileModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [fileName, setFileName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileName.trim()) {
      onConfirm(fileName.trim());
      setFileName('');
      onClose();
    }
  };

  const handleCancel = () => {
    setFileName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Add Custom File</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fileName" className="block text-sm font-medium text-gray-300 mb-2">
              File Name (including extension)
            </label>
            <input
              type="text"
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., data.json, config.xml, styles.scss"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the full filename with extension (e.g., data.json, config.xml)
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              Add File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomFileModal; 