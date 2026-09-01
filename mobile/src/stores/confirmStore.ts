import { create } from 'zustand'

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmState {
  visible: boolean
  options: ConfirmOptions
  resolver: ((v: boolean) => void) | null
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  resolve: (v: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  visible: false,
  options: {},
  resolver: null,
  confirm: (opts) => {
    return new Promise<boolean>((resolve) => {
      set({ visible: true, options: opts, resolver: resolve })
    })
  },
  resolve: (v) => {
    const r = get().resolver
    set({ visible: false, resolver: null })
    if (r) r(v)
  },
}))

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().confirm(opts)
}
