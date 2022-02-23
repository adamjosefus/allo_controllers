type OperatorType<T> = (input: T) => T
export const pipe = <T>(...operators: OperatorType<T>[]) => (input: T): T => operators.reduce((output, f) => f(output), input)
