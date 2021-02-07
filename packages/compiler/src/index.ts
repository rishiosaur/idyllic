import { Lexer, Token, TokenType } from './lexer/'
import { Parser } from './parser/parser'
import { Compiler } from './compiler/compiler'
import { AstNode } from './parser/ast'
import { ConcreteNodes } from './compiler/cst'
import * as path from 'path'
import * as util from 'util'
import * as fs from 'fs'


/**
 * Compiler for stringified Idyllic Programs.
 *
 * @export
 * @class IdyllicCompiler
 */
export class IdyllicCompiler {
	text: string
	/**
	 * Token array for program. Fills when [[Lexer.collectTokens]] is run.
	 *
	 * @type {Token[]}
	 * @memberof IdyllicCompiler
	 */
	tokens: Token[]

	/**
	 * Abstract node tree built up from parsing stage.
	 *
	 * @type {AstNode[]}
	 * @memberof IdyllicCompiler
	 */
	ast: AstNode[] = []

	/**
	 * Concrete syntax tree built up from 3rd and 4th stages of compilation.
	 *
	 * @type {any[]}
	 * @memberof IdyllicCompiler
	 */
	cst: any[] = []


	/**
	 * Final object constructed from the CST.
	 *
	 * @type {ConcreteNodes}
	 * @memberof IdyllicCompiler
	 */
	compiled: ConcreteNodes

	/**
	 * Creates an instance of IdyllicCompiler.
	 * @param {string} text Input to the compiler.
	 * @memberof IdyllicCompiler
	 */
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

	/**
	 * Asynchronously reads an Idyllic program from file and constructs an [[IdyllicCompiler]].
	 *
	 * @static
	 * @param {string} route
	 * @returns
	 * @memberof IdyllicCompiler
	 */
	public static async fromFile(route: string) {
		const readFile = util.promisify(fs.readFile)
		const text = (await readFile(path.join(process.cwd(), route))).toString(
			'utf-8'
		)
		return new IdyllicCompiler(text)
	}
}
