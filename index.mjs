import { scanFile } from "./scanner.mjs";
import { parse } from "./parser.mjs";
import { TokenStream } from "./TokenStream.mjs";

export async function main(filePath) {
	let tokenStream;

	try {
		const tokens = await scanFile(`./input/${filePath}`);
		tokenStream = new TokenStream(tokens);
	} catch (error) {
		return;
	}

	console.log("\n--- Parser Output ---");
	await parse(tokenStream);
}

main("test.txt");
