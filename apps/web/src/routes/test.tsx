import DashboardPage from '@/components/dashboard/page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/test')({
  component: DashboardPage,
})

/*function RouteComponent() {
  return <div>Hello "/test"!</div>
}*/
