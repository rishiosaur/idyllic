import { Lexer, Token, TokenType } from './lexer/'
import { Parser } from './parser/parser'
import { Compiler } from './compiler/compiler'
import { AstNode } from './parser/ast'
import { ConcreteNodes } from './compiler/cst'
import * as path from 'path'
import * as util from 'util'
import * as fs from 'fs'

export class IdyllicCompiler {
	text: string
	tokens: Token[]
	ast: AstNode[] = []
	cst: any[] = []
	compiled: ConcreteNodes

	constructor(text: string) {
		this.text = text
	}

	public async compile() {
		const l = new Lexer(this.text)
		this.tokens = l.collectTokens()

		const p = new Parser(this.tokens)
		this.ast = p.collectNodes()

		const c = new Compiler(this.ast)
		c.desugar()
		const validated = await c.validate()
		this.cst = validated.compiledNodes
		this.compiled = c.objectify().idyllic
		return this.compiled
	}

	public static async fromFile(route: string) {
		const readFile = util.promisify(fs.readFile)
		const text = (await readFile(path.join(process.cwd(), route))).toString(
			'utf-8'
		)
		return new IdyllicCompiler(text)
	}
}
