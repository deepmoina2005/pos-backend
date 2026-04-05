export async function withDbRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("Can't reach database server") || 
        errorMessage.includes("Connection pool timeout") ||
        errorMessage.includes("socket_timeout") ||
        errorMessage.includes("pool_timeout") ||
        errorMessage.includes("connect_timeout")
      ) {
        console.warn(`Database connection failed, retrying in ${delay}ms... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; // Not a transient connection error, throw it immediately
    }
  }
  throw lastError;
}
