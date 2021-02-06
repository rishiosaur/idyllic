import { Token, TokenType } from '../lexer'
import { MismatchTypeError } from '../errors'
import {
	AstNode,
	DefinitionNode,
	FragmentNode,
	GlobalHandlerNode,
	IdentNode,
	RequestNode,
	RouteNode,
	SequenceNode,
} from './ast'

export class Parser {
	nodes: AstNode[]
	tokens: Token[]
	currentToken: Token
	currentPosition: number

	constructor(tokens: Token[]) {
		this.tokens = tokens
		this.nodes = []

		this.currentPosition = 0
		this.currentToken = tokens[0]
	}

	consumeToken() {
		this.currentPosition++
		this.currentToken = this.tokens[this.currentPosition]
	}

	get peekToken() {
		return this.tokens[this.currentPosition + 1]
	}

	expectPeek(tokenTypes: TokenType[], suppressErrors = false) {
		if (!tokenTypes.includes(this.peekToken?.type)) {
			if (!suppressErrors)
				throw new MismatchTypeError(this.currentToken, tokenTypes)
			else return false
		} else {
			return true
		}
	}

	next(): AstNode | undefined {
		let node: AstNode

		if (this.currentToken === undefined) {
			return undefined
		}
		switch (this.currentToken.type) {
			case TokenType.Define:
				node = this.parseDefinitionNode()

				break
			case TokenType.Global:
				node = this.parseGlobalHandlerNode()
				break
			case TokenType.Fragment:
				node = this.parseFragmentNode()
				break
			case TokenType.Route:
				node = this.parseRouteNode()
				break
			default:
				return undefined
		}

		return node
	}

	public collectNodes(): AstNode[] {
		const arr: (AstNode | undefined)[] = []

		let node: AstNode | undefined = this.next()
		while (node !== undefined) {
			arr.push(node as AstNode)
			node = this.next()
		}

		return arr as AstNode[]
	}

	parseRouteNode(): RouteNode {
		const token = this.currentToken
		this.expectPeek([TokenType.String])
		this.consumeToken()
		const route = this.currentToken
		this.expectPeek([TokenType.LBrace])
		this.consumeToken()
		const sequence: SequenceNode[] = []
		while (this.peekToken?.type === TokenType.Bar) {
			this.consumeToken()
			const seq = this.parseSequenceNode()

			sequence.push(seq)
		}

		const handlers: RequestNode[] = []

		while (
			[
				TokenType.Put,
				TokenType.Get,
				TokenType.Patch,
				TokenType.Delete,
				TokenType.Post,
			].includes(this.peekToken?.type)
		) {
			this.consumeToken()
			const req = this.parseRequestNode()
			handlers.push(req)
		}

		this.consumeToken()
		this.consumeToken()

		return new RouteNode(token, route, sequence, handlers)
	}

	parseRequestNode(): RequestNode {
		const token = this.currentToken
		this.expectPeek([TokenType.LBrace])
		this.consumeToken()
		const sequence: SequenceNode[] = []
		while (this.peekToken?.type === TokenType.Bar) {
			this.consumeToken()
			const seq = this.parseSequenceNode()

			sequence.push(seq)
		}

		this.expectPeek([TokenType.Ident])
		this.consumeToken()
		const handler = this.parseIdentNode()
		this.consumeToken()

		return new RequestNode(token, sequence, handler)
	}

	parseFragmentNode(): FragmentNode {
		const token = this.currentToken
		this.expectPeek([TokenType.Ident])
		this.consumeToken()
		const ident = this.parseIdentNode(true)
		const sequence: SequenceNode[] = []

		while (this.peekToken?.type === TokenType.Bar) {
			this.consumeToken()
			const seq = this.parseSequenceNode(true)

			sequence.push(seq)
		}

		this.consumeToken()
		return new FragmentNode(token, ident, sequence)
	}

	parseGlobalHandlerNode(): GlobalHandlerNode {
		const token = this.currentToken
		const sequence: SequenceNode[] = []

		while (this.peekToken?.type === TokenType.Bar) {
			this.consumeToken()
			const seq = this.parseSequenceNode()

			sequence.push(seq)
		}

		this.consumeToken()
		return new GlobalHandlerNode(token, sequence)
	}

	parseSequenceNode(allowIdent = false): SequenceNode {
		if (this.currentToken.type !== TokenType.Bar) {
			throw new MismatchTypeError(this.currentToken, TokenType.Bar)
		}

		const token = this.currentToken
		this.expectPeek([TokenType.Expand, TokenType.Guard, TokenType.Middleware])
		this.consumeToken()
		const definitionToken = this.currentToken
		this.expectPeek([TokenType.Ident])
		this.consumeToken()
		const ident = this.parseIdentNode(allowIdent)

		return new SequenceNode(token, definitionToken, ident)
	}

	parseIdentNode(allowIdent = false): IdentNode {
		const token = this.currentToken
		const args: Token[] = []

		if (this.peekToken?.type === TokenType.LParen) {
			this.consumeToken()
			this.consumeToken()

			while (this.currentToken?.type !== TokenType.RParen) {
				if (
					[
						TokenType.True,
						TokenType.False,
						TokenType.Number,
						TokenType.String,
						...(allowIdent ? [TokenType.Ident] : []),
					].includes(this.currentToken.type)
				) {
					args.push(this.currentToken)

					if ((this.peekToken?.type as any) === TokenType.Comma) {
						this.consumeToken()
					}
					this.consumeToken()
				} else {
					throw new Error(
						`[${this.currentToken.line}:${this.currentToken.column}] Expected primitive type, received ${this.currentToken.type} instead.`
					)
				}
			}
		}

		return new IdentNode(token, args)
	}

	parseDefinitionNode(): DefinitionNode {
		const token = this.currentToken

		this.expectPeek([TokenType.Middleware, TokenType.Guard, TokenType.Handlers])

		const definitionToken = this.peekToken
		this.consumeToken()

		this.expectPeek([TokenType.LBrace])
		this.consumeToken()
		const idents: Token[] = []
		this.expectPeek([TokenType.Ident])
		this.consumeToken()
		idents.push(this.currentToken)

		while (this.peekToken.type !== TokenType.RBrace) {
			this.consumeToken()
			if (this.currentToken?.type === TokenType.Comma) {
				continue
			}
			idents.push(this.currentToken)
		}

		this.expectPeek([TokenType.RBrace])
		this.consumeToken()
		this.expectPeek([TokenType.From])
		this.consumeToken()

		this.expectPeek([TokenType.String])
		const path = this.peekToken
		this.consumeToken()
		this.consumeToken()

		return new DefinitionNode(token, definitionToken, idents, path)
	}
}
