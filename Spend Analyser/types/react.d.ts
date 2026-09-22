declare namespace React {
  export type ReactNode = any;
  export type ComponentType<P = {}> = any;
  export type FC<P = {}> = (props: P) => any;
  export type ReactElement = any;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type ChangeEvent<T = Element> = any;
  export type FormEvent<T = Element> = any;
  export type MouseEvent<T = Element> = any;
  export type HTMLAttributes<T = Element> = any;

  export function useState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
  export function useEffect(effect: () => (void | (() => void)), deps?: readonly any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  export function useRef<T>(initialValue?: T): { current: T };
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
}

declare module 'react' {
  export = React;
  export as namespace React;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element extends React.ReactElement { }
}
