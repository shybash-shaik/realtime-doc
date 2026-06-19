import React from 'react';
import { EditorContent } from '@tiptap/react';

const DocumentEditor = ({ editor }) => (
  <div className="w-full prose prose-slate prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-600 focus:outline-none">
    <EditorContent editor={editor} className="min-h-[600px] outline-none" />
  </div>
);

export default React.memo(DocumentEditor);
