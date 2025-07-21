import React from 'react';
import { EditorContent } from '@tiptap/react';

const DocumentEditor = ({ editor }) => (
  <div className="max-w-4xl mx-auto px-2 md:px-6 py-4 md:py-8">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[300px] md:min-h-[600px]">
      <EditorContent editor={editor} className="p-4 md:p-8" />
    </div>
  </div>
);

export default React.memo(DocumentEditor); 