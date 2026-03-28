import React from 'react'
import LandlordSim from '../components/simulator/LandlordSim'

export default function Simulator() {
  return (
    <div className="fade-in">
      <h1 className="page-title">Negotiation Practice</h1>
      <p className="page-subtitle">
        Practice real tenant negotiation scenarios against a landlord. Each round, pick the best response from 4 options — guided by NJ tenant law.
      </p>
      <LandlordSim />
    </div>
  )
}
