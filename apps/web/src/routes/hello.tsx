
// routes/hello.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/hello')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        return new Response(JSON.stringify({ message: `Hello, ${body.name}!` }))
      },
    },
  },
  component: HelloComponent,
})

function HelloComponent() {
  const [reply, setReply] = useState('')

  return (
    <div>
      <Button
        onClick={() => {
          fetch('/hello', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'Tanner' }),
          })
            .then((res) => res.json())
            .then((data) => {
              setReply(data.message)
            })
        }}
      >
        Say Hello
      </Button>

      <div>
        This is the reply: {reply}
      </div>
    </div>
  )
}
