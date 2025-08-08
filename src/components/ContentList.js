import React, { useState } from 'react';
import {
  DocumentIcon,
  LinkIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import ConfirmModal from './ConfirmModal';
import ContentViewer from './ContentViewer';
import toast from 'react-hot-toast';

const ContentList = ({ content, loading, onEdit, onDelete, onRefresh }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewingContent, setViewingContent] = useState(null);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-gray-200 pb-4">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <DocumentIcon />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No content found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading your first piece of content.
          </p>
        </div>
      </div>
    );
  }

  const getContentIcon = (contentType, mimeType) => {
    if (contentType === 'file') {
      if (mimeType && mimeType.startsWith('image/')) {
        return <PhotoIcon className="h-5 w-5 text-blue-500" />;
      }
      return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    } else if (contentType === 'url') {
      return <LinkIcon className="h-5 w-5 text-green-500" />;
    } else if (contentType === 'text') {
      return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
    }
    return <DocumentIcon className="h-5 w-5 text-gray-500" />;
  };

  const getContentTypeBadge = (contentType) => {
    const badges = {
      file: 'bg-blue-100 text-blue-800',
      url: 'bg-green-100 text-green-800',
      text: 'bg-purple-100 text-purple-800'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      badges[contentType] || 'bg-gray-100 text-gray-800'
    }`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleView = (item) => {
    setViewingContent(item);
  };

  const handleDownload = (item) => {
    if (item.content_type === 'file') {
      const link = document.createElement('a');
      link.href = `/api/content/${item.id}/file?download=true`;
      link.download = item.file_name || item.title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const getContentPreview = (item) => {
    if (item.content_type === 'url') {
      return item.content_data?.url || '';
    } else if (item.content_type === 'text') {
      const text = item.content_data?.text || '';
      return text.length > 100 ? `${text.substring(0, 100)}...` : text;
    } else if (item.content_type === 'file') {
      return `${item.file_name || ''} ${item.file_size ? `(${formatFileSize(item.file_size)})` : ''}`;
    }
    return '';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flow-root">
          <ul role="list" className="-my-4 divide-y divide-gray-200">
            {content.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getContentIcon(item.content_type, item.mime_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <span className={getContentTypeBadge(item.content_type)}>
                        {item.content_type.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 truncate">
                      {getContentPreview(item)}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                      <span>Uploaded {formatDate(item.upload_date)}</span>
                      {item.file_size && (
                        <span>{formatFileSize(item.file_size)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleView(item)}
                      className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                      title="View content"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {item.content_type === 'file' && (
                      <button
                        onClick={() => handleDownload(item)}
                        className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        title="Download file"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => onEdit && onEdit(item)}
                      className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Edit content"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => setDeleteConfirm(item)}
                      className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete content"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Content"
          message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          danger
        />
      )}

      {/* Content Viewer Modal */}
      {viewingContent && (
        <ContentViewer
          content={viewingContent}
          onClose={() => setViewingContent(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default ContentList;