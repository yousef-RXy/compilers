export class TokenStream {
	tokens = [];
	index = 0;

	constructor(tokens) {
		this.tokens = tokens;
	}

	snapshot() {
		return this.index;
	}

	restore(state) {
		this.index = state;
	}

	match(expectedType) {
		const token = this.tokens[this.index];
		if (token?.type === expectedType) {
			return true;
		}
		return false;
	}

	skipLine(Line) {
		const line = Line ?? this.tokens[this.index]?.line;
		if (line) {
			while (
				this.index < this.tokens.length - 1 &&
				line === this.tokens[this.index]?.line
			) {
				this.index++;

				if (
					this.match("Right Curly Braces") ||
					this.match("Right Parenthesis") ||
					this.match("End Symbol")
				)
					break;
			}
		}
	}

	skip() {
		this.index++;
	}

	prev() {
		return this.tokens[this.index - 1];
	}

	peek() {
		return this.tokens[this.index];
	}

	currentLine() {
		return this.tokens[this.index]?.line;
	}

	printLine() {
		return this.tokens[
			this.index === this.tokens.length - 1 ? this.index : this.index - 1
		]?.line;
	}
}
