import React, { useState } from 'react';
import { AlertCircle, Save, Users, MessageSquare } from 'lucide-react';

interface AdminSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saveOption: 'admin-only' | 'both', comment?: string) => void;
  studentName: string;
  adminName: string;
}

export const AdminSaveDialog: React.FC<AdminSaveDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  studentName,
  adminName
}) => {
  const [selectedOption, setSelectedOption] = useState<'admin-only' | 'both'>('admin-only');
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSave(selectedOption, comment.trim() || undefined);
    onClose();
    // Reset for next time
    setComment('');
    setSelectedOption('admin-only');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-700">
          <AlertCircle className="text-yellow-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Save Options</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm">
            You're editing <span className="font-semibold text-blue-400">{studentName}</span>'s work. 
            How would you like to save these changes?
          </p>

          {/* Option 1: Save only to admin */}
          <label 
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'admin-only' 
                ? 'border-blue-500 bg-blue-500 bg-opacity-10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input
              type="radio"
              name="saveOption"
              value="admin-only"
              checked={selectedOption === 'admin-only'}
              onChange={(e) => setSelectedOption(e.target.value as 'admin-only')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Save size={16} className="text-green-400" />
                <span className="font-semibold text-white">Save to my account only</span>
              </div>
              <p className="text-sm text-gray-400">
                Create a copy in <span className="text-green-400">{adminName}</span>'s account. 
                The student's original will remain unchanged.
              </p>
            </div>
          </label>

          {/* Option 2: Save to both */}
          <label 
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'both' 
                ? 'border-blue-500 bg-blue-500 bg-opacity-10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input
              type="radio"
              name="saveOption"
              value="both"
              checked={selectedOption === 'both'}
              onChange={(e) => setSelectedOption(e.target.value as 'both')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-purple-400" />
                <span className="font-semibold text-white">Save to both accounts</span>
              </div>
              <p className="text-sm text-gray-400">
                Update <span className="text-blue-400">{studentName}</span>'s original 
                AND save a copy to <span className="text-green-400">{adminName}</span>'s account.
              </p>
            </div>
          </label>

          {/* Optional Comment Section */}
          <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-blue-400" />
              <label className="text-sm font-semibold text-white">
                Add feedback for student (optional)
              </label>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Example: Great work! Try adding some CSS styling to make it look even better..."
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">
              {selectedOption === 'both' 
                ? 'This comment will be visible to the student when they open their file.'
                : 'Comment will only be visible if you save to the student\'s account.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

