import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, MessageSquare, FileText, User, CheckCircle, Clock } from 'lucide-react';
import { listUserHtmlByName } from '../lib/supabase';

interface StudentNotificationInboxProps {
  onBack: () => void;
  onOpenProject: (projectName: string) => void;
  studentName: string;
}

interface NotificationProject {
  name: string;
  metadata?: {
    adminComment?: string;
    commentDate?: string;
    isSubmitted?: boolean;
    submittedDate?: string;
    studentComment?: string;
    name?: string;
    created_at?: string;
    updated_at?: string;
  };
}

export const StudentNotificationInbox: React.FC<StudentNotificationInboxProps> = ({ 
  onBack, 
  onOpenProject, 
  studentName 
}) => {
  const [notifications, setNotifications] = useState<NotificationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'with-feedback' | 'submitted'>('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const userProjects = await listUserHtmlByName(studentName);
        
        // Filter projects that have admin feedback or are submitted
        const notificationProjects = userProjects.filter(p => 
          (p.metadata && p.metadata.adminComment) || (p.metadata && p.metadata.isSubmitted)
        ).sort((a, b) => {
          // Sort by most recent activity (admin comment date or submission date)
          const dateA = (a.metadata && a.metadata.commentDate) ? new Date(a.metadata.commentDate).getTime() : 
                       (a.metadata && a.metadata.submittedDate) ? new Date(a.metadata.submittedDate).getTime() : 0;
          const dateB = (b.metadata && b.metadata.commentDate) ? new Date(b.metadata.commentDate).getTime() : 
                       (b.metadata && b.metadata.submittedDate) ? new Date(b.metadata.submittedDate).getTime() : 0;
          return dateB - dateA;
        });
        
        setNotifications(notificationProjects);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [studentName]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'with-feedback') {
      return !!(notification.metadata && notification.metadata.adminComment);
    }
    if (filter === 'submitted') {
      return !!(notification.metadata && notification.metadata.isSubmitted);
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getNotificationStatus = (notification: NotificationProject) => {
    if (notification.metadata && notification.metadata.adminComment) {
      return {
        icon: <MessageSquare size={16} className="text-blue-400" />,
        text: 'New Feedback',
        color: 'text-blue-400'
      };
    }
    if (notification.metadata && notification.metadata.isSubmitted) {
      return {
        icon: <Clock size={16} className="text-yellow-400" />,
        text: 'Submitted',
        color: 'text-yellow-400'
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              My Notifications
            </h1>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <span className="text-gray-300">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'with-feedback' | 'submitted')}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-md px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Notifications</option>
            <option value="with-feedback">With Teacher Feedback</option>
            <option value="submitted">Submitted Work</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} />
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Notifications</h3>
            <p className="text-gray-400">You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const status = getNotificationStatus(notification);
              return (
                <div key={notification.name} className="bg-gray-800 rounded-lg border border-gray-700 p-5 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white truncate flex-1" title={notification.metadata?.name || notification.name}>
                      {notification.metadata?.name || notification.name}
                    </h3>
                    {status && (
                      <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                        {status.icon}
                        {status.text}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-4">
                    Last activity: {formatDate(notification.metadata?.commentDate || notification.metadata?.submittedDate || notification.metadata?.created_at || '')}
                  </p>

                  {notification.metadata && notification.metadata.adminComment && (
                    <div className="bg-gray-900 p-4 rounded-md border border-gray-600 mb-4">
                      <div className="flex items-center text-green-400 text-sm font-medium mb-2">
                        <MessageSquare size={14} className="mr-1" />
                        Teacher's Feedback:
                      </div>
                      <p className="text-gray-200 text-base leading-relaxed">"{notification.metadata.adminComment}"</p>
                      {notification.metadata.commentDate && (
                        <p className="text-xs text-gray-400 mt-2">
                          Received: {formatDate(notification.metadata.commentDate)}
                        </p>
                      )}
                    </div>
                  )}

                  {notification.metadata && notification.metadata.isSubmitted && !notification.metadata.adminComment && (
                    <div className="bg-gray-900 p-4 rounded-md border border-gray-600 mb-4">
                      <div className="flex items-center text-yellow-400 text-sm font-medium mb-2">
                        <CheckCircle size={14} className="mr-1" />
                        Submission Status:
                      </div>
                      <p className="text-gray-200 text-base">Submitted for review</p>
                      {notification.metadata.studentComment && (
                        <p className="text-gray-300 text-sm mt-2 italic">
                          Your note: "{notification.metadata.studentComment}"
                        </p>
                      )}
                      {notification.metadata.submittedDate && (
                        <p className="text-xs text-gray-400 mt-2">
                          Submitted: {formatDate(notification.metadata.submittedDate)}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => onOpenProject(notification.name)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Open Project
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
