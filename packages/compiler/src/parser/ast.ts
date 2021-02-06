import { Token } from '../lexer'

export enum AstType {
	Definition = 'Definition',
	Sequence = 'Sequence',
	GlobalHandler = 'GlobalHandler',
	Fragment = 'Fragment',
	Route = 'Route',
	Request = 'Request',
	Ident = 'Ident',
}

export interface AstNode {
	type: AstType
	token: Token
	// literal: string
}

export class IdentNode implements AstNode {
	token: Token
	type: AstType = AstType.Ident
	base: Token
	arguments: Token[]

	constructor(token: Token, args: Token[]) {
		this.token = token
		this.base = token
		this.arguments = args
	}
}

export class RouteNode implements AstNode {
	token: Token
	type: AstType = AstType.Route
	route: Token
	sequence: SequenceNode[]
	handlers: RequestNode[]

	constructor(
		token: Token,
		route: Token,
		sequence: SequenceNode[],
		handlers: RequestNode[]
	) {
		this.token = token
		this.route = route
		this.sequence = sequence
		this.handlers = handlers
	}
}

export class RequestNode implements AstNode {
	token: Token
	type: AstType = AstType.Request
	sequence: SequenceNode[]
	handler: IdentNode

	constructor(token: Token, sequence: SequenceNode[], handler: IdentNode) {
		this.token = token
		this.sequence = sequence
		this.handler = handler
	}
}

export class FragmentNode implements AstNode {
	type: AstType = AstType.Fragment
	token: Token
	ident: IdentNode
	sequence: SequenceNode[]

	constructor(token: Token, ident: IdentNode, sequence: SequenceNode[]) {
		this.token = token

		this.sequence = sequence
		this.ident = ident
	}
}

export class SequenceNode implements AstNode {
	type: AstType = AstType.Sequence
	token: Token
	typeToken: Token
	identifier: IdentNode

	constructor(token: Token, typeToken: Token, identifier: IdentNode) {
		this.identifier = identifier
		this.typeToken = typeToken
		this.token = token
	}
}

export class GlobalHandlerNode implements AstNode {
	type: AstType = AstType.GlobalHandler
	token: Token
	sequence: SequenceNode[]

	constructor(token: Token, sequence: SequenceNode[]) {
		this.token = token
		this.sequence = sequence
	}
}

export class DefinitionNode implements AstNode {
	type: AstType = AstType.Definition
	path: Token
	identifiers: Token[]
	definitionType: Token
	token: Token

	constructor(
		token: Token,
		definitionType: Token,
		identifiers: Token[],
		path: Token
	) {
		this.token = token
		this.identifiers = identifiers
		this.path = path
		this.definitionType = definitionType
	}
}
