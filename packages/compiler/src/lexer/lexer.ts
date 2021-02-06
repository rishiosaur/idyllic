import { Token, TokenType } from './token'
import { isLetter, isNumeric } from '../shared'
import { IllegalToken } from '../errors'

export class Lexer {
	currentChar: string
	currentPosition: number
	input: string
	line: number
	column: number

	constructor(input: string) {
		this.input = input
		this.currentPosition = 0
		this.currentChar = input[0]
		this.line = 1
		this.column = 0
	}

	get peekChar() {
		if (this.currentPosition + 1 > this.input.length) {
			return 'EOF'
		} else {
			return this.input[this.currentPosition + 1]
		}
	}

	consumeChar() {
		if (this.currentPosition + 1 > this.input.length) {
			return 'EOF'
		} else {
			this.currentChar = this.input[this.currentPosition + 1]
		}
		this.column += 1
		this.currentPosition += 1
	}

	skipWhitespace() {
		while (/\s/.test(this.currentChar)) {
			if (this.currentChar === '\n') {
				this.line += 1
				this.column = 0
			}
			this.consumeChar()
		}
	}

	readString() {
		const startPosition = this.currentPosition + 1

		do {
			this.consumeChar()
		} while (this.currentChar !== '"' && this.currentChar !== undefined)

		return this.input.substring(startPosition, this.currentPosition)
	}

	public next() {
		let token: Token

		this.skipWhitespace()

		if (this.currentChar === undefined) {
			return new Token(TokenType.Eof, 'EOF', this.column, this.line)
		}

		switch (this.currentChar) {
			case '(':
				token = new Token(
					TokenType.LParen,
					this.currentChar,
					this.column,
					this.line
				)
				break
			case ')':
				token = new Token(
					TokenType.RParen,
					this.currentChar,
					this.column,
					this.line
				)
				break
			case '{':
				token = new Token(
					TokenType.LBrace,
					this.currentChar,
					this.column,
					this.line
				)
				break
			case '}':
				token = new Token(
					TokenType.RBrace,
					this.currentChar,
					this.column,
					this.line
				)
				break
			case ',':
				token = new Token(
					TokenType.Comma,
					this.currentChar,
					this.column,
					this.line
				)
				break
			case '|':
				token = new Token(
					TokenType.Bar,
					this.currentChar,
					this.column,
					this.line
				)
				break
			case '"':
				token = new Token(
					TokenType.String,
					this.readString(),
					this.column,
					this.line
				)
				break
			default:
				if (isNumeric(this.currentChar)) {
					const position = this.currentPosition

					while (isNumeric(this.currentChar)) {
						this.consumeChar()
					}

					return new Token(
						TokenType.Number,
						parseInt(this.input.substring(position, this.currentPosition)),
						this.column,
						this.line
					)
				} else if (isLetter(this.currentChar)) {
					const position = this.currentPosition

					while (isLetter(this.currentChar)) {
						this.consumeChar()
					}

					const literal = this.input.substring(position, this.currentPosition)

					return new Token(
						Token.matchKeywords(literal),
						literal,
						this.column,
						this.line
					)
				} else {
					// token = new Token(TokenType.Illegal, "ILLEGAL")
					throw new IllegalToken(this, this.currentChar)
				}
		}

		this.consumeChar()

		return token
	}

	public collectTokens(): Token[] {
		const tokens = []

		let t = this.next()
		while (t.type !== TokenType.Eof) {
			tokens.push(t)
			t = this.next()
		}

		return tokens
	}
}
