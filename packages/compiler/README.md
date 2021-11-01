# `@idyllic/server`

Complete Typescript implementation of a compiler for the Idyllic Language.

## Usage

```typescript
import { IdyllicCompiler } from '@idyllic/compiler'
import * as util from 'util'

;(async () => {
	const compiled = await (await IdyllicCompiler.fromFile('spec.idl')).compile()

	console.log(util.inspect(compiled, false, null, true))
})()
```

Using the Idyllic compiler programmatically is extremely simple; just import the class and run the fromFile function.

## Structure

All source lives in the `src/` directory, as is the Typescript norm.

You can find the first stage of compilation (tokenization/lexing) & all associated models in the `lexer/` directory,
which holds the
`Lexer` class. Tokens & their types are also held here.

The next stage of the compilation pipeline is held in the `parser/` directory, along with all AST models.

The last three stages are held in the `compiler/` directory, and branch off from a single `Compiler` class, as
opposed to having individual classes for each. These last three stages can be fully chained with each other.
