import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/token/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/token/"!</div>
}
