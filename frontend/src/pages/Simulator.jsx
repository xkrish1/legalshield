import React from 'react'
import LandlordSim from '../components/simulator/LandlordSim'
import LawyerFinder from '../components/lawyer/LawyerFinder'

export default function Simulator() {
  return (
    <div className="fade-in">
      <h1 className="page-title">Tenant Tools</h1>
      <p className="page-subtitle">
        Simulate landlord responses and find legal help near you.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <LandlordSim />
        <LawyerFinder />
      </div>
    </div>
  )
}
