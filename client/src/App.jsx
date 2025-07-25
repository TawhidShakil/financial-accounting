import { useState } from 'react'
import Journal from './pages/Journal'
import './App.css'

function App() {
  return (
    <div className="bg-gray-50 text-gray-900">
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Journal />
      </main>

      <footer className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-600">
        <p>Accounting App © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App