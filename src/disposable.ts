import { declareInterface, impl } from './core';

export interface IDispositionContext {
    /**
     * dispose all disposable in context
     */
    dispose(): void
}
export const IDispositionContext = declareInterface<IDispositionContext>('IDispositionContext');

export const DispositionContext = impl(IDispositionContext, () => {
    return {
        dispose() { }
    };
});

export function useEventSource() {
    return {

    }
}
