import { vi } from 'vitest';

// 全局的測試設置
// 可以在這裡添加全局的 beforeAll、afterAll 等鉤子

// 模擬全局的 fetch API
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}

// 模擬 Response 構造函數
if (!globalThis.Response) {
  globalThis.Response = class {
    constructor(public body?: BodyInit | null, public init?: ResponseInit) {}
    static json(data: any, init?: ResponseInit) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    }
  } as any;
}

// 模擬 Request 構造函數
if (!globalThis.Request) {
  globalThis.Request = class {
    constructor(public input: RequestInfo, public init?: RequestInit) {}
  } as any;
}
