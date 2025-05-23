import { main } from "./index.mjs";
import { TokenStream } from "./TokenStream.mjs";

let tokenStream = new TokenStream();
let parserErrors = 0;
let error = null;

export async function parse(inputTokens) {
	tokenStream = inputTokens;

	await Program();

	console.log(`\nTotal NO of errors: ${parserErrors}`);
}

function logMatch(success, ruleName) {
	const line = tokenStream.printLine();
	if (success) {
		console.log(`Line : ${line} Matched\t\tRule used: ${ruleName}`);
	} else {
		console.log(`Line : ${line} Not Matched\tError: Invalid ${ruleName}`);
		parserErrors++;
	}
}

async function Program() {
	if (!tokenStream.match("Start Symbol")) {
		logMatch(false, "Program (Missing Start Symbol)");
		return false;
	}
	tokenStream.skip();

	if (!(await ClassDeclaration())) {
		logMatch(false, "ClassDeclaration");
		return false;
	}

	if (!tokenStream.match("End Symbol")) {
		logMatch(false, "Program (Missing End Symbol)");
		return false;
	}
	tokenStream.skip();

	logMatch(true, "Program");
	return true;
}

async function ClassDeclaration() {
	if (!tokenStream.match("Class")) {
		logMatch(false, "ClassDeclaration (Missing 'Class')");
		return false;
	}
	tokenStream.skip();

	if (!tokenStream.match("Identifier")) {
		logMatch(false, "ClassDeclaration (Missing Identifier)");
		return false;
	}
	tokenStream.skip();

	if (tokenStream.match("DerivedFrom")) {
		tokenStream.skip();

		if (!tokenStream.match("Identifier")) {
			logMatch(false, "ClassDeclaration (Missing Base Class Identifier)");
			return false;
		}

		tokenStream.skip();
	}

	await ClassBody();

	logMatch(true, "ClassDeclaration");

	return true;
}

async function ClassBody() {
	if (!tokenStream.match("Left Curly Braces")) {
		logMatch(false, "ClassBody (Missing '{')");
		return false;
	}
	tokenStream.skip();

	await ClassMembers();

	if (!tokenStream.match("Right Curly Braces")) {
		logMatch(false, "ClassBody (Missing '}')");
		return false;
	}
	logMatch(true, "ClassBody");
	tokenStream.skip();

	return true;
}

async function ClassMembers() {
	while (
		tokenStream.peek() &&
		!tokenStream.match("Right Curly Braces") &&
		!tokenStream.match("End Symbol")
	) {
		let line = tokenStream.currentLine();
		if (!(await ClassMember())) {
			tokenStream.skipLine(line);

			while (line === tokenStream.currentLine()) {
				tokenStream.skipLine(line);
			}

			logMatch(false, "ClassMember");
		} else {
			logMatch(true, "ClassMember");
		}
	}
	return true;
}

async function ClassMember() {
	const snapshot = tokenStream.snapshot();

	if (tokenStream.match("Inclusion")) {
		tokenStream.skip();
		await RequireCommand();
		return true;
	}

	if (tokenStream.match("Comment")) {
		tokenStream.skip();
		if (tokenStream.match("STR")) {
			tokenStream.skip();
			return true;
		}
	}

	if (tokenStream.match("Comment Multiple Start")) {
		tokenStream.skip();
		if (tokenStream.match("STR")) {
			tokenStream.skip();
			if (tokenStream.match("Comment Multiple End")) {
				tokenStream.skip();
				return true;
			}
		}
	}

	if (VariableDecl()) return true;
	tokenStream.restore(snapshot);

	if (MethodDecl()) return true;
	tokenStream.restore(snapshot);

	if (!tokenStream.match("Identifier")) return false;
	tokenStream.skip();
	if (FuncCall()) return true;
	tokenStream.restore(snapshot);

	return false;
}

function MethodDecl() {
	if (!FuncDecl()) return false;

	if (tokenStream.match("Semicolon")) {
		tokenStream.skip();
		logMatch(true, "MethodDecl (Prototype)");
		return true;
	}

	if (tokenStream.match("Left Curly Braces")) {
		tokenStream.skip();

		VariableDecls();
		Statements();

		if (!tokenStream.match("Right Curly Braces")) {
			logMatch(false, "MethodDecl (Missing '}')");
			return false;
		}
		tokenStream.skip();

		logMatch(true, "MethodDecl");
		return true;
	}

	logMatch(false, "MethodDecl");
	return false;
}

function FuncDecl() {
	let returnValue = true;
	if (!Type()) {
		tokenStream.skip();
		returnValue = false;
		if (tokenStream.match("Identifier"))
			logMatch(false, `Invalid Type (${tokenStream.prev().text})`);
		else return false;
	}

	if (!tokenStream.match("Identifier")) return false;
	tokenStream.skip();

	if (!tokenStream.match("Left Parenthesis")) return false;
	tokenStream.skip();

	if (!ParameterList()) return false;

	if (!tokenStream.match("Right Parenthesis")) return false;
	tokenStream.skip();

	returnValue && logMatch(true, "FuncDecl");
	return true;
}

function ParameterList() {
	if (tokenStream.match("Right Parenthesis")) return true;

	return Parameters();
}

function Parameters() {
	if (!Parameter()) return false;

	while (tokenStream.match("Comma")) {
		tokenStream.skip();

		if (!Parameter()) return false;
	}

	return true;
}

function Parameter() {
	if (!Type()) return false;

	if (!tokenStream.match("Identifier")) return false;
	tokenStream.skip();

	return true;
}

function VariableDecls() {
	while (true) {
		const snapshot = tokenStream.snapshot();

		if (!VariableDecl()) {
			tokenStream.restore(snapshot);
			break;
		}

		logMatch(true, "VariableDecl");
	}

	return true;
}

function VariableDecl() {
	if (!Type()) return false;

	if (!IDList()) return false;

	if (tokenStream.match("Left Bracket")) {
		tokenStream.skip();

		if (!tokenStream.match("Identifier")) return false;
		tokenStream.skip();

		if (!tokenStream.match("Right Bracket")) return false;
		tokenStream.skip();
	}

	if (!tokenStream.match("Semicolon")) return false;
	tokenStream.skip();

	return true;
}

function IDList() {
	if (!tokenStream.match("Identifier")) return false;
	tokenStream.skip();

	while (tokenStream.match("Comma")) {
		tokenStream.skip();

		if (!tokenStream.match("Identifier")) return false;
		tokenStream.skip();
	}

	return true;
}

function Statements() {
	while (
		tokenStream.peek() &&
		!tokenStream.match("Right Curly Braces") &&
		!tokenStream.match("End Symbol")
	) {
		let line = tokenStream.currentLine();
		if (!Statement()) {
			tokenStream.skipLine(line);

			while (line === tokenStream.currentLine()) {
				tokenStream.skipLine(line);
			}
			logMatch(false, error ?? "Statement");
			error = null;
		} else {
			logMatch(true, "Statement");
		}
	}
	return true;
}

function Statement() {
	switch (tokenStream.peek()?.type) {
		case "Identifier":
			tokenStream.skip();
			if (tokenStream.match("Assignment operator")) {
				tokenStream.skip();

				if (!Expression()) return false;

				if (tokenStream.match("Semicolon")) {
					tokenStream.skip();
					return true;
				}
			} else if (tokenStream.match("Left Parenthesis")) {
				return FuncCall();
			} else if (tokenStream.match("Identifier")) {
				error = `Invalid Type (${tokenStream.prev().text})`;
			}
			break;

		case "If":
			tokenStream.skip();
			if (TrueForStmt()) return true;
			break;

		case "When":
			tokenStream.skip();
			if (HoweverStmt()) return true;
			break;

		case "For":
			tokenStream.skip();
			if (WhenStmt()) return true;
			break;

		case "Return":
			tokenStream.skip();
			if (!Expression()) {
				return false;
			}
			if (tokenStream.match("Semicolon")) {
				tokenStream.skip();
				return true;
			}
			break;

		case "Break":
			tokenStream.skip();
			if (tokenStream.match("Semicolon")) {
				tokenStream.skip();
				return true;
			}
			break;

		case "Switch":
			tokenStream.skip();
			if (ScanStmt()) return true;
			break;

		case "Struct":
			tokenStream.skip();
			if (SrapStmt()) return true;
			break;
	}
	return false;
}

function FuncCall() {
	if (!tokenStream.match("Left Parenthesis")) return false;
	tokenStream.skip();

	if (!ArgumentList()) return false;

	if (!tokenStream.match("Right Parenthesis")) return false;
	tokenStream.skip();

	if (tokenStream.match("Semicolon")) {
		tokenStream.skip();
		return true;
	}
	return false;
}

function ArgumentList() {
	if (tokenStream.match("Right Parenthesis")) return true;

	return ArgumentSequence();
}

function ArgumentSequence() {
	if (!Expression()) return false;

	while (tokenStream.match("Comma")) {
		tokenStream.skip();

		if (!Expression()) return false;
	}

	return true;
}

function TrueForStmt() {
	if (!tokenStream.match("Left Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (!ConditionExpression()) return false;

	if (!tokenStream.match("Right Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (!Block()) return false;

	if (tokenStream.match("Else")) {
		tokenStream.skip();
		return Block();
	}

	return true;
}

function HoweverStmt() {
	if (!tokenStream.match("Left Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (!ConditionExpression()) {
		return false;
	}

	if (!tokenStream.match("Right Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	return Block();
}

function WhenStmt() {
	if (!tokenStream.match("Left Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (!Expression()) {
		return false;
	}
	if (!tokenStream.match("Semicolon")) {
		return false;
	}
	tokenStream.skip();

	if (!Expression()) {
		return false;
	}
	if (!tokenStream.match("Semicolon")) {
		return false;
	}
	tokenStream.skip();

	if (!Expression()) {
		return false;
	}

	if (!tokenStream.match("Right Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	return Block();
}

function ScanStmt() {
	if (!tokenStream.match("Left Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (!tokenStream.match("Case")) {
		return false;
	}
	tokenStream.skip();

	if (!tokenStream.match("Identifier")) {
		return false;
	}
	tokenStream.skip();

	if (!tokenStream.match("Right Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (tokenStream.match("Semicolon")) {
		tokenStream.skip();
		return true;
	}

	return false;
}

function SrapStmt() {
	if (!tokenStream.match("Left Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (!Expression()) {
		return false;
	}

	if (!tokenStream.match("Right Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (tokenStream.match("Semicolon")) {
		tokenStream.skip();
		return true;
	}

	return false;
}

function Block() {
	if (!tokenStream.match("Left Curly Braces")) {
		return false;
	}
	tokenStream.skip();

	Statements();

	if (tokenStream.match("Right Curly Braces")) {
		tokenStream.skip();
		return true;
	}
	return false;

	// tokenStream.skip();
	// return true;
}

function ConditionExpression() {
	if (!Condition()) {
		return false;
	}

	while (tokenStream.match("Logic operator")) {
		tokenStream.skip();
		if (!Condition()) {
			return false;
		}
	}

	return true;
}

function Condition() {
	if (!Expression()) {
		return false;
	}

	if (!tokenStream.match("Relational operator")) {
		return false;
	}
	tokenStream.skip();

	if (Expression()) {
		return true;
	}
	return false;
}

function Expression() {
	if (!Term()) {
		return false;
	}

	while (tokenStream.match("Add Operation")) {
		tokenStream.skip();
		if (!Term()) {
			return false;
		}
	}

	return true;
}

function Term() {
	if (!Factor()) {
		return false;
	}

	while (tokenStream.match("Multiplication Operation")) {
		tokenStream.skip();
		if (!Factor()) {
			return false;
		}
	}

	return true;
}

function Factor() {
	if (tokenStream.match("Identifier") || tokenStream.match("Constant")) {
		tokenStream.skip();
		return true;
	}

	if (!tokenStream.match("Left Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (!Expression()) {
		return false;
	}
	tokenStream.skip();

	if (tokenStream.match("Right Parenthesis")) {
		tokenStream.skip();
		return true;
	}

	return false;
}

async function RequireCommand() {
	let fileName;

	if (!tokenStream.match("Left Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (!tokenStream.match("STR")) {
		return false;
	}
	fileName = tokenStream.peek().text;
	tokenStream.skip();

	if (!tokenStream.match("Right Parenthesis")) {
		return false;
	}
	tokenStream.skip();

	if (tokenStream.match("Semicolon")) {
		tokenStream.skip();

		const snapshot = tokenStream;
		await main(fileName);
		tokenStream = snapshot;

		return true;
	}

	return false;
}

function Type() {
	const types = [
		"Integer",
		"SInteger",
		"Character",
		"String",
		"Float",
		"SFloat",
		"Void",
		"Boolean",
	];

	if (types.includes(tokenStream.peek()?.type)) {
		tokenStream.skip();
		return true;
	}

	return false;
}
