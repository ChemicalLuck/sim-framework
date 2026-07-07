import { lintGutter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo, useRef } from 'react';
import type { TemplateLintContext } from '@chemicalluck/engine/features/linguistics/lib/lint';

import { templateExtensions } from './template-language';

const editorTheme = EditorView.theme(
  {
    '&': {
      fontSize: '12px',
      backgroundColor: '#27272a',
      color: '#e4e4e7',
      borderRadius: '4px',
      border: '1px solid #52525b',
    },
    '&.cm-focused': { outline: 'none', borderColor: '#a1a1aa' },
    '.cm-content': {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      padding: '6px 8px',
    },
    '.cm-gutters': { backgroundColor: '#27272a', border: 'none' },
    '.cm-activeLine': { backgroundColor: 'transparent' },
  },
  { dark: true },
);

/**
 * A CodeMirror editor for the template mini-language: brace-construct syntax
 * highlighting plus inline diagnostics. `context` lists the identifiers valid in
 * this authoring surface; it is read live by the linter so issues update as
 * macros/terms/features change elsewhere.
 */
export function TemplateEditor({
  value,
  onChange,
  context,
}: {
  value: string;
  onChange: (value: string) => void;
  context: TemplateLintContext;
}) {
  const ctxRef = useRef(context);
  ctxRef.current = context;

  const extensions = useMemo(
    () => [
      EditorView.lineWrapping,
      lintGutter(),
      ...templateExtensions(() => ctxRef.current),
    ],
    [],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={editorTheme}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
        autocompletion: false,
      }}
    />
  );
}
