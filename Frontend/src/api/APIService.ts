export class APIService {
  // simula um GET
  static async get<T>(url: string): Promise<T> {
    console.log(`[MOCK GET] ${url}`);
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve({ message: `Response from GET ${url}` } as T);
      }, 500); // meio segundo de delay
    });
  }

  // simula um POST
  static async post<T>(url: string, body: any): Promise<T> {
    console.log(`[MOCK POST] ${url}`, body);
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve({ message: `Response from POST ${url}`, data: body } as T);
      }, 500);
    });
  }

  // simula um PUT
  static async put<T>(url: string, body: any): Promise<T> {
    console.log(`[MOCK PUT] ${url}`, body);
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve({ message: `Response from PUT ${url}`, data: body } as T);
      }, 500);
    });
  }

  // simula um DELETE
  static async delete<T>(url: string): Promise<T> {
    console.log(`[MOCK DELETE] ${url}`);
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve({ message: `Response from DELETE ${url}` } as T);
      }, 500);
    });
  }

  /** Retorna o payload informado após um pequeno delay (mock). */
  static respond<T>(data: T, delay = 1000): Promise<T> {
    return new Promise<T>((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  }

  /** Simula erro após um pequeno delay (útil para testar falhas). */
  static reject(error: Error | string, delay = 400): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(
        () => reject(typeof error === "string" ? new Error(error) : error),
        delay
      );
    });
  }
}
