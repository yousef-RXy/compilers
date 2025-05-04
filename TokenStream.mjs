export class TokenStream {
	tokens = [];
	current = 0;

	constructor(tokens) {
		this.tokens = tokens;
	}

	match(expectedType) {
		const token = this.tokens[this.current];
		if (token?.type === expectedType) {
			return true;
		}
		return false;
	}

	matchWithSkip(expectedType) {
		const token = this.tokens[this.current];
		this.current++;
		if (token?.type === expectedType) {
			return true;
		}
		return false;
	}

	skip() {
		this.current++;
	}

	skip() {
		this.current++;
	}

	back() {
		this.current--;
	}

	peek() {
		return this.tokens[this.current];
	}

	currentLine() {
		return this.tokens[this.current]?.line ?? "??";
	}

	prevLine() {
		return this.tokens[this.current - 1]?.line ?? "??";
	}
}
