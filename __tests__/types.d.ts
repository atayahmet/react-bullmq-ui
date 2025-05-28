// TypeScript declarations for Jest testing environment
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare namespace jest {
  function fn(): jest.Mock;
  function fn<T>(): jest.Mock<T>;
  function fn<T, Y extends any[]>(implementation?: (...args: Y) => T): jest.Mock<T, Y>;
  function mock(moduleName: string, factory?: any, options?: any): void;
  function requireActual(moduleName: string): any;
  
  interface Mock<T = any, Y extends any[] = any[]> {
    new (...args: Y): T;
    (...args: Y): T;
    mockImplementation(fn: (...args: Y) => T): this;
    mockReturnValue(value: T): this;
    mockResolvedValue(value: T): this;
    mockRejectedValue(value: any): this;
    mockReturnThis(): this;
    mockReturnValueOnce(value: T): this;
    mockResolvedValueOnce(value: T): this;
    mockRejectedValueOnce(value: any): this;
    mockReturnThisOnce(): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): this;
    mockImplementationOnce(fn: (...args: Y) => T): this;
    getMockName(): string;
    mockName(name: string): this;
    mockReturnedValueOnce(value: T): this;
    mock: { calls: Y[]; instances: T[]; results: Array<{ type: 'return' | 'throw'; value: T }> };
  }
  
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toHaveAttribute(attr: string, value?: string): R;
    toHaveClass(className: string): R;
    toHaveStyle(style: Record<string, any>): R;
    toBeVisible(): R;
    toBeChecked(): R;
  }
}

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: (done?: jest.DoneCallback) => void, timeout?: number): void;
declare namespace test {
  function each<T>(cases: T[]): (
    name: string,
    fn: (arg: T, done?: jest.DoneCallback) => void,
    timeout?: number
  ) => void;
}
declare function expect(actual: any): any;

interface DoneCallback {
  (...args: any[]): void;
  fail(error?: string | { message: string }): void;
}