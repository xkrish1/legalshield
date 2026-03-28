import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix broken default Leaflet marker icons in bundled environments
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const RISK_COLORS = { High: '#dc2626', Moderate: '#d97706', Low: '#16a34a' }

function createRiskIcon(risk) {
  const color = RISK_COLORS[risk] || '#6b7280'
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 16px;
      height: 16px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize:   [16, 16],
    iconAnchor: [8, 8],
  })
}

// Re-centers map when leases change
function Recenter({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 14)
  }, [lat, lng, map])
  return null
}

export default function LeaseMap({ leases }) {
  if (!leases || leases.length === 0) return null

  const center = [leases[0].lat, leases[0].lng]

  return (
    <div style={{
      height: 420,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--color-border)',
    }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Recenter lat={center[0]} lng={center[1]} />
        {leases.map((l, i) => (
          <Marker
            key={i}
            position={[l.lat, l.lng]}
            icon={createRiskIcon(l.risk_bucket)}
          >
            <Popup>
              <strong>{l.address}</strong><br />
              Avg rent: <strong>${l.avg_rent}/mo</strong><br />
              Risk:{' '}
              <strong style={{ color: RISK_COLORS[l.risk_bucket] }}>
                {l.risk_bucket}
              </strong>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
