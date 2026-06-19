import React from 'react';
import { Bold, Italic, List, ListOrdered, Code, Table as TableIcon, MessageCircle } from 'lucide-react';

const DocumentToolbar = ({ editor, onAddComment }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center bg-slate-100/50 p-1 rounded-lg">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1"></div>

      <div className="flex items-center bg-slate-100/50 p-1 rounded-lg">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1"></div>

      <div className="flex items-center bg-slate-100/50 p-1 rounded-lg">
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive('codeBlock') ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1"></div>

      <button
        onClick={onAddComment}
        className={`p-1.5 rounded-lg transition-all border flex items-center shadow-sm ${!editor.state.selection.empty ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'}`}
        disabled={editor.state.selection.empty}
        title="Add comment to selected text"
      >
        <MessageCircle className="w-4 h-4 mr-1.5" />
        <span className="text-xs font-medium pr-1">Comment</span>
      </button>
    </div>
  );
};

export default React.memo(DocumentToolbar);
