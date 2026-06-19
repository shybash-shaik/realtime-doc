import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Type, List, CheckSquare, Code, Table as TableIcon } from 'lucide-react';

export default forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = index => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden w-64 text-sm font-sans z-50">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
              index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.icon}
            <div className="flex flex-col">
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-slate-500">{item.description}</span>
            </div>
          </button>
        ))
      ) : (
        <div className="px-4 py-3 text-slate-500 text-center">No results</div>
      )}
    </div>
  );
});
