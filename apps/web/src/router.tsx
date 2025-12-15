import { createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { NotFound } from './components/NotFound'
import { DefaultCatchErrorBoundary } from './components/DefaultErrorBoundary'

// Create a new router instance
export const getRouter = () => {
   const router = createRouter({
      routeTree,
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      defaultNotFoundComponent: NotFound,
      defaultErrorComponent: DefaultCatchErrorBoundary,
      
   })

   return router
}
