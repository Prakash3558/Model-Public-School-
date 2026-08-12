import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { Edit3, Save, X } from 'lucide-react';

interface EditableTextProps {
  blockKey: string;
  defaultText: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = React.memo(({
  blockKey,
  defaultText,
  className = '',
  as = 'span',
  multiline = false
}) => {
  const { isEditMode } = useAuth();
  const { getContentBlock, updateContentBlock } = useCMS();
  const textValue = getContentBlock(blockKey, defaultText);

  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(textValue);

  if (!isEditMode) {
    const Component = as;
    if (!textValue) return null;
    return <Component className={className}>{textValue}</Component>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateContentBlock(blockKey, tempValue);
    setIsEditing(false);
  };

  const Component = as;

  if (!isEditing) {
    return (
      <Component
        onClick={() => {
          setTempValue(textValue);
          setIsEditing(true);
        }}
        className={`relative group cursor-pointer border border-dashed border-amber-400/60 hover:border-amber-500 rounded px-1.5 py-0.5 transition-all bg-amber-50/20 dark:bg-amber-900/10 ${as === 'span' ? 'inline-block' : ''} ${className}`}
        title="Click to Edit & Save Text"
      >
        {textValue ? (
          textValue
        ) : (
          <span className="italic text-amber-600 dark:text-amber-400 font-sans text-xs bg-amber-100/50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
            [Empty Text - Click to Edit]
          </span>
        )}
        <span className="absolute -top-3 -right-2 bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20 pointer-events-none flex items-center gap-1">
          <Edit3 className="w-3 h-3" /> Edit & Save
        </span>
      </Component>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 z-30 relative my-1">
      <form onSubmit={handleSave} className="inline-flex flex-wrap items-center gap-1.5">
        {multiline ? (
          <textarea
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            className="p-2 border-2 border-amber-500 rounded-xl text-slate-900 bg-white font-sans text-xs sm:text-sm min-w-[280px] min-h-[90px] shadow-xl focus:outline-none"
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            className="p-2 border-2 border-amber-500 rounded-xl text-slate-900 bg-white font-sans text-xs sm:text-sm min-w-[220px] shadow-xl focus:outline-none font-bold"
            autoFocus
          />
        )}
        <button
          type="submit"
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1 transition-all"
          title="Save Text Changes"
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-2.5 py-1.5 bg-slate-500 hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1 transition-all"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </form>
    </span>
  );
});

