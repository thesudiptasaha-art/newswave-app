'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { normalizeEditorHtml, scriptToHtml } from '../../utils/scriptRich';
import { useEffect, useRef } from 'react';

export default function ScriptEditor({ value, onChange, onBlur, autoFocus }) {
  const isInitialRender = useRef(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        italic: false,
        strike: false,
        dropcursor: false,
        gapcursor: false,
        link: false,
        trailingNode: false,
        listKeymap: false,
      }),
      Highlight.configure({ multicolor: false }),
    ],
    content: scriptToHtml(value),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      onChangeRef.current(normalizeEditorHtml(editor.getHTML()));
    },
    onBlur: () => {
      if (onBlurRef.current) onBlurRef.current();
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[400px] text-[16px] leading-8 font-medium w-full resize-y',
        style: 'font-family: Georgia, "Noto Serif Bengali", "Times New Roman", serif;',
      },
    },
  });
  
  useEffect(() => {
    if (editor && autoFocus && isInitialRender.current) {
      editor.commands.focus('end');
      isInitialRender.current = false;
    }
  }, [editor, autoFocus]);

  if (!editor) return null;

  const preventFocus = (e) => e.preventDefault();
  const btnClass = (isActive) => `flex min-w-[36px] min-h-[36px] items-center justify-center rounded text-[15px] font-semibold transition-colors border ${isActive ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border-transparent'}`;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/40 overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-colors">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] bg-white/[0.02] p-2">
        <button
          onMouseDown={preventFocus}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          onMouseDown={preventFocus}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
        >
          <span className="underline underline-offset-2">U</span>
        </button>
        <button
          onMouseDown={preventFocus}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={btnClass(editor.isActive('highlight'))}
          title="Highlight (Ctrl+Shift+H)"
        >
          <span className="bg-yellow-400 text-black px-1 rounded-sm text-[12px] font-bold">H</span>
        </button>
      </div>
      
      <div 
        className="p-4 relative" 
        style={{ fontFamily: 'Georgia, "Noto Serif Bengali", "Times New Roman", serif' }}
      >
        {editor.isEmpty ? (
          <div className="pointer-events-none absolute text-zinc-500 left-4 top-4 mt-2 mb-2 leading-8 text-[16px] font-medium opacity-70">
            Write the script...
          </div>
        ) : null}
        <style dangerouslySetInnerHTML={{__html: `
          .tiptap p { margin-bottom: 1.25rem; }
          .tiptap p:last-child { margin-bottom: 0; }
          .tiptap mark { background-color: #facc15; color: #111827; border-radius: 4px; padding: 0 2px; }
        `}} />
        <EditorContent editor={editor} className="tiptap" />
      </div>
    </div>
  );
}
