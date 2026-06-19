import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Image, Smile, Trash2 } from 'lucide-react';
import api from '../../api/docs';

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
  'https://images.unsplash.com/photo-1557683316-973673baf926',
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e',
  'https://images.unsplash.com/photo-1508615039623-a25605d2b022'
];

export default function DocumentCover({ documentId, docObj, setDocObj, canEdit }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const updateDocument = async (updates) => {
    try {
      const res = await api.put(`/docs/${documentId}`, updates);
      setDocObj(res.data);
    } catch (err) {
      console.error('Failed to update document aesthetics', err);
    }
  };

  const handleEmojiSelect = (emojiData) => {
    updateDocument({ icon: emojiData.emoji });
    setShowEmojiPicker(false);
  };

  const handleCoverSelect = (url) => {
    updateDocument({ coverImage: url });
    setShowCoverPicker(false);
  };

  const hasCover = !!docObj?.coverImage;
  const hasIcon = !!docObj?.icon;

  return (
    <div className="relative group w-full flex flex-col mb-8">
      {/* Cover Image Area */}
      {hasCover && (
        <div className="w-full h-48 md:h-64 relative group/cover">
          <img src={docObj.coverImage} alt="Cover" className="w-full h-full object-cover" />
          {canEdit && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover/cover:opacity-100 transition-opacity flex gap-2">
              <button onClick={() => setShowCoverPicker(!showCoverPicker)} className="bg-white/80 backdrop-blur text-slate-700 px-3 py-1.5 rounded shadow text-sm font-medium hover:bg-white flex items-center gap-1.5">
                <Image className="w-4 h-4" /> Change Cover
              </button>
              <button onClick={() => updateDocument({ coverImage: '' })} className="bg-white/80 backdrop-blur text-red-600 px-3 py-1.5 rounded shadow text-sm font-medium hover:bg-white flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area Container for Icon and Title spacing */}
      <div className="max-w-4xl w-full mx-auto px-8 md:px-16 relative">
        
        {/* Icon Area */}
        {hasIcon && (
          <div className="relative group/icon -mt-12 mb-4 w-24 h-24 z-10">
            <div className="text-[72px] leading-none absolute -top-4">{docObj.icon}</div>
            {canEdit && (
              <div className="absolute top-0 right-0 opacity-0 group-hover/icon:opacity-100 transition-opacity bg-white/90 shadow rounded-md flex flex-col z-20">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 hover:bg-slate-100 rounded-t-md text-slate-600" title="Change Icon">
                  <Smile className="w-4 h-4" />
                </button>
                <button onClick={() => updateDocument({ icon: '' })} className="p-1.5 hover:bg-slate-100 rounded-b-md text-red-500" title="Remove Icon">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State Controls (When no cover or icon exists) */}
        {canEdit && (!hasCover || !hasIcon) && (
          <div className={`flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity ${hasCover ? 'mt-8' : 'mt-12'} ${hasIcon ? 'hidden' : 'mb-6'}`}>
            {!hasIcon && (
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 py-1 rounded text-sm font-medium flex items-center gap-1.5 transition-colors">
                <Smile className="w-4 h-4" /> Add Icon
              </button>
            )}
            {!hasCover && (
              <button onClick={() => setShowCoverPicker(!showCoverPicker)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 py-1 rounded text-sm font-medium flex items-center gap-1.5 transition-colors">
                <Image className="w-4 h-4" /> Add Cover
              </button>
            )}
          </div>
        )}

        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute z-50 mt-2 shadow-2xl rounded-lg">
            <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)}></div>
            <div className="relative z-50">
              <EmojiPicker onEmojiClick={handleEmojiSelect} />
            </div>
          </div>
        )}

        {/* Cover Picker Popup */}
        {showCoverPicker && (
          <div className="absolute z-50 mt-2 p-4 bg-white shadow-2xl rounded-xl border border-slate-200 w-80">
            <div className="fixed inset-0 z-40" onClick={() => setShowCoverPicker(false)}></div>
            <div className="relative z-50">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Gallery</h4>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_COVERS.map((url, i) => (
                  <button key={i} onClick={() => handleCoverSelect(url)} className="w-full h-16 rounded overflow-hidden hover:opacity-80 transition-opacity border border-slate-200">
                    <img src={url} alt={`Cover option ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Title Input */}
        {canEdit ? (
          <input
            type="text"
            className="w-full text-5xl font-extrabold text-slate-900 border-none outline-none bg-transparent placeholder-slate-200 resize-none mt-2"
            placeholder="Untitled"
            value={docObj?.title || ''}
            onChange={(e) => updateDocument({ title: e.target.value })}
          />
        ) : (
          <h1 className="w-full text-5xl font-extrabold text-slate-900 mt-2">{docObj?.title || 'Untitled'}</h1>
        )}
      </div>
    </div>
  );
}
