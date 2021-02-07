# `@idyllic/server`
 
Web server module that complements the compiler for hosting.

## Usage

```typescript
import { IdyllicCompiler } from '@idyllic/compiler'
import { IdyllicServer } from '@idyllic/server'

;(async () => {
	const compiled = await (await IdyllicCompiler.fromFile('spec.idl')).compile()
	const server = new IdyllicServer(compiled)
    
	server.start(3000, () => {
		console.log('Idyllic server started!')
	})
})()
```

## Structure

`index.ts` is where the entire implementation lives; the code behind it isn't too difficult to understand, but as we 
continue down the roadmap, it'll steadily become more and more complex.
