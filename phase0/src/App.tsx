import { useState } from 'react'

interface NHTSAResult {
  Make: string
  Model: string
  ModelYear: string
  Manufacturer: string
  BodyClass: string
  DriveType: string
  FuelTypePrimary: string
  EngineConfiguration: string
  EngineCylinders: string
  DisplacementL: string
  TransmissionStyle: string
  PlantCountry: string
  VehicleType: string
  ErrorCode: string
  ErrorText: string
}

interface Recall {
  NHTSACampaignNumber: string
  ReportReceivedDate: string
  Component: string
  Summary: string
  Manufacturer: string
}

function App() {
  const [vin, setVin] = useState('')
  const [result, setResult] = useState<NHTSAResult | null>(null)
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const validateVin = (v: string): string | null => {
    const clean = v.trim().toUpperCase()
    if (clean.length !== 17) return 'VIN must be exactly 17 characters'
    if (/[IOQ]/.test(clean)) return 'VIN cannot contain I, O, or Q'
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(clean)) return 'VIN contains invalid characters'
    return null
  }

  const lookup = async () => {
    const clean = vin.trim().toUpperCase()
    const validationError = validateVin(clean)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setRecalls([])
    setSearched(true)

    try {
      const [decodeRes, recallRes] = await Promise.all([
        fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${clean}?format=json`),
        fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?make=&model=&modelYear=&vin=${clean}`)
      ])

      const decodeData = await decodeRes.json()
      const vehicle = decodeData.Results?.[0]

      if (!vehicle || vehicle.ErrorCode === '0') {
        setResult(vehicle || null)
      } else if (vehicle.ErrorCode?.includes('1')) {
        setResult(vehicle)
      } else {
        setResult(vehicle)
      }

      const recallData = await recallRes.json()
      setRecalls(recallData.results || [])
    } catch {
      setError('Failed to fetch vehicle data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    lookup()
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">OnChainCarFacts</h1>
          <a
            href="https://github.com/mllarson-build/OnChainCarFacts"
            target="_blank"
            rel="noopener"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Hero + Search */}
      <main className="max-w-3xl mx-auto px-4">
        <section className="py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Check any car's history. Free.
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Enter a VIN to see vehicle specs, recalls, and safety data. No signup. No payment.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={vin}
              onChange={(e) => {
                setVin(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              aria-label="Vehicle Identification Number"
              autoComplete="off"
              className="flex-1 min-h-12 px-4 border border-gray-300 rounded-lg text-base font-mono
                         placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600
                         focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || vin.trim().length === 0}
              className="min-h-12 px-6 bg-gray-900 text-white rounded-lg font-medium text-base
                         hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                         focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching
                </span>
              ) : 'Search'}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-red-600 text-sm">{error}</p>
          )}
        </section>

        {/* Results */}
        {loading && !result && (
          <section className="pb-16">
            <div className="border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          </section>
        )}

        {result && result.Make && (
          <section className="pb-16 space-y-6">
            {/* Vehicle Identity */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-mono">{vin.trim().toUpperCase()}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {result.ModelYear} {result.Make} {result.Model}
                  </h3>
                  <p className="text-gray-500 mt-1">{result.Manufacturer}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  NHTSA Only
                </span>
              </div>
            </div>

            {/* Specs */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4">Vehicle Specs</h4>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Body', result.BodyClass],
                  ['Drive', result.DriveType],
                  ['Fuel', result.FuelTypePrimary],
                  ['Engine', [result.EngineConfiguration, result.EngineCylinders ? `${result.EngineCylinders} cyl` : '', result.DisplacementL ? `${result.DisplacementL}L` : ''].filter(Boolean).join(', ')],
                  ['Transmission', result.TransmissionStyle],
                  ['Type', result.VehicleType],
                  ['Made In', result.PlantCountry],
                ].filter(([, val]) => val).map(([label, val]) => (
                  <div key={label}>
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-medium">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Recalls */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4">
                Recalls {recalls.length > 0 && <span className="text-red-600">({recalls.length})</span>}
              </h4>
              {recalls.length === 0 ? (
                <p className="text-gray-500 text-sm">No open recalls found for this VIN.</p>
              ) : (
                <ul className="space-y-4">
                  {recalls.map((r, i) => (
                    <li key={i} className="border-l-2 border-red-400 pl-4">
                      <p className="text-sm font-medium">{r.Component}</p>
                      <p className="text-sm text-gray-600 mt-1">{r.Summary}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Campaign #{r.NHTSACampaignNumber} | {r.ReportReceivedDate}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* CTA */}
            <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 text-sm">
                No community records yet. On-chain vehicle history is coming soon.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                OnChainCarFacts is building a free, open vehicle history protocol.
              </p>
            </div>
          </section>
        )}

        {searched && !loading && result && !result.Make && (
          <section className="pb-16">
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-500">VIN not found in the NHTSA database. Double-check the VIN and try again.</p>
            </div>
          </section>
        )}
      </main>

      {/* How it works */}
      {!searched && (
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-sm">
            <div>
              <p className="text-2xl mb-2">1</p>
              <p className="font-medium">Enter VIN</p>
              <p className="text-gray-500 mt-1">Find the 17-character VIN on the dashboard or door jamb</p>
            </div>
            <div>
              <p className="text-2xl mb-2">2</p>
              <p className="font-medium">See History</p>
              <p className="text-gray-500 mt-1">Vehicle specs, recalls, and safety data from NHTSA</p>
            </div>
            <div>
              <p className="text-2xl mb-2">3</p>
              <p className="font-medium">Verify On-Chain</p>
              <p className="text-gray-500 mt-1">Coming soon: community records anchored on the blockchain</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <p>OnChainCarFacts</p>
          <p>Data from NHTSA. Free and open source.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
