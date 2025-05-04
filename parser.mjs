import { TokenStream } from "./TokenStream.mjs";

let tokenStream = new TokenStream();
let parserErrors = 0;

export function parse(inputTokens) {
	tokenStream = inputTokens;

	Program();

	console.log(`\nTotal NO of errors: ${parserErrors}`);
}

function expect(expectedType, ruleName, line = null) {
	if (tokenStream.matchWithSkip(expectedType)) {
		console.log(
			`Line : ${
				line ?? tokenStream.currentLine()
			} Matched         Rule used: ${ruleName}`
		);
		return true;
	} else {
		console.log(
			`Line : ${tokenStream.prevLine()} Not Matched     Expected: ${expectedType}`
		);
		parserErrors++;
		return false;
	}
}

function Program() {
	const line = tokenStream.currentLine();

	if (!tokenStream.matchWithSkip("Start Symbol")) {
		console.log(`Line : ${line} Not Matched     Expected Start Symbol`);
		parserErrors++;
		return false;
	}

	if (ClassDeclaration()) {
		return expect("End Symbol", "Program", line);
	}

	console.log(`Line : ${line} Not Matched     Expected: ClassDeclaration`);

	if (!tokenStream.matchWithSkip("End Symbol")) {
		console.log(`Line : ${line} Not Matched     Expected: End Symbol`);
		parserErrors++;
	}
	return false;
}

function ClassDeclaration() {
	const line = tokenStream.currentLine();
	if (!tokenStream.matchWithSkip("Class")) {
		console.log(`Line : ${line} Not Matched     Expected: Class keyword`);
		parserErrors++;
		return false;
	}

	if (!tokenStream.matchWithSkip("Identifier")) {
		console.log(`Line : ${line} Not Matched     Expected: Identifier`);
		parserErrors++;
		return false;
	}

	if (tokenStream.match("Inheritance")) {
		tokenStream.skip();
	}

	if (ClassBody()) {
		console.log(
			`Line : ${line ?? "??"} Matched         Rule used: ClassDeclaration`
		);
		return true;
	} else {
		console.log(`Line : ${line} Not Matched     Expected: ClassBody`);
		parserErrors++;
		return false;
	}
}

function ClassBody() {
	const line = tokenStream.currentLine();
	if (!tokenStream.matchWithSkip("Left Curly Braces")) {
		console.log(`Line : ${line} Not Matched     Expected '{'`);
		parserErrors++;
		return false;
	}

	let valid = ClassMembers();

	if (valid) {
		return expect("Right Curly Braces", "ClassBody");
	}

	if (!tokenStream.matchWithSkip("Right Curly Braces")) {
		console.log(
			`Line : ${tokenStream.currentLine()} Not Matched     Expected: Right Curly Braces`
		);
		parserErrors++;
	}
	return false;
}

function ClassMembers() {
	while (!tokenStream.match("Right Curly Braces")) {
		if (!ClassMember()) break;
	}
	return true;
}

function ClassMember() {
	// VariableDecl();

	MethodDecl();

	// FuncCall();
}

function VariableDecls() {
	if (VariableDecl()) {
		VariableDecls();
	}
}

function VariableDecl() {
	let valid = Type();

	if (!IDList()) valid = false;

	if (valid) {
		return expect("Semicolon", "VariableDecl");
	}

	if (!tokenStream.matchWithSkip("Semicolon")) {
		console.log(
			`Line : ${tokenStream.currentLine()} Not Matched     Expected: Semicolon`
		);
		parserErrors++;
	}
	return false;
}

function IDList() {
	if (!tokenStream.matchWithSkip("Identifier")) {
		console.log(
			`Line : ${tokenStream.currentLine()} Not Matched     Expected: Identifier`
		);
		parserErrors++;
		return false;
	}
	if (tokenStream.match("Comma")) {
		tokenStream.skip();
		IDList();
	}
}

function MethodDecl() {
	if (!FuncDecl()) return false;
	if (tokenStream.match("Left Curly Braces")) {
		tokenStream.skip();

		return expect("Right Curly Braces", "MethodDecl");
	} else return expect("Semicolon", "MethodDecl");
}

function FuncDecl() {
	let valid = Type();

	if (!tokenStream.matchWithSkip("Identifier")) {
		console.log(
			`Line : ${tokenStream.currentLine()} Not Matched     Expected: Identifier`
		);
		parserErrors++;

		valid = false;
	}

	if (!tokenStream.matchWithSkip("Left Parenthesis")) {
		console.log(
			`Line : ${tokenStream.currentLine()} Not Matched     Expected: Left Parenthesis`
		);
		parserErrors++;

		return;
	}
	valid = ParameterList();

	console.log(valid);
	if (valid) {
		return expect("Right Parenthesis", "FuncDecl");
	}

	if (!tokenStream.matchWithSkip("Right Parenthesis")) {
		console.log(
			`Line : ${tokenStream.currentLine()} Not Matched     Expected: Right Parenthesis`
		);
		parserErrors++;
	}
	return false;
}

function ParameterList() {
	if (!Parameter()) {
		return true;
	}
	if (tokenStream.match("Comma")) {
		tokenStream.skip();
		ParameterList();
	}
}

function Parameter() {
	if (!Type()) {
		tokenStream.back();
		return false;
	} else if (!tokenStream.matchWithSkip("Identifier")) {
		console.log(
			`Line : ${tokenStream.currentLine()} Not Matched     Expected: Identifier`
		);
		parserErrors++;
		return false;
	}
	return true;
}

function Type() {
	if (
		tokenStream.match("Integer") ||
		tokenStream.match("SInteger") ||
		tokenStream.match("Character") ||
		tokenStream.match("String") ||
		tokenStream.match("Float") ||
		tokenStream.match("SFloat") ||
		tokenStream.match("Void") ||
		tokenStream.match("Boolean")
	) {
		tokenStream.skip();
		return true;
	} else {
		tokenStream.skip();
		console.log(
			`Line : ${tokenStream.currentLine()} Not Matched     Expected: Invalid Type (${
				tokenStream.peek().text
			})`
		);
		parserErrors++;
		return false;
	}
}
