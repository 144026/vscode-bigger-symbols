import { QuickPickItem, SymbolKind, window, workspace, TextEditor } from "vscode";
import { ALL_SYMBOLS } from "./symbols";

export const DEFAULT_ENABLED_SYMBOLS = [
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

export const DEFAULT_ENABLE_LANGID = [
    "c",
    "csharp",
    "cpp",
    "cuda-cpp",
    "go",
    "java",
    "javascript",
    "lua",
    "objective-c",
    "objective-cpp",
    "python",
    "perl",
    "ruby",
    "rust",
    "typescript"
];

export const DEFAULT_VARIABLE_ENABLE_LANGID = [
    "c",
    "csharp",
    "cpp",
    "objective-c"
];

export function mayUseBiggerSymbol(allowedLang: string[], varAllowedLang: string[],
    activeEditor: TextEditor | undefined, kind: string) {

    if (!activeEditor) {
        return false;
    }

    if (!allowedLang.includes(activeEditor.document.languageId)) {
        return false;
    }

    if (kind !== "Variables") {
        return true;
    } else {
        return varAllowedLang.includes(activeEditor.document.languageId);
    }
}

export async function showSelectSymbolsQuickPick(selectedSymbols: string[]): Promise<string[] | undefined> {
    const allSymbols: QuickPickItem[] = ALL_SYMBOLS.map(sym => {
        return {
            label: sym,
            picked: selectedSymbols.includes(sym)
        };
    });

    const picked = await window.showQuickPick(allSymbols, {
        placeHolder: "Select which symbols should use bigger font size",
        canPickMany: true
    });
    if (!picked) {
        return undefined;
    }

    if (picked.length === 0) {
        return [];
    }

    return picked?.map(item => item.label);
}

function selectionAreEquivalent(a: string[], b: string[]) : boolean {
    if (!a || !b) {
        return false;
    }
    if (a.length !== b.length) {
        return false;
    }
    return a.sort().join(",") === b.sort().join(",");
}

export async function selectSymbols(): Promise<boolean> {
    const selected = workspace.getConfiguration("bigger-symbols", window.activeTextEditor?.document).get("enabledSymbols", DEFAULT_ENABLED_SYMBOLS);
    const pick = await showSelectSymbolsQuickPick(selected);

    if (!pick) {
        return false;
    }

    if (selectionAreEquivalent(pick, selected)) {
        return false;
    }

    workspace.getConfiguration("bigger-symbols").update("enabledSymbols", pick);
    return true;
}


export function getSymbolKindAsKind(kind: string): SymbolKind {
    switch (kind) {
        case "Modules":
            return SymbolKind.Module;
        case "Namespaces":
            return SymbolKind.Namespace;
        case "Classes":
            return SymbolKind.Class;
        case "Constructors":
            return SymbolKind.Constructor;
        case "Methods":
            return SymbolKind.Method;
        case "Functions":
            return SymbolKind.Function;
        case "Enums":
            return SymbolKind.Enum;
        case "Structs":
            return SymbolKind.Struct;
        case "Interfaces":
            return SymbolKind.Interface;
        case "Variables":
            return SymbolKind.Variable;

        default:
            return SymbolKind.Object;
    }
}

export function getEnabledSymbols(): SymbolKind[] {
    const symbols = workspace.getConfiguration("bigger-symbols", window.activeTextEditor?.document).get("enabledSymbols", DEFAULT_ENABLED_SYMBOLS);
    const symbolsKind: SymbolKind[] = [];
    symbols.forEach(symbol => {
        symbolsKind.push(getSymbolKindAsKind(symbol));
    });
    return symbolsKind;
}