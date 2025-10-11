import React, { useState, useEffect } from 'react';
import { Eye, X, AlertCircle } from 'lucide-react';
import { getStudentsWithClasses } from '../lib/supabase';

interface Student {
  id: string;
  name: string;
  class_id: string;
  class_name?: string;
  class_description?: string;
  created_at: string;
}

interface AdminImpersonationProps {
  impersonatedUser: string | null;
  onImpersonate: (userName: string | null) => void;
}

export const AdminImpersonation: React.FC<AdminImpersonationProps> = ({
  impersonatedUser,
  onImpersonate
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getStudentsWithClasses();
      if (error) throw error;
      // Filter out admin user
      setStudents((data || []).filter(s => s.name !== 'admin'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Get unique classes for filter
  const classes = Array.from(new Set(students.map(s => s.class_name).filter(Boolean)));

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'all' || student.class_name === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const handleImpersonate = (userName: string) => {
    onImpersonate(userName);
  };

  const handleStopImpersonating = () => {
    onImpersonate(null);
  };

  return (
    <div>
      <p className="text-gray-300 text-sm mb-4">
        Temporarily view the application as a student to see their files and projects. 
        You will remain logged in as admin.
      </p>

      {/* Current Impersonation Status */}
      {impersonatedUser && (
        <div className="mb-4 p-3 bg-purple-900/30 border border-purple-600 rounded">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <Eye className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-purple-200 text-sm font-medium">Currently viewing as:</p>
                <p className="text-white font-semibold truncate">{impersonatedUser}</p>
              </div>
            </div>
            <button
              onClick={handleStopImpersonating}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition-colors flex items-center gap-1 flex-shrink-0"
              title="Stop viewing as this student"
            >
              <X size={12} />
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Info Alert */}
      {!impersonatedUser && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-blue-200 text-xs">
            Select a student below to view their workspace. Your admin session will remain active.
          </p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
        />
        
        {classes.length > 0 && (
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Classes</option>
            {classes.map(className => (
              <option key={className} value={className || ''}>
                {className || 'No Class'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Student List */}
      {loading ? (
        <div className="text-center py-4 text-gray-400 text-sm">Loading students...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-400 text-sm">{error}</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">No students found</div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filteredStudents.map(student => (
            <button
              key={student.id}
              onClick={() => handleImpersonate(student.name)}
              disabled={impersonatedUser === student.name}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                impersonatedUser === student.name
                  ? 'bg-purple-600 text-white cursor-default'
                  : 'bg-gray-800 hover:bg-gray-750 text-gray-200 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{student.name}</div>
                  {student.class_name && (
                    <div className="text-xs text-gray-400 truncate">{student.class_name}</div>
                  )}
                </div>
                {impersonatedUser === student.name && (
                  <Eye className="w-4 h-4 text-purple-200 flex-shrink-0 ml-2" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
