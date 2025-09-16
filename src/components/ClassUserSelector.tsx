import React, { useState, useEffect } from 'react';
import { User, ChevronDown, GraduationCap, ArrowLeft } from 'lucide-react';
import { getStudentsWithClasses, getClasses } from '../lib/supabase';

interface ClassUserSelectorProps {
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

interface Class {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const ClassUserSelector: React.FC<ClassUserSelectorProps> = ({ 
  selectedUser, 
  onUserSelect,
  isAdmin = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showClassSelection, setShowClassSelection] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsResult, classesResult] = await Promise.all([
        getStudentsWithClasses(),
        getClasses()
      ]);
      
      if (studentsResult.error) throw studentsResult.error;
      if (classesResult.error) throw classesResult.error;
      
      setStudents(studentsResult.data || []);
      setClasses(classesResult.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  // If user is already selected and has a class, set the selected class
  useEffect(() => {
    if (selectedUser && currentUserClass && !isAdmin) {
      setSelectedClass(currentUserClass);
      setShowClassSelection(false);
    }
  }, [selectedUser, currentUserClass, isAdmin]);

  // Filter students by selected class
  const getStudentsInClass = (className: string) => {
    return students.filter(student => 
      student.class_name === className && 
      student.name !== 'admin' // Exclude admin from student view
    );
  };

  // Get unique classes for selection
  const getAvailableClasses = () => {
    const classNames = Array.from(new Set(students.map(s => s.class_name).filter(Boolean)));
    return classNames.map(className => ({
      name: className!,
      studentCount: getStudentsInClass(className!).length
    }));
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setShowClassSelection(false);
    setSearchTerm('');
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setShowClassSelection(true);
    setSearchTerm('');
  };

  const handleUserSelect = (userName: string) => {
    onUserSelect(userName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpenDropdown = () => {
    if (isAdmin || window.location.pathname === '/admin-tools') {
      // Admins can always see all options
      setIsOpen(!isOpen);
    } else if (selectedUser && currentUserClass) {
      // Students can only switch between users in their class
      setIsOpen(!isOpen);
    } else {
      // First time selection - show class selection
      setIsOpen(!isOpen);
    }
  };

  // Get filtered students based on context
  const getFilteredStudents = () => {
    if (isAdmin || window.location.pathname === '/admin-tools') {
      // Admins can see all students
      return students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (selectedClass) {
      // Show only students in selected class
      return getStudentsInClass(selectedClass).filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Show all students for initial selection
      return students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        student.name !== 'admin'
      );
    }
  };

  const filteredStudents = getFilteredStudents();
  const availableClasses = getAvailableClasses();

  // Add admin option ONLY if we're explicitly on admin-tools page
  const isOnAdminToolsPage = window.location.pathname === '/admin-tools';
  const allNames = isOnAdminToolsPage ? ['admin', ...filteredStudents.map(s => s.name)] : filteredStudents.map(s => s.name);

  return (
    <div className="relative">
      <button
        onClick={handleOpenDropdown}
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
        <div className="absolute top-full left-0 mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Header with current class info */}
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

          {/* Class Selection View */}
          {showClassSelection && !isAdmin && (
            <div>
              <div className="p-3 border-b border-gray-700">
                <h3 className="text-sm font-medium text-white mb-2">Choose Your Class</h3>
                <input
                  type="text"
                  placeholder="Search classes..."
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
                    <span className="text-sm text-gray-400">Loading classes...</span>
                  </div>
                ) : error ? (
                  <div className="px-3 py-2 text-sm text-red-400">
                    Error: {error}
                  </div>
                ) : availableClasses.length > 0 ? (
                  availableClasses
                    .filter(cls => cls.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((cls) => (
                      <button
                        key={cls.name}
                        onClick={() => handleClassSelect(cls.name)}
                        className="w-full text-left px-3 py-3 hover:bg-gray-700 transition-colors text-sm border-b border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GraduationCap size={16} className="text-blue-400" />
                            <span className="font-medium">{cls.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    {searchTerm ? `No classes found matching "${searchTerm}"` : 'No classes available'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Selection View */}
          {(!showClassSelection || isAdmin) && (
            <div>
              {/* Back button for class selection */}
              {selectedClass && !isAdmin && (
                <div className="p-3 border-b border-gray-700 bg-gray-900">
                  <button
                    onClick={handleBackToClasses}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                  >
                    <ArrowLeft size={14} />
                    Back to class selection
                  </button>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-400">Class: </span>
                    <span className="text-white font-medium">{selectedClass}</span>
                  </div>
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
            </div>
          )}

          {/* Footer info */}
          {isOnAdminToolsPage && (
            <div className="p-3 border-t border-gray-700 bg-gray-900">
              <p className="text-xs text-gray-400 mb-2">
                Admin: Users are stored in folders like "example-name-123456"
              </p>
              <p className="text-xs text-gray-500">
                Manage students at <code>/admin-tools</code>
              </p>
            </div>
          )}

          {!isAdmin && selectedClass && (
            <div className="p-3 border-t border-gray-700 bg-gray-900">
              <p className="text-xs text-gray-400">
                Showing students in: <span className="text-blue-400">{selectedClass}</span>
              </p>
            </div>
          )}

          {!isAdmin && !selectedClass && !showClassSelection && (
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