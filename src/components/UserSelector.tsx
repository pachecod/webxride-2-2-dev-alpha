import React, { useState, useEffect } from 'react';
import { User, ChevronDown, GraduationCap } from 'lucide-react';
import { getStudentsWithClasses } from '../lib/supabase';

interface UserSelectorProps {
  selectedUser: string | null;
  onUserSelect: (userName: string) => void;
  isAdmin?: boolean;
}

interface Student {
  id: string;
  name: string;
  class_id: string;
  class_name?: string;
  class_description?: string;
  created_at: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ 
  selectedUser, 
  onUserSelect,
  isAdmin = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getStudentsWithClasses();
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Auto-select admin when on admin-tools page and no user is selected
  useEffect(() => {
    const isOnAdminToolsPage = window.location.pathname === '/admin-tools';
    if (isOnAdminToolsPage && !selectedUser) {
      onUserSelect('admin');
    }
  }, [selectedUser, onUserSelect]);

  // Get current user's class information
  const currentUser = students.find(student => student.name === selectedUser);
  const currentUserClass = currentUser?.class_name;

  // Filter students based on admin status and class
  const getFilteredStudents = () => {
    if (isAdmin || window.location.pathname === '/admin-tools') {
      // Admins can see all students
      return students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Students can see all students initially, but filter by class after they select their name
      // AND exclude the admin user from student view
      const filteredBySearch = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        student.name !== 'admin' // Explicitly exclude admin user
      );
      
      // If a user is selected and has a class, filter to show only classmates
      if (selectedUser && currentUserClass) {
        return filteredBySearch.filter(student => 
          student.class_name === currentUserClass
        );
      }
      
      // Otherwise show all students (for initial selection) but still exclude admin
      return filteredBySearch;
    }
  };

  const filteredStudents = getFilteredStudents();
  const studentNames = filteredStudents.map(student => student.name);

  // Add admin option ONLY if we're explicitly on admin-tools page
  const isOnAdminToolsPage = window.location.pathname === '/admin-tools';
  const allNames = isOnAdminToolsPage ? ['admin', ...studentNames] : studentNames;

  const handleUserSelect = (userName: string) => {
    onUserSelect(userName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getUserFolderName = (userName: string) => {
    // Convert name to folder-friendly format: "John Doe" -> "john-doe-123456"
    const timestamp = Date.now();
    return `${userName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
      >
        <User size={16} className="mr-2" />
        <span className="mr-2">
          {selectedUser ? selectedUser : 'Select your name'}
        </span>
        {currentUserClass && !isAdmin && (
          <span className="mr-2 text-xs text-gray-400">
            ({currentUserClass})
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          {/* Show current user's class info */}
          {currentUserClass && !isAdmin && (
            <div className="p-3 border-b border-gray-700 bg-gray-900">
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap size={14} className="text-blue-400" />
                <span className="text-gray-300">Class:</span>
                <span className="text-white font-medium">{currentUserClass}</span>
              </div>
              {currentUser?.class_description && (
                <p className="text-xs text-gray-400 mt-1">{currentUser.class_description}</p>
              )}
            </div>
          )}

          <div className="p-3 border-b border-gray-700">
            <input
              type="text"
              placeholder="Search names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-sm text-gray-400">Loading students...</span>
              </div>
            ) : error ? (
              <div className="px-3 py-2 text-sm text-red-400">
                Error: {error}
              </div>
            ) : allNames.length > 0 ? (
              allNames.map((name) => {
                const student = students.find(s => s.name === name);
                return (
                  <button
                    key={name}
                    onClick={() => handleUserSelect(name)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span>{name}</span>
                      {student?.class_name && !isAdmin && (
                        <span className="text-xs text-gray-400">{student.class_name}</span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">
                {searchTerm ? `No names found matching "${searchTerm}"` : 'No students available'}
              </div>
            )}
          </div>

          {isOnAdminToolsPage && (
            <div className="p-3 border-t border-gray-700 bg-gray-900">
              <p className="text-xs text-gray-400 mb-2">
                Admin: Users are stored in folders like "{getUserFolderName('Example Name')}"
              </p>
              <p className="text-xs text-gray-500">
                Manage students at <code>/admin-tools</code>
              </p>
            </div>
          )}

          {!isAdmin && currentUserClass && (
            <div className="p-3 border-t border-gray-700 bg-gray-900">
              <p className="text-xs text-gray-400">
                Showing only students in your class: <span className="text-blue-400">{currentUserClass}</span>
              </p>
            </div>
          )}

          {!isAdmin && !currentUserClass && selectedUser && (
            <div className="p-3 border-t border-gray-700 bg-gray-900">
              <p className="text-xs text-gray-400">
                Select your name to see classmates
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 