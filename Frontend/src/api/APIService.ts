export class APIService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

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

        const text = await response.text();
        if (!text) {
            return undefined as TResponse;
        }

        return JSON.parse(text) as TResponse;
    }

    async get<TResponse>(endpoint: string): Promise<TResponse> {
        return this.request<TResponse>(endpoint, { method: "GET" });
    }

    async post<TRequest, TResponse>(
        endpoint: string,
        body: TRequest
    ): Promise<TResponse> {
        return this.request<TResponse>(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    async put<TRequest, TResponse>(
        endpoint: string,
        body: TRequest
    ): Promise<TResponse> {
        return this.request<TResponse>(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    async delete<TResponse>(endpoint: string): Promise<TResponse> {
        return this.request<TResponse>(endpoint, { method: "DELETE" });
    }
}
