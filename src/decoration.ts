import { start } from "repl";
import {
    window, ColorThemeKind, TextEditor, Range, DocumentSymbol,
    TextEditorDecorationType, DecorationRenderOptions,
    DecorationRangeBehavior,
    workspace, Position,
    SymbolKind,
    SemanticTokens, SemanticTokensLegend,
} from "vscode";
import { IBigSymbol } from "./symbols";

export const NAMESPACE_SYMBOLS = [
    "Modules",
    "Namespaces",
    "Classes",
];

export const FUNCTION_SYMBOLS = [
    "Functions",
];

export const METHOD_SYMBOLS = [
    "Constructors",
    "Methods",
    "Closures",
];

export const STRUCT_SYMBOLS = [
    "Enums",
    "Structs",
    "Interfaces",
];

export function createTextEditorDecoration(symbolKind: string, themeKind: ColorThemeKind): TextEditorDecorationType {
    let css: string;
    let prefix: string;

    if (themeKind === ColorThemeKind.Dark) {
        prefix = "dark";
    } else if (themeKind === ColorThemeKind.Light) {
        prefix = "light";
    } else {
        /* non-existent */
        prefix = "other";
    }

    if (NAMESPACE_SYMBOLS.includes(symbolKind)) {
        css = workspace.getConfiguration("bigger-symbols").get(`${prefix}ThemeNamespaceCSS`, "font-size:120%; font-weight:bold");
    } else if (FUNCTION_SYMBOLS.includes(symbolKind)) {
        css = workspace.getConfiguration("bigger-symbols").get(`${prefix}ThemeFunctionCSS`, "font-size:120%");
    } else if (METHOD_SYMBOLS.includes(symbolKind)) {
        css = workspace.getConfiguration("bigger-symbols").get(`${prefix}ThemeMethodCSS`, "font-size:110%");
    } else if (STRUCT_SYMBOLS.includes(symbolKind)) {
        css = workspace.getConfiguration("bigger-symbols").get(`${prefix}ThemeStructCSS`, "font-size:120%");
    } else if ("Variables" === symbolKind) {
        css = workspace.getConfiguration("bigger-symbols").get(`${prefix}ThemeVariableCSS`, "font-size:110%");
    } else {
        css = "font-size:100%";
    }

    return window.createTextEditorDecorationType({
        isWholeLine: false,
        // be conservative about range update
        rangeBehavior: DecorationRangeBehavior.ClosedClosed,
        textDecoration: `;${css}`,
    });
}

// Nope, we cannot increase line height by prepending decorations before current line, it won't go above,
// but rather start at the start of current line.
// It's known issue that text decorations cannot change height of line yet,
// see: https://github.com/microsoft/vscode/issues/131274
const _gutterDeco = window.createTextEditorDecorationType({
    isWholeLine: true,
    borderWidth: `1px 0 20px 20px`,
    borderStyle: `solid`,
    borderColor: "#eeeeee",
    textDecoration: 'overline solid rgba(0, 0, 0, .2)',
    before: {
        height: '100%',
        margin: '0 26px 0 0',
        textDecoration: 'none'
    }
});


export function updateDecorationsBiggerSymbol(activeEditor: TextEditor | undefined,
    symbols: IBigSymbol[] | undefined,
    decorationType: TextEditorDecorationType) {

    if (!activeEditor) {
        return 0;
    }

    if (!symbols) {
        const bks: Range[] = [];
        activeEditor.setDecorations(decorationType, bks);
        return 0;
    }

    const ranges: Range[] = [];

    // console.log(symbols);
    for (const bigSymbol of symbols) {
        const symbol = bigSymbol.sym;
        const symbolRange: Range = symbol.selectionRange;
        // console.log(symbolRange);

        if (symbolRange.isEqual(symbol.range)) {
            // ideally language server should return LSP.DocumentSymbol[] instead of LSP.SymbolInformation[]
            // https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_documentSymbol
            // https://github.com/bash-lsp/bash-language-server/blob/cc72781b278ec351e00cf71736ee833249e35696/server/src/analyser.ts#L352
            // console.log("selectionRange same as Range, skip LSP.SymbolInformation symbol");
            continue;
        }
        if (symbolRange.start.isEqual(symbolRange.end)) {
            // console.log("skip empty symbol");
            continue;
        }
        if (symbolRange.start.line !== symbolRange.end.line) {
            // console.log("skip multiline symbol");
            continue;
        }

        ranges.push(symbolRange);
    }

    // deco type really only need to be created once, and we just set it on a list of symbol ranges
    // this way, when range changes, we just set it on a new list of ranges, so that normal text won't affected.
    activeEditor.setDecorations(decorationType, ranges);
    return ranges.length;
}


// TODO
// -----------------------
// be able to edit token edits, but need a better token provider... at least could distinguish between definition and callsite

function decorateTokensFunctionMethod(activeEditor: TextEditor | undefined, ranges: Range[] | undefined) {
    if (!activeEditor || !ranges) {
        return;
    }
    const decoType: TextEditorDecorationType = window.createTextEditorDecorationType({
        textDecoration: `;text-size-adjust:110%`
    });
    activeEditor.setDecorations(decoType, ranges);
}

function isTokensFunctionMethod(typeidx: number, tokensLegend: SemanticTokensLegend): boolean {
    if(tokensLegend.tokenTypes[typeidx] === "function") {
        return true;
    }
    if(tokensLegend.tokenTypes[typeidx] === "method") {
        return true;
    }
    return false;
}

export async function updateDecorationsTokens(activeEditor: TextEditor | undefined,
    tokens: SemanticTokens | undefined, tokensLegend: SemanticTokensLegend | undefined) {
    if (!activeEditor || !tokens || !tokensLegend) {
        return;
    }
    let line: number = 0;
    let startc: number = 0;
    let length: number = 0;
    // iterate through token stream, dispatch by token type to specific decorator
    let i: number = 0;
    while(i < tokens.data.length) {
        line += tokens.data[i];
        startc = tokens.data[i] === 0 ? (startc + tokens.data[i+1]) : tokens.data[i+1] ;
        length = tokens.data[i+2];
        const r: Range = new Range(line, startc, line, startc + length);
        if(isTokensFunctionMethod(tokens.data[i+3], tokensLegend)) {
            // console.log("T: %d, %d, %d, %s, %d", line, startc, length, tokensLegend.tokenTypes[tokens.data[i+3]], tokens.data[i+4]);
            decorateTokensFunctionMethod(activeEditor, [r]);
        } else {
            // console.log("F: %d, %d, %d, %s, %d", line, startc, length, tokensLegend.tokenTypes[tokens.data[i+3]], tokens.data[i+4]);
        }
        i += 5;
    }
}