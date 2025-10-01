import React, { useState, useEffect } from 'react';
import { Save, Star, X, AlertTriangle } from 'lucide-react';
import { setDefaultTemplate, findTemplateByName } from '../lib/supabase';

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateName: string, setAsDefault: boolean) => void;
  currentTemplateName: string;
  selectedUser: string | null;
  isAdmin?: boolean;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTemplateName,
  selectedUser,
  isAdmin = false
}) => {
  const [templateName, setTemplateName] = useState(currentTemplateName);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingTemplate, setExistingTemplate] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check if template exists when name changes
  useEffect(() => {
    const checkTemplateExists = async () => {
      if (!templateName.trim()) {
        setExistingTemplate(null);
        return;
      }
      
      setIsChecking(true);
      try {
        const found = await findTemplateByName(templateName);
        setExistingTemplate(found);
      } catch (error) {
        console.error('Error checking template existence:', error);
        setExistingTemplate(null);
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkTemplateExists, 500);
    return () => clearTimeout(timeoutId);
  }, [templateName]);

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Template name is required.');
      return;
    }

    setIsSaving(true);
    try {
      // Call the parent save function
      await onSave(templateName, setAsDefault);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setTemplateName(currentTemplateName);
    setSetAsDefault(false);
    setExistingTemplate(null);
    onClose();
  };

  if (!isOpen) return null;

  const isUpdating = existingTemplate && existingTemplate.name.toLowerCase() === templateName.toLowerCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Save size={20} />
            {isUpdating ? 'Update Template' : 'Save as Template'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-300 mb-2">
              Template Name
            </label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter template name..."
              autoFocus
            />
            {isChecking && (
              <p className="text-sm text-gray-400 mt-1">Checking...</p>
            )}
          </div>

          {existingTemplate && !isChecking && (
            <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-700 rounded text-sm text-yellow-300">
              <AlertTriangle size={16} />
              <span>
                A template named "{existingTemplate.name}" already exists. 
                {isUpdating ? ' This will update the existing template.' : ' This will create a new template.'}
              </span>
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-3 p-3 bg-gray-700 rounded border border-gray-600">
              <input
                id="setAsDefault"
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="setAsDefault" className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <Star size={16} className="text-yellow-400" />
                <span>Set as default template for new users</span>
              </label>
            </div>
          )}

          {setAsDefault && (
            <div className="p-3 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-300">
              <p>This template will be automatically loaded when new users select their name for the first time.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-2 disabled:opacity-50"
            disabled={isSaving || !templateName.trim() || isChecking}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isUpdating ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {isUpdating ? 'Update Template' : 'Save Template'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 