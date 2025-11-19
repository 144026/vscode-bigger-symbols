# Bigger Symbols

> NOTE: Incompatible with vscode 1.88 (2024 March version) ~ 1.99 (2025 March version).

Make class, function, methods, structure declarations appear larger.

## Acknowledgement

This extension draws heavily on alefragnani/vscode-separators, huge thanks.

## How does it work

CSS injection on `textDecoration`.

```typescript
let activeEditor = vscode.window.activeTextEditor;
const symbols = await commands.executeCommand('vscode.executeDocumentSymbolProvider', activeEditor);
const decoType = window.createTextEditorDecorationType({ textDecoration: `;font-size:120%` });
activeEditor.setDecorations(decoType, symbols.forEach(s => s.selectionRange));
```

> NOTE: `font-size` css injection no longer works since vscode 1.88+, probably after this commit:

```
commit 5faa55a173571edace9b667b9f4dd5e3b5136de3
Author: Henning Dieterichs <hdieterichs@microsoft.com>
Date:   Mon Mar 11 12:47:38 2024 +0100

    Reapply "Refactors: Reduces assumptions about line height."
```

Other plugins relying on css injection have seen similar reports:
https://github.com/hoovercj/vscode-power-mode/pull/114

As of vscode 1.100+ (2025 April version), this problem has been resolved.

## Limitations

1. Text decoration gets cleared when active editor gets switched.
2. Line height cannot be variant, symbols looks squashed if font size gets too big: https://github.com/microsoft/vscode/issues/131274
3. Currently only symbols from outline view are used. SemanticTokens stream maybe better, but not looked into. (getting full token
stream every time is too slow, and don't know how to filter out non-declaration tokens yet).

## Reference

1. css injection on `textDecoration`: https://github.com/microsoft/vscode/issues/9078#issuecomment-390512079
2. get DocumentSymbols, example: https://github.com/alefragnani/vscode-separators/blob/master/src/symbols.ts#L51
3. text decoration repainting problem: https://github.com/microsoft/vscode/issues/136241
4. "extra decoration" above current line: code lens api https://code.visualstudio.com/Docs/editor/editingevolved#_reference-information
5. *support dynamic line heights using decorations (work in progress)*: https://github.com/microsoft/vscode/pull/194609
6. get SemanticTokens, API: https://code.visualstudio.com/api/references/commands
7. SemanticTokens.data[] organization: index.d.ts
8. semantic highlight: https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide
9. official decorator example: https://github.com/microsoft/vscode-extension-samples/tree/main/decorator-sample
