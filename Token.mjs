export class Token {
	line;
	text;
	type;
	constructor(line, text, type) {
		this.line = line;
		this.text = text;
		this.type = type;
	}
}
