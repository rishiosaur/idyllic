export enum TokenType {
	Route = 'Route',
	Get = 'Get',
	Post = 'Post',
	Patch = 'Patch',
	Put = 'Put',
	Delete = 'Delete',
	Comma = 'Comma',
	String = 'String',
	Number = 'Number',
	Ident = 'Ident',
	LBrace = 'LBrace',
	RBrace = 'RBrace',
	LParen = 'LParen',
	RParen = 'RParen',
	Bar = 'Bar',
	Middleware = 'Middleware',
	Guard = 'Guard',
	Fragment = 'Fragment',
	Global = 'Global',
	Handlers = 'Handlers',
	Illegal = 'Illegal',
	Expand = 'Expand',
	True = 'True',
	False = 'False',
	Eof = 'EOF',
	Define = 'Define',
	From = 'From',
}

export class Token {
	type: TokenType
	literal: string | number

	line: number
	column: number

	constructor(
		type: TokenType,
		literal: string | number,
		column: number,
		line: number
	) {
		this.type = type
		this.literal = literal
		this.column = column
		this.line = line
	}

	public static matchKeywords(literal: string): TokenType {
		let token: TokenType
		switch (literal) {
			case 'route':
				token = TokenType.Route
				break
			case 'define':
				token = TokenType.Define
				break
			case 'get':
				token = TokenType.Get
				break
			case 'from':
				token = TokenType.From
				break
			case 'post':
				token = TokenType.Post
				break
			case 'delete':
				token = TokenType.Delete
				break
			case 'patch':
				token = TokenType.Patch
				break
			case 'put':
				token = TokenType.Put
			case 'middleware':
				token = TokenType.Middleware
				break
			case 'guards':
			case 'guard':
				token = TokenType.Guard
				break
			case 'handlers':
				token = TokenType.Handlers
				break
			case 'global':
				token = TokenType.Global
				break
			case 'fragment':
				token = TokenType.Fragment
				break
			case 'expand':
				token = TokenType.Expand
				break
			default:
				token = TokenType.Ident
				break
		}

		return token
	}
}
