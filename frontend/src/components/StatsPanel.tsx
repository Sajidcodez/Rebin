import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { SortEvent } from '../types'

export function StatsPanel() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['sort-events'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sort_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (error) throw error
        return data as SortEvent[]
      } catch (err) {
        console.warn('Supabase not configured, using mock data:', err)
        // Return mock data when Supabase is not configured
        return [
          {
            id: 1,
            user_id: 'demo-user',
            zip: '10001',
            items_json: ['plastic bottle', 'paper'],
            decision: 'recycling',
            co2e_saved: 0.5,
            created_at: new Date().toISOString()
          }
        ] as SortEvent[]
      }
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading stats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <p className="text-red-600">Error loading stats: {error.message}</p>
        </div>
      </div>
    )
  }

  const totalEvents = events?.length || 0
  const totalCO2Saved = events?.reduce((sum, event) => sum + event.co2e_saved, 0) || 0
  const recyclingCount = events?.filter(event => event.decision.includes('recycling')).length || 0
  const compostCount = events?.filter(event => event.decision.includes('compost')).length || 0
  const trashCount = events?.filter(event => event.decision.includes('trash')).length || 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Your Recycling Impact
        </h1>
        <p className="text-gray-600">
          Track your waste sorting progress and environmental impact
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {totalEvents}
          </div>
          <div className="text-gray-600">Items Sorted</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {totalCO2Saved.toFixed(2)}kg
          </div>
          <div className="text-gray-600">CO₂ Saved</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {recyclingCount}
          </div>
          <div className="text-gray-600">Recycled</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {compostCount}
          </div>
          <div className="text-gray-600">Composted</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {event.items_json.join(', ')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.created_at).toLocaleDateString()} • 
                    ZIP: {event.zip || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    event.decision.includes('recycling') ? 'bg-blue-100 text-blue-800' :
                    event.decision.includes('compost') ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {event.decision}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    +{event.co2e_saved.toFixed(2)}kg CO₂
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No sorting events yet. Start by uploading a photo!
          </div>
        )}
      </div>
    </div>
  )
}
