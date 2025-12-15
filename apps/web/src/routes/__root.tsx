import { HeadContent, createRootRoute, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ThemeProvider } from '@/components/theme-provider'
import { NotFound } from '@/components/NotFound'

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

      </html >

   )
}
