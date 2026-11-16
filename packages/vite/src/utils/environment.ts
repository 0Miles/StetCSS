/** The Vite environment a hook runs in; builds without the environment API report `client`. */
export function getEnvironmentName(pluginContext: unknown) {
  return (pluginContext as { environment?: { name?: string } } | undefined)?.environment?.name ?? 'client'
}
