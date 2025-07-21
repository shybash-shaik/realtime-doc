import React from 'react';
import { Bold, Italic, List, ListOrdered, Code, Table as TableIcon } from 'lucide-react';

const DocumentToolbar = ({ editor, onAddComment }) => (
  <div className="bg-white border-b border-gray-200 px-2 md:px-6 py-2 flex flex-wrap md:flex-nowrap items-center space-x-2 md:space-x-2 space-y-2 md:space-y-0">
    <div className="flex flex-wrap items-center space-x-2 md:space-x-2 space-y-2 md:space-y-0 w-full md:w-auto">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
      >
        <Code className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="p-2 rounded hover:bg-gray-100"
      >
        <TableIcon className="w-4 h-4" />
      </button>
      {/* Add Comment Button */}
      {onAddComment && (
        <button
          onClick={onAddComment}
          disabled={!editor || editor.state.selection.empty}
          className={`p-2 rounded ${editor && !editor.state.selection.empty ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          title="Add comment to selected text"
        >
          💬
        </button>
      )}
    </div>
  </div>
);

export default DocumentToolbar; 