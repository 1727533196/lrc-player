import { packageName } from './enum.ts'

const error = (...arg: unknown[]) => {
  throw new Error(`${packageName}, ${arg.join(', ')}`)
  // console.error(packageName, ...arg)
}

export default error
