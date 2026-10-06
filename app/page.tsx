import { Link } from 'lucide-react'
import React from 'react'

function page() {
  return (
    <div>

      <h1 className=''>follow this link to enter the app</h1>
      <Link href='/chat' className='cursor-pointer'>Click me</Link>
    </div>
  )
}

export default page