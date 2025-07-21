import React, { useState } from 'react';
import api from '../../api/docs';

const PERMISSIONS = [
  { value: 'viewer', label: 'Viewer (read-only)' },
  { value: 'commenter', label: 'Commenter (can comment)' },
  { value: 'editor', label: 'Editor (can edit)' },
];

const ShareModal = ({ docId, onClose, shareInfo, setShareInfo }) => {
  const [permission, setPermission] = useState(shareInfo?.sharePermission || 'viewer');
  const [link, setLink] = useState(shareInfo?.link || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/docs/${docId}/share`, { permission });
      const shareToken = res.data.shareToken;
      const shareLink = `${window.location.origin}/documents/${docId}?token=${shareToken}`;
      setLink(shareLink);
      setShareInfo && setShareInfo({ sharePermission: permission, link: shareLink });
      setCopied(false);
    } catch (err) {
      setError('Failed to generate share link');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4">Share Document</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Permission:</label>
          <select
            value={permission}
            onChange={e => setPermission(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
          >
            {PERMISSIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Link'}
        </button>
        {link && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Shareable Link:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={link}
                readOnly
                className="flex-1 border border-gray-300 rounded p-2 bg-gray-100"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mt-2"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShareModal; 