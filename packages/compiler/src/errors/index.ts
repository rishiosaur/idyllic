import { Token, TokenType } from '../lexer'
import { mapPositionToString, Position } from '../shared'
import { DefinitionNode, IdentNode, SequenceNode } from '../parser/ast'

export class MismatchTypeError extends Error {
	constructor(base: Token, expected: TokenType | TokenType[]) {
		super(
			`${mapPositionToString(
				base
			)} Expected token of type ${expected}, received ${base.type} instead.`
		)
	}
}

export class IllegalToken extends Error {
	constructor(position: Position, char: string) {
		super(
			`${mapPositionToString(position)} Illegal character detected: '${char}'`
		)
	}
}

export class UndefinedFragment extends Error {
	constructor(usage: SequenceNode) {
		super(
			`${mapPositionToString(
				usage.identifier.token
			)} Could not find fragment with name ${usage.identifier.token.literal}.`
		)
	}
}

export class UndefinedDefinition extends Error {
	constructor(definitionNode: DefinitionNode, ident: Token) {
		super(
			`${mapPositionToString(ident)} Could not find ${
				definitionNode.definitionType.literal
			} with name ${ident.literal} in file "${definitionNode.path.literal}".`
		)
	}
}
