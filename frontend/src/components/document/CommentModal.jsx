import React, { useEffect, useRef, useState } from 'react';

const CommentModal = ({ anchor, onSubmit, onClose }) => {
  const [comment, setComment] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (comment.trim()) onSubmit(comment.trim());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [comment, onClose, onSubmit]);

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
        <h2 className="text-lg font-semibold mb-2">Add Comment</h2>
        <div className="mb-2 text-sm text-gray-600">
          <span className="font-medium">Selected text:</span> <span className="italic">{anchor?.text}</span>
        </div>
        <textarea
          ref={textareaRef}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Type your comment..."
          rows={3}
          className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => comment.trim() && onSubmit(comment.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!comment.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal; 