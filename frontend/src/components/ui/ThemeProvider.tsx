import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
type Theme = 'dark' | 'light'
const ThemeCtx = createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: 'dark', toggleTheme: () => {} })
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])
  return <ThemeCtx.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>{children}</ThemeCtx.Provider>
}
export const useTheme = () => useContext(ThemeCtx)
