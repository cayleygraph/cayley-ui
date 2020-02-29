import React, { useCallback, useEffect } from "react";
// eslint-disable-next-
import * as monaco from "monaco-editor";
import { monaco as monacoInit } from "@monaco-editor/react";
import MonacoEditor from "@monaco-editor/react";
import { Language } from "../queries";
import { Typography } from "@rmwc/typography";
import "@material/typography/dist/mdc.typography.css";
import { useEditor } from "../monaco-util";

// Setup monaco to use local monaco instead of CDN
monacoInit.config({
  urls: {
    monacoLoader: "/vs/loader.js",
    monacoBase: "/vs"
  }
});

const options: monaco.editor.IDiffEditorConstructionOptions = {
  minimap: { enabled: false }
};

type Props = {
  initialValue: string | null;
  language: Language;
  onChange: (value: string) => void;
  onRun: () => void;
};

/**
 * The query text editor
 */
const QueryEditor = ({ initialValue, language, onChange, onRun }: Props) => {
  const [onEditorMount, editor] = useEditor();

  const handleEditorMount = useCallback(
    (_, editor) => {
      onEditorMount(_, editor);
    },
    [onEditorMount]
  );

  // Define keyboard shortcuts
  useEffect(() => {
    if (editor) {
      registerRunShortcut(editor, onRun);
    }
  }, [editor, onRun]);

  // Sync with initialValue
  useEffect(() => {
    if (editor && initialValue) {
      editor.setValue(initialValue);
    }
  }, [editor, initialValue]);

  // Register onChange event
  useEffect(() => {
    let disposable: monaco.IDisposable | null = null;
    if (editor) {
      disposable = editor.onDidChangeModelContent(event => {
        onChange(editor.getValue());
      });
    }
    return () => {
      disposable?.dispose();
    };
  }, [editor, onChange]);

  return (
    <div className="QueryEditor">
      <Typography use="headline6">Query Editor</Typography>
      <MonacoEditor
        height={300}
        editorDidMount={handleEditorMount}
        language={queryLanguageToMonacoLanguage(language)}
        options={options}
        value={null}
      />
    </div>
  );
};

async function initMonaco(): Promise<void> {
  const [content, path] = await getGizmoDefinitions();
  const monacoInstance = await monacoInit.init();
  const {
    javascriptDefaults,
    ScriptTarget
  } = monacoInstance.languages.typescript;
  javascriptDefaults.setCompilerOptions({
    noLib: true,
    target: ScriptTarget.ES5,
    allowNonTsExtensions: true
  });
  javascriptDefaults.addExtraLib(content, path);
}

initMonaco();

export default QueryEditor;

const queryLanguageToMonacoLanguage = (
  language: Language | undefined
): string => {
  switch (language) {
    case "gizmo": {
      return "javascript";
    }
    case "graphql": {
      return "graphql";
    }
    case "mql": {
      return "json";
    }
    case undefined: {
      return "text";
    }
    default: {
      throw new Error(`Unexpected value ${language}`);
    }
  }
};

async function getGizmoDefinitions(): Promise<[string, string]> {
  const gizmoPath = `${process.env.PUBLIC_URL}/gizmo.d.ts`;
  const res = await fetch(gizmoPath);
  const content = await res.text();
  return [content, gizmoPath];
}

async function registerRunShortcut(
  editor: monaco.editor.IStandaloneCodeEditor,
  run: () => void
): Promise<void> {
  if (!editor) {
    return;
  }
  const monacoInstance = await monacoInit.init();
  editor.addAction({
    // An unique identifier of the contributed action.
    id: "cayley-run",

    // A label of the action that will be presented to the user.
    label: "Run",

    // An optional array of keybindings for the action.
    keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter],

    run: () => {
      run();
    }
  });
}