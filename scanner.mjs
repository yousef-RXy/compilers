import fs from "fs/promises";
import { KEYWORDS, SYMBOLS } from "./tokens.mjs";
import { Token } from "./Token.mjs";

const singleLineCommentRegex = /\/\*.*$/gm;
const multipleLineCommentRegex = /\/<[\s\S]*?>\//gm;
const fileName = /\b[\w.-]+\.txt\b/g;

let errorsNum = 0;

function tokenizeLine(line, lineNumber) {
	const output = [];

	let tokens = line
		.split(
			/(\/\*|\/<|>\/|\s+|[\{\}\[\]\(\),;]|==|!=|>=|<=|->|&&|\|\||[+\-*/=<>~])/
		)

		.filter((t) => t && !/^\s+$/.test(t));

	for (let token of tokens) {
		if (KEYWORDS[token]) {
			output.push(new Token(lineNumber, token, KEYWORDS[token]));
		} else if (SYMBOLS[token]) {
			output.push(new Token(lineNumber, token, SYMBOLS[token]));
		} else if (token === "STR") {
			output.push(new Token(lineNumber, token, "STR"));
		} else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
			output.push(new Token(lineNumber, token, "Identifier"));
		} else if (/^\d+$/.test(token)) {
			output.push(new Token(lineNumber, token, "Constant"));
		} else if (fileName.test(token)) {
			output.push(new Token(lineNumber, token, "STR"));
		} else {
			output.push(new Token(lineNumber, token, "Error"));
			errorsNum++;
		}
	}

	return output;
}
export async function scanFile(filePath) {
	const fileContent = await fs.readFile(filePath, "utf-8");
	const lines = fileContent
		.replace(singleLineCommentRegex, "/*STR")
		.replace(multipleLineCommentRegex, "/< STR >/")
		.split(/\r?\n/);

	let tokens = [];

	for (let i = 0; i < lines.length; i++) {
		const lineNumber = i + 1;
		const lineTokens = tokenizeLine(lines[i], lineNumber);
		tokens.push(...lineTokens);
	}

	console.log("--- Scanner Output ---");
	tokens.forEach(({ line, text, type }) => {
		if (type === "Error") {
			console.log(`Line : ${line} Error in Token Text: ${text}`);
		} else {
			console.log(
				`Line : ${line} Token Text: ${text.padEnd(12)} Token Type: ${type}`
			);
		}
	});
	console.log(`Total NO of errors: ${errorsNum}`);

	return tokens;
}
