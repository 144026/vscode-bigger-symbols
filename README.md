# Bigger Symbols

Make class, function/method, structure, global variable declarations appear larger.

## How does it work

CSS injection on `textDecoration`.

```typescript
let activeEditor = vscode.window.activeTextEditor;
const symbols = await commands.executeCommand('vscode.executeDocumentSymbolProvider', activeEditor);
const decoType = window.createTextEditorDecorationType({ textDecoration: `;font-size:120%` });
activeEditor.setDecorations(decoType, symbols.forEach(s => s.selectionRange));
```

## Compatibility

Compatible with vscode >= 1.100 or vscode < 1.88, and any vscode-derived IDE alike, eg. Cursor.

The incompatible gap most likely due to this git commit, which has been resolved since vscode 1.100.

```
commit 5faa55a173571edace9b667b9f4dd5e3b5136de3
Author: ******* (not shown)
Date:   Mon Mar 11 12:47:38 2024 +0100

    Reapply "Refactors: Reduces assumptions about line height."
```

Other plugins relying on css injection have seen similar compatiblity [issues](https://github.com/hoovercj/vscode-power-mode/pull/114).

## Limitations

1. Text decorations, by design, are cleared when active editor change and re-rendered when editor switches back.
2. Text decorations can not change editor line height, symbols will look squashed if font size gets too big. https://github.com/microsoft/vscode/issues/131274
3. Only symbols from outline view are used. SemanticTokens stream maybe better, but not looked into. (getting full token
stream every time is too slow, and don't know how to filter out non-declaration tokens yet).

## Reference

1. css injection on `textDecoration`: https://github.com/microsoft/vscode/issues/9078#issuecomment-390512079
2. get DocumentSymbols, example: https://github.com/alefragnani/vscode-separators/blob/master/src/symbols.ts#L51
3. text decoration repainting problem: https://github.com/microsoft/vscode/issues/136241
4. "extra decoration" above current line: code lens api https://code.visualstudio.com/Docs/editor/editingevolved#_reference-information
5. *support dynamic line heights using decorations (merged but not available to extensions)*: https://github.com/microsoft/vscode/pull/194609
6. get SemanticTokens, API: https://code.visualstudio.com/api/references/commands
7. SemanticTokens.data[] organization: index.d.ts
8. semantic highlight: https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide
9. official decorator example: https://github.com/microsoft/vscode-extension-samples/tree/main/decorator-sample
