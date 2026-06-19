import React, { useState } from 'react';
import api from '../../api/docs';
import toast from 'react-hot-toast';
import { X, Copy, Check, Link as LinkIcon, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PERMISSIONS = [
  { value: 'viewer', label: 'Viewer (read-only)', desc: 'Can view but not edit' },
  { value: 'commenter', label: 'Commenter', desc: 'Can add comments only' },
  { value: 'editor', label: 'Editor', desc: 'Can make changes directly' },
];

const ShareModal = ({ docId, onClose, shareInfo, setShareInfo }) => {
  const [permission, setPermission] = useState(shareInfo?.sharePermission || 'viewer');
  const [link, setLink] = useState(shareInfo?.link || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/docs/${docId}/share`, { permission });
      const shareToken = res.data.shareToken;
      const shareLink = `${window.location.origin}/documents/${docId}?token=${shareToken}`;
      setLink(shareLink);
      setShareInfo && setShareInfo({ sharePermission: permission, link: shareLink });
      setCopied(false);
      toast.success('Share link generated successfully!');
    } catch (err) {
      toast.error('Failed to generate share link');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md relative border border-slate-200"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Share Document</h2>
              <p className="text-sm text-slate-500">Generate a link to collaborate.</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 mb-2 font-semibold text-slate-700 text-sm">
              <Shield className="w-4 h-4 text-slate-400" />
              Access Level
            </label>
            <div className="space-y-2">
              {PERMISSIONS.map(p => (
                <label 
                  key={p.value} 
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${permission === p.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${permission === p.value ? 'border-blue-500' : 'border-slate-300'}`}>
                      {permission === p.value && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <span className={`font-medium ${permission === p.value ? 'text-blue-800' : 'text-slate-700'}`}>{p.label}</span>
                  </div>
                  <span className="text-xs text-slate-500 ml-7 mt-0.5">{p.desc}</span>
                  <input
                    type="radio"
                    name="permission"
                    value={p.value}
                    checked={permission === p.value}
                    onChange={(e) => setPermission(e.target.value)}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </div>

          {link ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
              <label className="block mb-2 font-semibold text-slate-700 text-sm">Shareable Link</label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="text"
                  value={link}
                  readOnly
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-600 focus:outline-none"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full px-4 py-3.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
              disabled={loading}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : 'Generate Link'}
            </button>
          )}

          {link && (
            <button
              onClick={handleGenerate}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
              disabled={loading}
            >
              Regenerate Link with {PERMISSIONS.find(p => p.value === permission)?.label} Access
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;