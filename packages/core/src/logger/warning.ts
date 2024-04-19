import { packageName } from './enum.ts'

const warning = (...arg: unknown[]) => {
  console.warn(packageName, ...arg)
}

export default warning
