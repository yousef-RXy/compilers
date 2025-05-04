import { scanFile } from "./scanner.mjs";
import { parse } from "./parser.mjs";
import { TokenStream } from "./TokenStream.mjs";

export async function main(filePath) {
	let tokenStream;

	try {
		const tokens = await scanFile(filePath);
		tokenStream = new TokenStream(tokens);
	} catch (error) {
		return;
	}

	console.log("\n--- Parser Output ---");
	parse(tokenStream);
}

main("./input/test.txt");
