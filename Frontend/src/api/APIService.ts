// api-service.ts
export class APIService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    // Método genérico para requisições
    private async request<TResponse>(
        endpoint: string,
        options: RequestInit
    ): Promise<TResponse> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        return (await response.json()) as TResponse;
    }

    // GET
    async get<TResponse>(endpoint: string): Promise<TResponse> {
        return this.request<TResponse>(endpoint, {
            method: "GET",
        });
    }

    // POST
    async post<TRequest, TResponse>(
        endpoint: string,
        body: TRequest
    ): Promise<TResponse> {
        return this.request<TResponse>(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    // PUT
    async put<TRequest, TResponse>(
        endpoint: string,
        body: TRequest
    ): Promise<TResponse> {
        return this.request<TResponse>(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    // DELETE
    async delete<TResponse>(endpoint: string): Promise<TResponse> {
        return this.request<TResponse>(endpoint, {
            method: "DELETE",
        });
    }
}
