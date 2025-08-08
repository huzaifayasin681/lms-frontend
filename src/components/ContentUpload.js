import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

const ContentUpload = ({ courseId, onUploadComplete, onClose }) => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file', 'url', 'text'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // File upload state
  const [files, setFiles] = useState([]);
  
  // URL upload state
  const [urlData, setUrlData] = useState({
    title: '',
    url: '',
    description: ''
  });
  
  // Text upload state
  const [textData, setTextData] = useState({
    title: '',
    text_content: ''
  });

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      const errors = file.errors.map(error => {
        switch (error.code) {
          case 'file-too-large':
            return 'File is too large (max 100MB)';
          case 'file-invalid-type':
            return 'File type not supported';
          default:
            return error.message;
        }
      }).join(', ');
      toast.error(`${file.file.name}: ${errors}`);
    });

    // Handle accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
      progress: 0,
      status: 'pending' // 'pending', 'uploading', 'completed', 'error'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Documents
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      // Images
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
      // Text & Code files
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/markdown': ['.md'],
      'text/html': ['.html'],
      'text/css': ['.css'],
      'text/javascript': ['.js'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],
      'text/x-python': ['.py'],
      'text/x-java-source': ['.java'],
      'text/x-c': ['.c', '.cpp', '.h'],
      'text/x-csharp': ['.cs'],
      'application/x-php': ['.php'],
      // Archives
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
      // Audio/Video
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'video/mp4': ['.mp4'],
      'video/avi': ['.avi'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileTitle = (fileId, title) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, title } : f
    ));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    for (const fileItem of files) {
      if (fileItem.status === 'completed') continue;
      
      try {
        // Update status
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        const formData = new FormData();
        formData.append('file', fileItem.file);
        formData.append('content_type', 'file');
        formData.append('title', fileItem.title);

        const result = await ApiService.uploadContent(courseId, formData, (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, progress } : f
          ));
        });

        // Update status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'completed', progress: 100 } : f
        ));

        toast.success(`${fileItem.file.name} uploaded successfully`);
        
      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error', progress: 0 } : f
        ));
        toast.error(`Failed to upload ${fileItem.file.name}: ${error.message}`);
      }
    }

    setUploading(false);
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const uploadUrl = async () => {
    if (!urlData.title || !urlData.url) {
      toast.error('Title and URL are required');
      return;
    }

    try {
      setUploading(true);
      await ApiService.uploadContent(courseId, {
        content_type: 'url',
        title: urlData.title,
        url: urlData.url,
        description: urlData.description
      });

      toast.success('URL added successfully');
      setUrlData({ title: '', url: '', description: '' });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      toast.error(`Failed to add URL: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const uploadText = async () => {
    if (!textData.title || !textData.text_content) {
      toast.error('Title and text content are required');
      return;
    }

    try {
      setUploading(true);
      await ApiService.uploadContent(courseId, {
        content_type: 'text',
        title: textData.title,
        text_content: textData.text_content
      });

      toast.success('Text content added successfully');
      setTextData({ title: '', text_content: '' });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      toast.error(`Failed to add text content: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-6 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Upload Course Content
              </h3>

              {/* Upload Mode Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { key: 'file', label: 'File Upload', icon: CloudArrowUpIcon },
                    { key: 'url', label: 'Add URL', icon: DocumentIcon },
                    { key: 'text', label: 'Text Content', icon: DocumentIcon }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setUploadMode(key)}
                      className={`${
                        uploadMode === key
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* File Upload Mode */}
              {uploadMode === 'file' && (
                <div className="space-y-6">
                  <div 
                    {...getRootProps()} 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                      isDragActive 
                        ? 'border-primary-400 bg-primary-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="space-y-1 text-center">
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <input {...getInputProps()} />
                        <p className="pl-1">
                          {isDragActive ? (
                            "Drop the files here..."
                          ) : (
                            <>
                              <span className="font-medium text-primary-600 hover:text-primary-500">
                                Upload files
                              </span>{" "}
                              or drag and drop
                            </>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Documents, Images, Text/Code files, Audio/Video, Archives up to 100MB
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, SVG, TXT, MD, HTML, CSS, JS, JSON, XML, PY, JAVA, C/C++, CS, PHP, MP3, WAV, MP4, AVI, MOV, ZIP, RAR, 7Z
                      </p>
                    </div>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Files to upload:</h4>
                      {files.map((fileItem) => (
                        <div key={fileItem.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              {getStatusIcon(fileItem.status)}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={fileItem.title}
                                  onChange={(e) => updateFileTitle(fileItem.id, e.target.value)}
                                  className="block w-full text-sm font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                                  placeholder="Enter title..."
                                />
                                <p className="text-sm text-gray-500">
                                  {fileItem.file.name} ({formatFileSize(fileItem.file.size)})
                                </p>
                                {fileItem.status === 'uploading' && (
                                  <div className="mt-2">
                                    <div className="bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${fileItem.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {fileItem.status === 'pending' && (
                              <button
                                onClick={() => removeFile(fileItem.id)}
                                className="ml-3 text-red-400 hover:text-red-600"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* URL Upload Mode */}
              {uploadMode === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={urlData.title}
                      onChange={(e) => setUrlData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 block w-full input-field"
                      placeholder="Enter link title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      URL *
                    </label>
                    <input
                      type="url"
                      value={urlData.url}
                      onChange={(e) => setUrlData(prev => ({ ...prev, url: e.target.value }))}
                      className="mt-1 block w-full input-field"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={urlData.description}
                      onChange={(e) => setUrlData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full input-field"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              )}

              {/* Text Upload Mode */}
              {uploadMode === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={textData.title}
                      onChange={(e) => setTextData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 block w-full input-field"
                      placeholder="Enter content title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Content *
                    </label>
                    <textarea
                      value={textData.text_content}
                      onChange={(e) => setTextData(prev => ({ ...prev, text_content: e.target.value }))}
                      rows={6}
                      className="mt-1 block w-full input-field"
                      placeholder="Enter your text content here..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {textData.text_content.length}/50000 characters
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    if (uploadMode === 'file') uploadFiles();
                    else if (uploadMode === 'url') uploadUrl();
                    else if (uploadMode === 'text') uploadText();
                  }}
                  disabled={uploading || (uploadMode === 'file' && files.length === 0)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 btn-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentUpload;