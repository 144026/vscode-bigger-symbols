import { commands, DocumentSymbol, SemanticTokens, SemanticTokensLegend, SymbolKind, TextDocument, window, workspace } from "vscode";

export const ALL_SYMBOLS = [
    "Modules",
    "Namespaces",
    "Classes",
    "Constructors",
    "Methods",
    "Functions",
    "Enums",
    "Structs",
    "Interfaces",
    "Variables"
];

const NESTED_SYMBOLS = [
    SymbolKind.Namespace,
    // C union mapped to class
    // SymbolKind.Class,
    SymbolKind.Constructor,
    SymbolKind.Method,
    SymbolKind.Function,
    SymbolKind.Enum,
    // C may have nested anonymous struct
    // SymbolKind.Struct,
    SymbolKind.Interface,
];

// there might be symbol definitions inside another definition
// set maxDepth to 1 for top-level only; set to 0 for infinite depth
function getSymbolsFrom(symbol: DocumentSymbol, level: number): DocumentSymbol[] {
    const symbols: DocumentSymbol[] = [];
    // TODO: different languages use different mappings, e.g., union in C is mapping to SymbolKind.Class.
    //       we always want class names bigger like functions, but leave it for now.
    if (level < 2 || NESTED_SYMBOLS.includes(symbol.kind)) {
        symbols.push(symbol);
    }

    const maxDepth: number = workspace.getConfiguration("bigger-symbols", window.activeTextEditor?.document).get("maxDepth", 1);
    if (maxDepth !== 0 && level >= maxDepth) {
        return symbols;
    }

    if (symbol.children.length === 0) {
        return symbols;
    }

    for (const children of symbol.children) {
        symbols.push(...getSymbolsFrom(children, level + 1));
    }
    return symbols;
}

export async function findSymbols(symbolsToFind: SymbolKind[]) {
    if (!window.activeTextEditor) {
        return [];
    }

    const docSymbols = await commands.executeCommand(
        'vscode.executeDocumentSymbolProvider',
        window.activeTextEditor.document.uri
    ) as DocumentSymbol[];

    if (!docSymbols) {
        return [];
    }

    const symbols: DocumentSymbol[] = [];
    const level = 1;

    for (const symbol of docSymbols) {
        symbols.push(...getSymbolsFrom(symbol, level));
    }

    // console.log("ALL symbols:");
    // console.log(symbols);
    const filteredSymbols = symbols
        ? symbols.filter(symbol => symbolsToFind.includes(symbol.kind))
        : [];

    // console.log("filtered symbols:");
    // console.log(filteredSymbols);
    return filteredSymbols;
}

export async function findTokens(): Promise<SemanticTokens | undefined> {
    if (!window.activeTextEditor) {
        return undefined;
    }

    const docTokens = await commands.executeCommand(
        'vscode.provideDocumentSemanticTokens',
        window.activeTextEditor.document.uri
    ) as SemanticTokens;

    if (!docTokens) {
        return undefined;
    }

    return docTokens;
}

export async function findTokensLegend(): Promise<SemanticTokensLegend | undefined> {
    if (!window.activeTextEditor) {
        return undefined;
    }
    const docTokensLegend = await commands.executeCommand(
        'vscode.provideDocumentSemanticTokensLegend',
        window.activeTextEditor.document.uri
    ) as SemanticTokensLegend;

    if (!docTokensLegend) {
        return undefined;
    }

    return docTokensLegend;
}