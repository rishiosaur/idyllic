export function isLetter(str: string) {
	return str?.match(/[A-Z|a-z]/i) || false
}

export interface Position {
	line: number
	column: number
}

export function mapPositionToString(entity: Position) {
	return `[${entity.line}:${entity.column}]`
}

export function isNumeric(str: string) {
	return /^\d+$/.test(str)
}
