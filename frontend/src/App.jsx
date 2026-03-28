import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Results from './pages/Results'
import Letter from './pages/Letter'
import Simulator from './pages/Simulator'
import MapComparison from './pages/MapComparison'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/results"    element={<Results />} />
          <Route path="/letter"     element={<Letter />} />
          <Route path="/simulator"  element={<Simulator />} />
          <Route path="/map"        element={<MapComparison />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
