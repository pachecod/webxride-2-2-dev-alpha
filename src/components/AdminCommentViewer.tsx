import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface AdminCommentViewerProps {
  comment: string;
  commentDate?: string;
  onDismiss?: () => void; // Optional: permanently dismiss the comment
}

export const AdminCommentViewer: React.FC<AdminCommentViewerProps> = ({
  comment,
  commentDate,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPermanentlyDismissed, setIsPermanentlyDismissed] = useState(false);

  if (isPermanentlyDismissed) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePermanentDismiss = () => {
    setIsPermanentlyDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <>
      {/* Comment Button - Fixed position in corner */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-40 transition-all animate-pulse hover:animate-none"
          title="View teacher feedback"
        >
          <MessageSquare size={24} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            !
          </span>
        </button>
      )}

      {/* Comment Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full border border-blue-500">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded-full p-2">
                  <MessageSquare className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Teacher Feedback</h3>
                  {commentDate && (
                    <p className="text-xs text-gray-400">{formatDate(commentDate)}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Comment Content */}
            <div className="p-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {comment}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-4 border-t border-gray-700 bg-gray-900">
              <button
                onClick={handlePermanentDismiss}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Don't show again for this file
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

