import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Users, GraduationCap } from 'lucide-react';
import { getStudentsWithClasses, addStudent, removeStudent, updateStudent } from '../lib/supabase';

interface Student {
  id: string;
  name: string;
  class_id: string;
  class_name?: string;
  class_description?: string;
  created_at: string;
}

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getStudentsWithClasses();
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return;
    
    try {
      setAddingStudent(true);
      await addStudent(newStudentName.trim());
      setNewStudentName('');
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentName: string) => {
    if (!confirm(`Are you sure you want to remove "${studentName}"? This will also delete all their saved work.`)) {
      return;
    }
    
    try {
      setRemovingStudent(studentName);
      await removeStudent(studentName);
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove student');
    } finally {
      setRemovingStudent(null);
    }
  };

  const handleStartEdit = (student: Student) => {
    setEditingStudent(student.id);
    setEditingName(student.name);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent || !editingName.trim()) return;
    
    const student = students.find(s => s.id === editingStudent);
    if (!student) return;
    
    try {
      await updateStudent(student.name, editingName.trim());
      setEditingStudent(null);
      setEditingName('');
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student');
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditingName('');
  };

  // Get unique classes for filter
  const uniqueClasses = Array.from(new Set(students.map(s => s.class_name).filter(Boolean)));

  // Filter students by selected class
  const filteredStudents = selectedClassFilter === 'all' 
    ? students 
    : students.filter(student => student.class_name === selectedClassFilter);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading students...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Student Management
        </h3>
        <button
          onClick={loadStudents}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-sm">
          {error}
        </div>
      )}

      {/* Add new student */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium mb-3">Add New Student</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            placeholder="Enter student name..."
            className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
          />
          <button
            onClick={handleAddStudent}
            disabled={addingStudent || !newStudentName.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm transition-colors flex items-center"
          >
            {addingStudent ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Student list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">
            Current Students ({filteredStudents.length})
            {selectedClassFilter !== 'all' && ` in ${selectedClassFilter}`}
          </h4>
          {uniqueClasses.length > 0 && (
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          )}
        </div>
        {students.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No students added yet</p>
            <p className="text-sm">Add students above to get started</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No students in selected class</p>
            <p className="text-sm">Try selecting a different class or add students</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                {editingStudent === student.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-400 hover:text-green-300"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-gray-400 hover:text-gray-300"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{student.name}</span>
                      {student.class_name && (
                        <div className="flex items-center gap-1 mt-1">
                          <GraduationCap size={12} className="text-blue-400" />
                          <span className="text-xs text-gray-400">{student.class_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(student)}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveStudent(student.name)}
                        disabled={removingStudent === student.name}
                        className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                        title="Remove"
                      >
                        {removingStudent === student.name ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-3 bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium mb-2">How it works</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Students appear in the dropdown menu on the main page</li>
          <li>• Students can only see other students in their same class</li>
          <li>• When a student is removed, all their saved work is deleted</li>
          <li>• Student names are stored in the database and synced across sessions</li>
          <li>• Changes take effect immediately for all users</li>
          <li>• Use the Classes tab to manage class assignments</li>
        </ul>
      </div>
    </div>
  );
}; 