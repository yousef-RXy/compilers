import fs from "fs";
import readline from "readline";
import { KEYWORDS, SYMBOLS } from "./tokens.mjs";
import { Token } from "./Token.mjs";

const commentRegex = /\/<[\s\S]*?>\/|\/\*.*$/gm;

let errorsNum = 0;

function tokenizeLine(line, lineNumber) {
	const output = [];

	let tokens = line
		.replace(commentRegex, "")
		.split(/(\s+|[\{\}\[\]\(\),;]|==|!=|>=|<=|->|&&|\|\||[+\-*/=<>~])/)
		.filter((t) => t && !/^\s+$/.test(t));

	for (let token of tokens) {
		if (KEYWORDS[token]) {
			output.push(new Token(lineNumber, token, KEYWORDS[token]));
		} else if (SYMBOLS[token]) {
			output.push(new Token(lineNumber, token, SYMBOLS[token]));
		} else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
			output.push(new Token(lineNumber, token, "Identifier"));
		} else if (/^\d+$/.test(token)) {
			output.push(new Token(lineNumber, token, "Constant"));
		} else {
			output.push(new Token(lineNumber, token, "Error"));
			errorsNum++;
		}
	}

	return output;
}

export async function scanFile(filePath) {
	const fileStream = fs.createReadStream(filePath);
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity,
	});

	let tokens = [];
	let lineNumber = 0;

	for await (const line of rl) {
		lineNumber++;
		const lineTokens = tokenizeLine(line, lineNumber);
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
