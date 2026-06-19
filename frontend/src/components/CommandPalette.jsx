import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/docs';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
      fetchDocs('');
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isOpen) {
        fetchDocs(query);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  const fetchDocs = async (searchQuery) => {
    try {
      setLoading(true);
      const res = await api.get('/docs', { params: { q: searchQuery } });
      setResults(res.data.slice(0, 8)); // Top 8 results
      setSelectedIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (doc) => {
    setIsOpen(false);
    navigate(`/documents/${doc.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    }
    if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 z-10"
          >
            <div className="flex items-center px-4 py-4 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search documents... (Cmd+K)"
                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 placeholder-slate-400"
              />
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 px-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading ? (
                <div className="text-center py-8 text-slate-500 text-sm">Searching...</div>
              ) : results.length > 0 ? (
                results.map((doc, index) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelect(doc)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                      index === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center mr-4 shrink-0 text-xl">
                      {doc.icon ? doc.icon : <FileText className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-blue-700' : 'text-slate-700'}`}>
                        {doc.title || 'Untitled'}
                      </span>
                      {doc.folder && (
                        <span className="text-xs text-slate-400 truncate mt-0.5">
                          in {doc.folder}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-sm">No documents found.</p>
                </div>
              )}
            </div>
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400 flex items-center gap-4">
              <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm font-sans font-medium text-slate-500">↑↓</kbd> to navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm font-sans font-medium text-slate-500">↵</kbd> to select</span>
              <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm font-sans font-medium text-slate-500">esc</kbd> to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
