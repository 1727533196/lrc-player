import { packageName } from './enum.ts'

const error = (...arg: unknown[]) => {
  console.error(packageName, ...arg)
}

export default error
