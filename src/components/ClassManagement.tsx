import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import { 
  getClasses, 
  createClass, 
  updateClass, 
  deleteClass, 
  getStudentsWithClasses,
  addStudentToClass,
  removeStudent,
  updateStudentClass
} from '../lib/supabase';

interface Class {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  name: string;
  class_id: string;
  class_name?: string;
  class_description?: string;
}

interface ClassManagementProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({ isVisible, onClose }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Class management state
  const [showAddClass, setShowAddClass] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  
  // Student management state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedClassForStudent, setSelectedClassForStudent] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [classesResult, studentsResult] = await Promise.all([
        getClasses(),
        getStudentsWithClasses()
      ]);

      if (classesResult.error) throw classesResult.error;
      if (studentsResult.error) throw studentsResult.error;

      setClasses(classesResult.data || []);
      setStudents(studentsResult.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await createClass({
        name: newClassName.trim(),
        description: newClassDescription.trim() || undefined
      });

      if (error) throw error;

      setClasses(prev => [...prev, data]);
      setNewClassName('');
      setNewClassDescription('');
      setShowAddClass(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !newClassName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await updateClass(editingClass.id, {
        name: newClassName.trim(),
        description: newClassDescription.trim() || undefined
      });

      if (error) throw error;

      setClasses(prev => prev.map(c => c.id === editingClass.id ? data : c));
      setEditingClass(null);
      setNewClassName('');
      setNewClassDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This will also delete all students in the class.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await deleteClass(classId);
      if (error) throw error;

      setClasses(prev => prev.filter(c => c.id !== classId));
      setStudents(prev => prev.filter(s => s.class_id !== classId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !selectedClassForStudent) return;

    setLoading(true);
    try {
      const { data, error } = await addStudentToClass(newStudentName.trim(), selectedClassForStudent);
      if (error) throw error;

      // Reload students to get the updated list with class names
      const studentsResult = await getStudentsWithClasses();
      if (studentsResult.error) throw studentsResult.error;
      setStudents(studentsResult.data || []);

      setNewStudentName('');
      setSelectedClassForStudent('');
      setShowAddStudent(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await removeStudent(studentId);
      if (error) throw error;

      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStudent = async (studentId: string, newClassId: string) => {
    setLoading(true);
    try {
      const { error } = await updateStudentClass(studentId, newClassId);
      if (error) throw error;

      // Reload students to get the updated list with class names
      const studentsResult = await getStudentsWithClasses();
      if (studentsResult.error) throw studentsResult.error;
      setStudents(studentsResult.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} />
            Class Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Classes</h3>
              <button
                onClick={() => setShowAddClass(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                <Plus size={16} />
                Add Class
              </button>
            </div>

            {showAddClass && (
              <div className="p-4 bg-gray-800 rounded border border-gray-700">
                <h4 className="text-white font-medium mb-3">Add New Class</h4>
                <form onSubmit={handleCreateClass} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Class name"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
                    required
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm disabled:opacity-50"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddClass(false)}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {classes.map((cls) => (
                <div key={cls.id} className="p-3 bg-gray-800 rounded border border-gray-700">
                  {editingClass?.id === cls.id ? (
                    <form onSubmit={handleUpdateClass} className="space-y-2">
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
                        required
                      />
                      <textarea
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-1">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClass(null);
                            setNewClassName('');
                            setNewClassDescription('');
                          }}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{cls.name}</h4>
                        {cls.description && (
                          <p className="text-gray-400 text-sm">{cls.description}</p>
                        )}
                        <p className="text-gray-500 text-xs">
                          {students.filter(s => s.class_id === cls.id).length} students
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingClass(cls);
                            setNewClassName(cls.name);
                            setNewClassDescription(cls.description || '');
                          }}
                          className="p-1 text-gray-400 hover:text-blue-400"
                          title="Edit class"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Delete class"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Students Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Students</h3>
              <button
                onClick={() => setShowAddStudent(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
              >
                <Plus size={16} />
                Add Student
              </button>
            </div>

            {showAddStudent && (
              <div className="p-4 bg-gray-800 rounded border border-gray-700">
                <h4 className="text-white font-medium mb-3">Add New Student</h4>
                <form onSubmit={handleAddStudent} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Student name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
                    required
                  />
                  <select
                    value={selectedClassForStudent}
                    onChange={(e) => setSelectedClassForStudent(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddStudent(false)}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="p-3 bg-gray-800 rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{student.name}</h4>
                      <p className="text-gray-400 text-sm">
                        Class: {student.class_name || 'No class assigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={student.class_id || ''}
                        onChange={(e) => handleMoveStudent(student.id, e.target.value)}
                        className="px-2 py-1 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 text-xs"
                        disabled={loading}
                      >
                        <option value="">No class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                        title="Remove student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassManagement; 