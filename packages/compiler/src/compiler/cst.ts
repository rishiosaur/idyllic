import { AstNode, AstType, IdentNode } from '../parser/ast'
import { Token, TokenType } from '../lexer'

export class JSDefinitionNode {
	type: AstType = AstType.Definition
	path: Token
	identifier: Token
	definitionType: Token
	token: Token
	interop: Function

	constructor(
		token: Token,
		definitionType: Token,
		identifier: Token,
		path: Token,
		interop: Function
	) {
		this.token = token
		this.identifier = identifier
		this.path = path
		this.definitionType = definitionType
		this.interop = interop
	}
}

export class CompiledSequenceNode {
	type: AstType = AstType.Sequence
	token: Token
	typeToken: Token
	interop: JSDefinitionNode
	arguments: Token[]

	constructor(
		token: Token,
		typeToken: Token,
		interop: JSDefinitionNode,
		args: Token[]
	) {
		this.interop = interop
		this.typeToken = typeToken
		this.token = token
		this.arguments = args
	}
}

export class CompiledRouteNode implements AstNode {
	token: Token
	type: AstType = AstType.Route
	route: Token
	sequence: CompiledSequenceNode[]
	handlers: CompiledRequestNode[]

	constructor(
		token: Token,
		route: Token,
		sequence: CompiledSequenceNode[],
		handlers: CompiledRequestNode[]
	) {
		this.token = token
		this.route = route
		this.sequence = sequence
		this.handlers = handlers
	}
}

export class CompiledRequestNode implements AstNode {
	token: Token
	type: AstType = AstType.Request
	sequence: CompiledSequenceNode[]
	handler: CompiledHandlerNode

	constructor(
		token: Token,
		sequence: CompiledSequenceNode[],
		handler: CompiledHandlerNode
	) {
		this.token = token
		this.sequence = sequence
		this.handler = handler
	}
}

export class CompiledGlobalHandlerNode implements AstNode {
	type: AstType = AstType.GlobalHandler
	token: Token
	sequence: CompiledSequenceNode[]

	constructor(token: Token, sequence: CompiledSequenceNode[]) {
		this.token = token
		this.sequence = sequence
	}
}

export class CompiledHandlerNode {
	constructor(
		public token: Token,
		public ident: IdentNode,
		public interop: JSDefinitionNode
	) {}
}

export interface ConcreteSequenceNode {
	interop: Function
	name: string
	type: TokenType
	arguments: any[]
}

export type ConcreteSequence = ConcreteSequenceNode[]

export interface ConcreteNodes {
	global: ConcreteSequence
	routes: {
		[id: string]: {
			requests: {
				[requestType: string]: {
					sequence: ConcreteSequence
					handler: {
						interop: Function
						name: string
						arguments: any[]
					}
				}
			}
			sequence: ConcreteSequence
		}
	}
}
