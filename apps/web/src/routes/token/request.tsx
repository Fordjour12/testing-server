import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/token/request')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/token/request"!</div>
}
