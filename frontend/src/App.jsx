import React from 'react'
import TwoPersonChat from './TwoPersonChat'
export default function App(){
  return <TwoPersonChat localUser={'Alex'} otherUser={'Rin'} serverUrl={import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'} />
}
