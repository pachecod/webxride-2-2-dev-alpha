import React, { useState, useEffect } from 'react';
import { Download, Eye, EyeOff, X, Copy, RefreshCw } from 'lucide-react';
import { getStudentsWithClasses, generateRandomPassword, setUserPassword } from '../lib/supabase';

interface Student {
  id: string;
  name: string;
  email?: string;
  class_name?: string;
  username?: string;
  password?: string;
  password_set_at?: string;
  is_active?: boolean;
}

interface PasswordReportProps {
  onClose: () => void;
}

export const PasswordReport: React.FC<PasswordReportProps> = ({ onClose }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getStudentsWithClasses();
      if (fetchError) throw fetchError;
      setStudents(data || []);
    } catch (err) {
      console.error('Error loading students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const generateNewPassword = async (student: Student) => {
    const username = student.username || student.name.toLowerCase().replace(/\s+/g, '-');
    const newPassword = generateRandomPassword();
    
    setUpdatingPassword(student.id);
    try {
      const { error } = await setUserPassword(username, newPassword);
      if (error) throw error;
      
      // Update the local state
      setStudents(prev => prev.map(s => 
        s.id === student.id 
          ? { ...s, password: newPassword, password_set_at: new Date().toISOString() }
          : s
      ));
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Failed to update password: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUpdatingPassword(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const downloadAsText = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `student-passwords-${timestamp}.txt`;
    
    let content = `Student Password Report\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Total Students: ${students.length}\n`;
    content += `Students with Passwords: ${students.filter(s => s.password).length}\n`;
    content += `Students without Passwords: ${students.filter(s => !s.password).length}\n\n`;
    content += `${'='.repeat(60)}\n\n`;

    students.forEach((student, index) => {
      content += `${index + 1}. ${student.name}\n`;
      content += `   Class: ${student.class_name || 'No class assigned'}\n`;
      content += `   Username: ${student.username || student.name.toLowerCase().replace(/\s+/g, '-')}\n`;
      content += `   Password: ${student.password || 'No password set'}\n`;
      if (student.password_set_at) {
        content += `   Password Set: ${new Date(student.password_set_at).toLocaleString()}\n`;
      }
      content += `   Status: ${student.is_active ? 'Active' : 'Inactive'}\n`;
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `student-passwords-${timestamp}.csv`;
    
    let content = 'Name,Class,Username,Password,Password Set Date,Status\n';
    
    students.forEach(student => {
      const name = `"${student.name}"`;
      const className = `"${student.class_name || 'No class assigned'}"`;
      const username = `"${student.username || student.name.toLowerCase().replace(/\s+/g, '-')}"`;
      const password = `"${student.password || 'No password set'}"`;
      const passwordDate = `"${student.password_set_at ? new Date(student.password_set_at).toLocaleString() : ''}"`;
      const status = `"${student.is_active ? 'Active' : 'Inactive'}"`;
      
      content += `${name},${className},${username},${password},${passwordDate},${status}\n`;
    });

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-gray-900 text-white rounded-lg shadow-xl max-w-md w-full p-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p>Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-gray-900 text-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-300 mb-2">Error</h2>
            <p className="text-red-200">{error}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={loadStudents}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const studentsWithPasswords = students.filter(s => s.password).length;
  const studentsWithoutPasswords = students.filter(s => !s.password).length;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Close
            </button>
            <h1 className="text-2xl font-bold">Student Password Report</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
            </button>
            
            <button
              onClick={downloadAsText}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download TXT
            </button>
            
            <button
              onClick={downloadAsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400">Total Students</h3>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400">With Passwords</h3>
            <p className="text-2xl font-bold">{studentsWithPasswords}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400">Without Passwords</h3>
            <p className="text-2xl font-bold">{studentsWithoutPasswords}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-400">Active Students</h3>
            <p className="text-2xl font-bold">{students.filter(s => s.is_active).length}</p>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {student.name}
                      </div>
                      {student.email && (
                        <div className="text-sm text-gray-400">
                          {student.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {student.class_name || 'No class assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {student.username || student.name.toLowerCase().replace(/\s+/g, '-')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.password ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {showPasswords ? student.password : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(student.password!)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Copy password"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No password set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.is_active 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <button
                        onClick={() => generateNewPassword(student)}
                        disabled={updatingPassword === student.id}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs transition-colors"
                      >
                        {updatingPassword === student.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        {student.password ? 'Reset' : 'Generate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Generated on {new Date().toLocaleString()}</p>
          <p className="mt-1">
            Use the download buttons to export this report as a text file or CSV for easy sharing.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};
