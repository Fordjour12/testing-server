import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/token/history')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/token/history"!</div>
}
