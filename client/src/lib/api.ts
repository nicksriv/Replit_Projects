// Base path configuration for subdirectory deployment
const BASE_PATH = "/apps/youtube-ai";

export function getApiUrl(url: string): string {
  // If URL already starts with the base path, return as is
  if (url.startsWith(BASE_PATH)) {
    return url;
  }
  // If URL is absolute (starts with http), return as is
  if (url.startsWith('http')) {
    return url;
  }
  // Prepend base path to relative URLs
  return `${BASE_PATH}${url}`;
}

// Helper function for making API requests with proper base path
export async function fetchApi(url: string, options?: RequestInit): Promise<Response> {
  return fetch(getApiUrl(url), options);
}