import { Token, TokenType } from '../lexer'
import {
	UndefinedDefinition,
	UndefinedFragment,
	UndefinedIdent,
} from '../errors'
import * as path from 'path'
import {
	AstNode,
	AstType,
	DefinitionNode,
	FragmentNode,
	GlobalHandlerNode,
	IdentNode,
	RouteNode,
	SequenceNode,
} from '../parser/ast'
import {
	CompiledGlobalHandlerNode,
	CompiledHandlerNode,
	CompiledRequestNode,
	CompiledRouteNode,
	CompiledSequenceNode,
	ConcreteNodes,
	ConcreteSequence,
	JSDefinitionNode,
} from './cst'

export class Compiler {
	nodes: AstNode[]
	compiledNodes: any[]
	idyllic: ConcreteNodes

	constructor(nodes: AstNode[]) {
		this.nodes = nodes
		this.compiledNodes = []
	}

	public desugar() {
		const { nodes } = this
		const fragments = Object.fromEntries(
			(nodes.filter(
				(v) => v.type === AstType.Fragment
			) as FragmentNode[]).map((z) => [z.ident.base.literal, z])
		)

		const newNodes: AstNode[] = []
		const desugarSequence = (sequence: SequenceNode[]) => {
			return sequence
				.map((node) => {
					if (node.typeToken.type === TokenType.Expand) {
						const fragment = fragments[node.identifier.base.literal]

						if (fragment === undefined) {
							throw new UndefinedFragment(node)
						}

						const fragmentArgs = fragment.ident.arguments.map((z) => z.literal)
						const providedArgs = node.identifier.arguments

						const args = Object.fromEntries(
							fragmentArgs.map((z, i) => [z, providedArgs[i]])
						)

						return fragment.sequence.map((seqNode) => {
							const clonedFragment = JSON.parse(JSON.stringify(seqNode))
							clonedFragment.identifier.arguments = seqNode.identifier.arguments.map(
								(arg) => {
									if (arg.type === TokenType.Ident) {
										return args[arg.literal]
									} else {
										return arg
									}
								}
							)
							return clonedFragment
						})
					} else {
						return node
					}
				})
				.flat()
		}

		for (const node of nodes) {
			switch (node.type) {
				case AstType.Definition:
					newNodes.push(node)
					break
				case AstType.GlobalHandler:
					const newNode: GlobalHandlerNode = node as GlobalHandlerNode
					newNode.sequence = desugarSequence(newNode.sequence)
					newNodes.push(newNode)
					break
				case AstType.Route:
					const newRoute: RouteNode = node as RouteNode
					newRoute.sequence = desugarSequence(newRoute.sequence)
					newRoute.handlers = newRoute.handlers.map((z) => {
						z.sequence = desugarSequence(z.sequence)
						return z
					})
				default:
					newNodes.push(node)
					break
			}
		}

		this.nodes = newNodes.filter((z) => z.type !== AstType.Fragment)

		return this
	}

	public async validate() {
		const definitions: DefinitionNode[] = this.nodes.filter(
			(node) => node.type === AstType.Definition
		) as DefinitionNode[]

		const constructInteropDefs = async (arr: DefinitionNode[]) =>
			Object.fromEntries(
				(
					await Promise.all(
						arr.map(async (definition) => {
							const module = await import(
								path.join(process.cwd(), definition.path.literal as string)
							)
							const defs: [string, JSDefinitionNode][] = []
							await definition.identifiers.forEach((ident) => {
								const jsDef = module[ident.literal]
								if (jsDef === undefined) {
									throw new UndefinedDefinition(definition, ident)
								}
								defs.push([
									ident.literal as string,
									new JSDefinitionNode(
										definition.token,
										definition.definitionType,
										ident,
										definition.path,
										jsDef
									),
								])
							})
							return defs
						})
					)
				).flat()
			)

		const middlewareDefs = await constructInteropDefs(
			definitions.filter((z) => z.definitionType.type === TokenType.Middleware)
		)
		const guardDefs = await constructInteropDefs(
			definitions.filter((z) => z.definitionType.type === TokenType.Guard)
		)
		const handlerDefs = await constructInteropDefs(
			definitions.filter((z) => z.definitionType.type === TokenType.Handlers)
		)

		const defDict: Record<string, { [p: string]: JSDefinitionNode }> = {
			middleware: middlewareDefs,
			guard: guardDefs,
			handler: handlerDefs,
		}

		const constructSequence = (nodes: SequenceNode[]) => {
			return nodes.map((node) => {
				const interop =
					defDict[node.typeToken.literal][node.identifier.base.literal]
				if (interop === undefined) {
					throw new UndefinedIdent(
						node.typeToken.literal as string,
						node.identifier
					)
				}

				return new CompiledSequenceNode(
					node.token,
					node.typeToken,
					interop,
					node.identifier.arguments
				)
			})
		}

		const compileIdent = (ident: IdentNode, type: string) => {
			const interop = defDict[type][ident.base.literal]
			if (interop === undefined) {
				throw new UndefinedIdent(type, ident)
			}

			return interop
		}

		const program = this.nodes
			.filter((z) => z.type !== AstType.Definition)
			.map((val) => {
				switch (val.type) {
					case AstType.Route:
						const node = val as RouteNode
						const newSeq = constructSequence(node.sequence)
						const newHandlers = node.handlers.map((route) => {
							const seq = constructSequence(route.sequence)
							const handler = new CompiledHandlerNode(
								route.handler.token,
								route.handler,
								compileIdent(route.handler, 'handler')
							)
							return new CompiledRequestNode(route.token, seq, handler)
						})
						return new CompiledRouteNode(
							node.token,
							node.route,
							newSeq,
							newHandlers
						)
					case AstType.GlobalHandler:
						const globalNode = val as GlobalHandlerNode
						return new CompiledGlobalHandlerNode(
							val.token,
							constructSequence(globalNode.sequence)
						)

					default:
						break
				}
			})

		this.compiledNodes = program

		return this
	}

	public objectify() {
		const concreteArguments = (token: Token[]) => token.map((z) => z.literal)
		const concreteSequence = (
			nodes: CompiledSequenceNode[]
		): ConcreteSequence => {
			return nodes.map((node) => ({
				interop: node.interop.interop,
				name: node.interop.identifier.literal as string,
				type: node.typeToken.type,
				arguments: concreteArguments(node.arguments),
			}))
		}

		this.idyllic = {
			global: concreteSequence(
				(this.compiledNodes.filter(
					(z) => z?.type === AstType.GlobalHandler
				)[0] as CompiledGlobalHandlerNode)?.sequence || []
			),
			routes: Object.fromEntries(
				(this.compiledNodes.filter(
					(z) => z?.type === AstType.Route
				) as CompiledRouteNode[])?.map((route) => [
					route.route.literal,
					{
						sequence: concreteSequence(route.sequence),
						requests: Object.fromEntries(
							route.handlers?.map((request) => [
								request.token.literal,
								{
									sequence: concreteSequence(request.sequence),
									handler: {
										name: request.handler.ident.token.literal as string,
										interop: request.handler.interop.interop,
										arguments: concreteArguments(
											request.handler.ident.arguments
										),
									},
								},
							]) || []
						),
					},
				]) || []
			),
		}
		return this
	}
}
