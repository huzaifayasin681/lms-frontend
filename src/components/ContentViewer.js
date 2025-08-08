import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

const ContentViewer = ({ content, onClose, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    if (content && content.content_type === 'file') {
      // Create file URL for viewing
      const url = `/api/content/${content.id}/file`;
      setFileUrl(url);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [content]);

  if (!content) return null;

  const getFileIcon = (mimeType) => {
    if (mimeType) {
      if (mimeType.startsWith('image/')) return <PhotoIcon className="h-6 w-6" />;
      if (mimeType.startsWith('video/')) return <FilmIcon className="h-6 w-6" />;
      if (mimeType.startsWith('audio/')) return <SpeakerWaveIcon className="h-6 w-6" />;
    }
    return <DocumentIcon className="h-6 w-6" />;
  };

  const canPreview = (mimeType) => {
    if (!mimeType) return false;
    
    const previewableMimes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'text/rtf',
      'text/html',
      'text/css',
      'text/javascript',
      'text/markdown',
      'application/json',
      'application/xml',
      'text/xml',
      'text/x-python',
      'text/x-java-source',
      'text/x-c',
      'text/x-csrc',
      'text/x-chdr',
      'text/x-csharp',
      'application/x-php'
    ];
    
    return previewableMimes.includes(mimeType) || 
           mimeType.startsWith('image/') || 
           mimeType.startsWith('audio/') || 
           mimeType.startsWith('video/') ||
           mimeType.startsWith('text/');
  };

  const renderFilePreview = () => {
    const mimeType = content.mime_type;
    
    if (mimeType && mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center items-center h-full">
          <img
            src={fileUrl}
            alt={content.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            onError={() => setError('Failed to load image')}
          />
        </div>
      );
    }
    
    if (mimeType === 'application/pdf') {
      return (
        <div className="w-full h-full">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 rounded-lg"
            title={content.title}
            onError={() => setError('Failed to load PDF')}
          />
        </div>
      );
    }
    
    if (mimeType === 'text/html') {
      return (
        <div className="w-full h-full bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">HTML Document</span>
            <div className="flex space-x-2">
              <button
                onClick={() => window.open(fileUrl, '_blank')}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Open in New Tab
              </button>
              <button
                onClick={() => onDownload && onDownload(content)}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
              >
                Download HTML
              </button>
            </div>
          </div>
          <iframe
            src={fileUrl}
            className="w-full h-full border border-gray-300 bg-white rounded"
            title={content.title}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            onError={() => setError('Failed to load HTML file. Try opening in new tab or downloading.')}
          />
        </div>
      );
    }
    
    if (mimeType && mimeType.startsWith('text/') || 
        mimeType === 'application/json' || 
        mimeType === 'application/xml') {
      return (
        <div className="w-full h-full bg-gray-50 rounded-lg p-4">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 bg-white rounded font-mono text-sm"
            title={content.title}
            onError={() => setError('Failed to load text file')}
          />
        </div>
      );
    }
    
    if (mimeType && mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <SpeakerWaveIcon className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-4">{content.title}</h3>
          <audio controls className="mb-4">
            <source src={fileUrl} type={mimeType} />
            Your browser does not support the audio element.
          </audio>
          <p className="text-sm text-gray-500">
            {content.file_name} • {content.file_size ? formatFileSize(content.file_size) : ''}
          </p>
        </div>
      );
    }
    
    if (mimeType && mimeType.startsWith('video/')) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <video controls className="max-w-full max-h-full rounded-lg shadow-lg">
            <source src={fileUrl} type={mimeType} />
            Your browser does not support the video element.
          </video>
          <p className="text-sm text-gray-500 mt-2">
            {content.file_name} • {content.file_size ? formatFileSize(content.file_size) : ''}
          </p>
        </div>
      );
    }
    
    // For non-previewable files, show download option
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        {getFileIcon(mimeType)}
        <h3 className="mt-4 text-lg font-medium text-gray-900">{content.title}</h3>
        <p className="mt-2 text-sm text-gray-500">
          This file type cannot be previewed in the browser.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {content.file_name} • {content.file_size ? formatFileSize(content.file_size) : ''}
        </p>
        <button
          onClick={() => onDownload && onDownload(content)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Download File
        </button>
      </div>
    );
  };

  const renderTextContent = () => {
    const textContent = content.content_data?.text || '';
    
    return (
      <div className="w-full h-full bg-white rounded-lg p-6">
        <div className="prose max-w-none h-full overflow-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{content.title}</h2>
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {textContent}
          </div>
        </div>
      </div>
    );
  };

  const renderUrlContent = () => {
    const url = content.content_data?.url || '';
    const description = content.content_data?.description || '';
    
    return (
      <div className="w-full h-full bg-white rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{content.title}</h2>
          
          {description && (
            <p className="text-gray-600 mb-6">{description}</p>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">External Link:</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline break-all"
            >
              {url}
            </a>
          </div>
          
          <div className="flex justify-center space-x-4">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Open Link
            </a>
          </div>
        </div>
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <ExclamationTriangleIcon className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error Loading Content</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          {content.content_type === 'file' && (
            <button
              onClick={() => onDownload && onDownload(content)}
              className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download Instead
            </button>
          )}
        </div>
      );
    }

    switch (content.content_type) {
      case 'file':
        return renderFilePreview();
      case 'text':
        return renderTextContent();
      case 'url':
        return renderUrlContent();
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Unknown content type</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        {/* Center the modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getFileIcon(content.mime_type)}
                <div className="ml-3">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {content.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {content.content_type === 'file' && content.file_name && (
                      <>
                        {content.file_name}
                        {content.file_size && ` • ${formatFileSize(content.file_size)}`}
                      </>
                    )}
                    {content.content_type === 'text' && 'Text Content'}
                    {content.content_type === 'url' && 'External Link'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {content.content_type === 'file' && (
                  <button
                    onClick={() => onDownload && onDownload(content)}
                    className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                    title="Download file"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  title="Close viewer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="bg-gray-50 px-4 py-5 sm:p-6" style={{ height: '70vh', minHeight: '500px' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentViewer;