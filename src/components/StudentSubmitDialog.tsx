import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';

interface StudentSubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment?: string) => void;
  studentName: string;
}

export const StudentSubmitDialog: React.FC<StudentSubmitDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  studentName
}) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSubmit(comment.trim() || undefined);
    onClose();
    // Reset for next time
    setComment('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-700 bg-gradient-to-r from-green-600/20 to-blue-600/20">
          <div className="bg-green-600 rounded-full p-2">
            <Send className="text-white" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-white">Submit to Teacher</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm">
            You're about to submit your work for review. This will save your project and notify your teacher.
          </p>

          {/* Comment Section */}
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-blue-400" />
              <label className="text-sm font-semibold text-white">
                Add a note for your teacher (optional)
              </label>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Example: I had trouble with the CSS part. Could you help me understand how to center elements?"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500"
              rows={4}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-2">
              Your teacher will see this note along with your submitted work.
            </p>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-200">
              💡 <strong>Tip:</strong> You can continue working on this file after submitting. 
              Each submission creates a new version for your teacher to review.
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Send size={16} />
            Submit to Teacher
          </button>
        </div>
      </div>
    </div>
  );
};

