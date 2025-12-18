import { HeadContent, createRootRoute, Scripts, Link } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ThemeProvider } from '@/components/theme-provider'
import { NotFound } from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import { Zap, Home, User, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useState, useEffect } from 'react'

import appCss from '../styles.css?url'
import { DefaultCatchErrorBoundary } from '@/components/DefaultErrorBoundary'

export const Route = createRootRoute({
   head: () => ({
      meta: [
         {
            charSet: 'utf-8',
         },
         {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1',
         },
         {
            title: 'TanStack Start Starter',
         },
      ],
      links: [
         {
            rel: 'stylesheet',
            href: appCss,
         },
      ],
   }),
   notFoundComponent: () => {
      <RootDocument>
         <NotFound />,
      </RootDocument>
   },
   errorComponent: ({ error, reset }) => {
      <RootDocument>
         <DefaultCatchErrorBoundary error={error} reset={reset} />
      </RootDocument>
   },
   shellComponent: RootDocument,
})


// Navigation component
function Navigation() {
   const [isAuthenticated, setIsAuthenticated] = useState(false)
   const [user, setUser] = useState<any>(null)

   useEffect(() => {
      const checkAuth = async () => {
         try {
            const session = await authClient.getSession({
               fetchOptions: {
                  headers: {
                     'cookie': document.cookie
                  }
               }
            })
            setIsAuthenticated(!!session.data?.user)
            setUser(session.data?.user)
         } catch (error) {
            console.error('Auth check failed:', error)
            setIsAuthenticated(false)
         }
      }

      checkAuth()
   }, [])

   const handleLogout = async () => {
      try {
         await authClient.signOut()
         setIsAuthenticated(false)
         setUser(null)
         window.location.href = '/login'
      } catch (error) {
         console.error('Logout failed:', error)
      }
   }

   return (
      <nav className="border-b bg-background">
         <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
                     <Zap className="h-5 w-5 text-primary" />
                     AI Planner
                  </Link>

                  {isAuthenticated && (
                     <div className="flex items-center gap-4 text-sm">
                        <Link
                           to="/generate"
                           className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                        >
                           <Home className="h-4 w-4" />
                           Dashboard
                        </Link>
                        <Link
                           to="/token"
                           className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                        >
                           <Zap className="h-4 w-4" />
                           Tokens
                        </Link>
                     </div>
                  )}
               </div>

               <div className="flex items-center gap-3">
                  {isAuthenticated ? (
                     <>
                        <div className="flex items-center gap-2 text-sm">
                           <User className="h-4 w-4" />
                           <span className="hidden sm:inline">
                              {user?.name || user?.email}
                           </span>
                        </div>
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={handleLogout}
                           className="flex items-center gap-2"
                        >
                           <LogOut className="h-4 w-4" />
                           <span className="hidden sm:inline">Logout</span>
                        </Button>
                     </>
                  ) : (
                     <div className="flex items-center gap-2">
                        <Link to="/login">
                           <Button variant="outline" size="sm">
                              Sign In
                           </Button>
                        </Link>
                        <Link to="/signup">
                           <Button size="sm">
                              Sign Up
                           </Button>
                        </Link>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </nav>
   )
}

function RootDocument({ children }: { children: React.ReactNode }) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <HeadContent />
         </head>
         <body>
            <ThemeProvider
               attribute="class"
               defaultTheme="system"
               enableSystem
               disableTransitionOnChange
            >
               <Navigation />
               {children}
               <TanStackDevtools
                  config={{
                     position: 'bottom-right',
                  }}
                  plugins={[
                     {
                        name: 'Tanstack Router',
                        render: <TanStackRouterDevtoolsPanel />,
                     },
                  ]}
               />
            </ThemeProvider>
            <Scripts />
         </body>
      </html>
   )
}
