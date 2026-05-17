export type IpcResult<T> = { status: 'success'; data: T } | { status: 'error'; data: string[] }
