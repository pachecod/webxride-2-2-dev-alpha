import React, { useState, useEffect } from 'react';
import { ArrowLeft, Inbox, MessageSquare, Calendar, User, Code, Eye, Loader2 } from 'lucide-react';
import { listAllUsersHtml } from '../lib/supabase';

interface SubmissionsInboxProps {
  onBack: () => void;
  onOpenSubmission: (userName: string, folderName: string) => void;
}

interface Submission {
  name: string;
  userName: string;
  studentComment?: string;
  submittedDate?: string;
  created_at: string;
  updated_at: string;
}

export const SubmissionsInbox: React.FC<SubmissionsInboxProps> = ({
  onBack,
  onOpenSubmission
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'with-comments' | 'no-comments'>('all');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const allFiles = await listAllUsersHtml();
      
      // Filter only submitted files
      const submitted = allFiles.filter((file: any) => file.isSubmitted === true);
      
      // Sort by submission date (most recent first)
      submitted.sort((a: any, b: any) => {
        const dateA = new Date(a.submittedDate || a.created_at).getTime();
        const dateB = new Date(b.submittedDate || b.created_at).getTime();
        return dateB - dateA;
      });
      
      setSubmissions(submitted);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFilteredSubmissions = () => {
    switch (filter) {
      case 'with-comments':
        return submissions.filter(s => s.studentComment);
      case 'no-comments':
        return submissions.filter(s => !s.studentComment);
      default:
        return submissions;
    }
  };

  const filteredSubmissions = getFilteredSubmissions();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Editor
            </button>
            <div className="h-6 w-px bg-gray-600" />
            <div className="flex items-center gap-3">
              <Inbox className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-semibold">Student Submissions</h1>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setFilter('with-comments')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter === 'with-comments' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              With Notes ({submissions.filter(s => s.studentComment).length})
            </button>
            <button
              onClick={() => setFilter('no-comments')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter === 'no-comments' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Without Notes ({submissions.filter(s => !s.studentComment).length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-400" size={32} />
            <span className="ml-3 text-gray-400">Loading submissions...</span>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <Inbox className="mx-auto mb-4 text-gray-500" size={48} />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {filter === 'all' ? 'No Submissions Yet' : 'No Matching Submissions'}
            </h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? 'Student submissions will appear here when they use "Save & Submit".' 
                : 'Try changing the filter to see other submissions.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.name}
                className="bg-gray-800 rounded-lg border border-gray-700 p-5 shadow-md"
              >
                {/* Submission Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-blue-400" />
                    <h3 className="text-lg font-semibold text-white truncate flex-1" title={submission.name}>
                      {submission.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={12} />
                    <span>{formatDate(submission.submittedDate || submission.created_at)}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mb-4 flex items-center">
                  <span className="font-medium text-gray-300 mr-1">Student:</span> {submission.userName}
                </p>

                {/* Student Comment */}
                {submission.studentComment && (
                  <div className="bg-gray-900 p-4 rounded-md border border-gray-600 mb-4">
                    <div className="flex items-center text-blue-400 text-sm font-medium mb-2">
                      <MessageSquare size={14} className="mr-1" />
                      Student's Note:
                    </div>
                    <p className="text-gray-200 text-base italic">"{submission.studentComment}"</p>
                  </div>
                )}

                {/* Actions */}
                <button
                  onClick={() => onOpenSubmission(submission.userName, submission.name)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <FileText size={16} />
                  Open in Editor
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

