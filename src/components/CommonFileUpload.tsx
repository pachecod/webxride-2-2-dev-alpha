import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase, getFileType, getContentType, validateFileSize } from '../lib/supabase';
import { resizeImage } from '../lib/image-utils';

interface CommonFileUploadProps {
  onUploadComplete: (url: string) => void;
  onFilesChanged: () => void;
}

export const CommonFileUpload: React.FC<CommonFileUploadProps> = ({ onUploadComplete, onFilesChanged }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceInfo, setSourceInfo] = useState('');
  const [showSourceFields, setShowSourceFields] = useState(false);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setIsUploading(true);
    setTotalFiles(files.length);
    setCurrentFileIndex(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFileIndex(i);
      
      try {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '-');
        const uniqueId = Date.now();
        const fileName = `${sanitizedName}_${uniqueId}.${extension}`;
        const fileType = getFileType(extension);
        
        // Validate file size before upload
        const sizeValidation = validateFileSize(file, fileType);
        if (!sizeValidation.valid) {
          console.error('File size validation failed:', sizeValidation.error);
          alert(sizeValidation.error);
          continue; // Skip this file and continue with the next one
        }
        
        const filePath = `common-assets/${fileType}/${fileName}`;
        const contentType = file.type || getContentType(extension);

        // If image, generate preview and thumbnail
        if (fileType === 'images') {
          // Generate preview (600px wide)
          const previewBlob = await resizeImage(file, 600, 0.85);
          const previewName = `${sanitizedName}_${uniqueId}_preview.jpg`;
          const previewPath = `common-assets/${fileType}/${previewName}`;
          await supabase.storage.from('files').upload(previewPath, previewBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          });

          // Generate thumbnail (100px wide, lower quality for faster loading)
          const thumbBlob = await resizeImage(file, 100, 0.6);
          const thumbName = `${sanitizedName}_${uniqueId}_thumb.jpg`;
          const thumbPath = `common-assets/${fileType}/${thumbName}`;
          await supabase.storage.from('files').upload(thumbPath, thumbBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          });
        }

        const metadata = {
          sourceUrl: sourceUrl.trim() || null,
          sourceInfo: sourceInfo.trim() || null,
          uploadedBy: 'admin',
          uploadedAt: new Date().toISOString()
        };
        
        console.log('Common upload with metadata:', metadata);

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType,
            metadata: {
              sourceUrl: metadata.sourceUrl,
              sourceInfo: metadata.sourceInfo,
              uploadedBy: metadata.uploadedBy,
              uploadedAt: metadata.uploadedAt
            }
          });

        if (uploadError) {
          console.error(`Upload error for ${file.name}:`, uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);

        console.log(`Successfully uploaded ${file.name} to common assets, public URL:`, publicUrl);
        onUploadComplete(publicUrl);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
        alert(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    setTotalFiles(0);
    setCurrentFileIndex(0);
    setIsModalOpen(false);
    // Reset source fields
    setSourceUrl('');
    setSourceInfo('');
    setShowSourceFields(false);
    onFilesChanged();
  };

  const handleSingleFileSelect = () => {
    singleFileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    handleFiles(files);
    event.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      handleFiles(files);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        title="Upload files to common assets"
      >
        <Upload size={16} />
        <span>Upload to Common Assets</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Upload to Common Assets</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-sm text-gray-400 mb-4">
              <p className="mb-2">Upload files to common assets. These files will be available to all users.</p>
              <div className="text-xs bg-gray-700 p-3 rounded">
                <p className="font-semibold mb-1">File size limits:</p>
                <p>• Images: 10MB max</p>
                <p>• Audio: 50MB max</p>
                <p>• 3D Models: 100MB max</p>
                <p>• Other files: 25MB max</p>
              </div>
            </div>

            {isUploading ? (
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentFileIndex / totalFiles) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="text-white mb-2">
                  Uploading {currentFileIndex + 1} of {totalFiles} files...
                </p>
                <p className="text-gray-400 text-sm">
                  Please wait while files are being uploaded to common assets.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Source Attribution Section */}
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300">Source Attribution (Optional)</h3>
                    <button
                      onClick={() => setShowSourceFields(!showSourceFields)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {showSourceFields ? 'Hide' : 'Add Source Info'}
                    </button>
                  </div>
                  
                  {showSourceFields && (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="commonSourceUrl" className="block text-xs text-gray-400 mb-1">
                          Source URL
                        </label>
                        <input
                          type="url"
                          id="commonSourceUrl"
                          value={sourceUrl}
                          onChange={(e) => setSourceUrl(e.target.value)}
                          placeholder="https://example.com/source"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="commonSourceInfo" className="block text-xs text-gray-400 mb-1">
                          Source Information
                        </label>
                        <textarea
                          id="commonSourceInfo"
                          value={sourceInfo}
                          onChange={(e) => setSourceInfo(e.target.value)}
                          placeholder="Artist name, license, attribution requirements, etc."
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-white mb-2">Drop files here or click to select</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Files will be uploaded to common assets and available to all users
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleSingleFileSelect}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Select Files
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={singleFileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
          </div>
        </div>
      )}
    </>
  );
}; 