// Deep link listening lives in _layout.tsx. This special expo-router file is
// only for rewriting incoming deep link paths before routing.
export function redirectSystemPath({ path }: { path: string }) {
  return path;
}
