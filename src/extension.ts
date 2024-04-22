// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
	createTextEditorDecoration,
	updateDecorationsBiggerSymbol,
	updateDecorationsTokens
} from './decoration';
import {
	DEFAULT_ENABLE_LANGID, DEFAULT_VARIABLE_ENABLE_LANGID, mayUseBiggerSymbol,
	DEFAULT_ENABLED_SYMBOLS, getEnabledSymbols,
	getSymbolKindAsKind,
	selectSymbols
} from './selectSymbols';
import { ALL_SYMBOLS, IBigSymbol, findSymbols, findTokens, findTokensLegend } from './symbols';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	let isDebug = context.workspaceState.get<boolean>('bigger-symbols.debug', false);
	let debug =  (...args: any[]) =>{
		if (!isDebug) {
			return;
		}
		var currentDate = '[' + new Date().toUTCString() + ']';
		console.log(currentDate, ...args);
	};
	console.log('bigger-symbols is now active!');

	let activeEditor = vscode.window.activeTextEditor;
	let activeColorTheme = vscode.window.activeColorTheme;
	let enabledSymbolKinds = vscode.workspace.getConfiguration("bigger-symbols").get("enabledSymbols", DEFAULT_ENABLED_SYMBOLS);
	let allowedLang = vscode.workspace.getConfiguration("bigger-symbols").get("allowedLanguages", DEFAULT_ENABLE_LANGID);
	let varAllowedLang = vscode.workspace.getConfiguration("bigger-symbols").get("variablesAllowedLanguages", DEFAULT_VARIABLE_ENABLE_LANGID);
	const symbolsDecorationsType = new Map<string, vscode.TextEditorDecorationType>();

	function createDecorations() {
		symbolsDecorationsType.set("modules", createTextEditorDecoration("Modules", activeColorTheme.kind));
		symbolsDecorationsType.set("namespaces", createTextEditorDecoration("Namespaces", activeColorTheme.kind));
		symbolsDecorationsType.set("classes", createTextEditorDecoration("Classes", activeColorTheme.kind));
		symbolsDecorationsType.set("constructors", createTextEditorDecoration("Constructors", activeColorTheme.kind));
		symbolsDecorationsType.set("methods", createTextEditorDecoration("Methods", activeColorTheme.kind));
		symbolsDecorationsType.set("functions", createTextEditorDecoration("Functions", activeColorTheme.kind));
		symbolsDecorationsType.set("closures", createTextEditorDecoration("Closures", activeColorTheme.kind));
		symbolsDecorationsType.set("enums", createTextEditorDecoration("Enums", activeColorTheme.kind));
		symbolsDecorationsType.set("structs", createTextEditorDecoration("Structs", activeColorTheme.kind));
		symbolsDecorationsType.set("interfaces", createTextEditorDecoration("Interfaces", activeColorTheme.kind));
		symbolsDecorationsType.set("variables", createTextEditorDecoration("Variables", activeColorTheme.kind));
	}
	createDecorations();

	let timeout: NodeJS.Timer | undefined = undefined;
	let isVisible = context.workspaceState.get<boolean>('bigger-symbols.visible', true);

	// Evaluate (prepare the list) and DRAW
	async function updateDecorations() {
		let symbols: IBigSymbol[] = [];
		let kindSymbols: IBigSymbol[];
		if (isVisible) {
			const selectedSymbols = getEnabledSymbols();
			symbols = await findSymbols(selectedSymbols);
		}

		let n: number = 0;
		for (const kind of enabledSymbolKinds) {
			if (mayUseBiggerSymbol(allowedLang, varAllowedLang, vscode.window.activeTextEditor, kind)) {
				kindSymbols = symbols.filter(s => s.sym.kind === getSymbolKindAsKind(kind));
			} else {
				kindSymbols = [];
			}

			if (kind === "Functions") {
				// treat nested functions as methods
				n += updateDecorationsBiggerSymbol(
					vscode.window.activeTextEditor,
					kindSymbols.filter(s => s.level > 1),
					symbolsDecorationsType.get("closures")!);
				// only pass top-level as real Functions decoration
				kindSymbols = kindSymbols.filter(s => s.level === 1);
			}

			n += updateDecorationsBiggerSymbol(
				vscode.window.activeTextEditor,
				kindSymbols,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				symbolsDecorationsType.get(kind.toLocaleLowerCase())!);
		}

		debug(`found ${symbols.length} symbols, updated ${n} symbols`);
		return;

		// TODO: bigger by semantic tokens
		// --------------------
		// let tokensLegend: vscode.SemanticTokensLegend | undefined;
		// tokensLegend = await findTokensLegend();
		// // console.log("tokensLegend:");
		// // console.log(tokensLegend);

		// let tokens: vscode.SemanticTokens | undefined;
		// tokens = await findTokens();
		// // console.log("tokens:");
		// // console.log(tokens);

		// await updateDecorationsTokens(vscode.window.activeTextEditor,tokens,tokensLegend);
		// console.log("updated tokens");
	}

	function triggerUpdateDecorations(throttle: boolean = false) {
		debug("setup trigger update, throttle:", throttle);
		// always schedule a new delayed task
		if (timeout) {
			clearTimeout(timeout);
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 150);
		} else {
			timeout = setTimeout(updateDecorations, 0);
		}
	}

	if (activeEditor) {
		triggerUpdateDecorations(true);
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			// NOTE: There is a race condition between lsp-plugins activating and us requesting symbols, (especially Python plugin, it starts quiet slowly)
			// because we always want to show decorations asap after switched to new tab, the race is unavoidable.
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.contentChanges.length === 0) {
			return;
		}
		if (activeEditor && event.document === activeEditor.document) {
			// updateDecorations();
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(cfg => {
		let needCreate: boolean = false;

		if (activeColorTheme.kind !== vscode.window.activeColorTheme.kind || cfg.affectsConfiguration("bigger-symbols")) {
			needCreate = true;
		}
		// update closure
		activeColorTheme = vscode.window.activeColorTheme;

		if (needCreate) {
			// update closure
			enabledSymbolKinds = vscode.workspace.getConfiguration("bigger-symbols").get("enabledSymbols", DEFAULT_ENABLED_SYMBOLS);
			allowedLang = vscode.workspace.getConfiguration("bigger-symbols").get("allowedLanguages", DEFAULT_ENABLE_LANGID);
			varAllowedLang = vscode.workspace.getConfiguration("bigger-symbols").get("variablesAllowedLanguages", DEFAULT_VARIABLE_ENABLE_LANGID);

			symbolsDecorationsType.forEach((value) => {
				value.dispose();
			});
			createDecorations();
			updateDecorations();
		}
	}));

	vscode.commands.registerCommand("bigger-symbols.toggleVisibility", () => {
		isVisible = !isVisible;
		context.workspaceState.update('bigger-symbols.visible', isVisible);
		updateDecorations();
	});

	vscode.commands.registerCommand("bigger-symbols.selectSymbols", async () => {
		if (await selectSymbols()) {
			updateDecorations();
		}
	});

	vscode.commands.registerCommand("bigger-symbols.toggleDebug", () => {
		isDebug = !isDebug;
		context.workspaceState.update('bigger-symbols.debug', isDebug);
	});
}

export function deactivate() {}

