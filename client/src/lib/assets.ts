// Utility function to resolve asset paths for subdirectory deployment
export function getAssetUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Get base path from environment or default to current path
  const basePath = import.meta.env.BASE_URL || '/';
  
  // Combine base path with asset path
  return `${basePath}${cleanPath}`.replace(/\/+/g, '/');
}

// Convenience function for figmaAssets specifically
export function getFigmaAsset(filename: string): string {
  return getAssetUrl(`figmaAssets/${filename}`);
}