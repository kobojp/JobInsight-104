import { CITY_OPTIONS, DISTRICT_MAP } from '../data/areas'

/**
 * Two-step area selector:
 *   Step 1 — city pills (multi-select)
 *   Step 2 — for each selected city with districts, show district panel
 *
 * Props:
 *   selectedCities:     string[]                  e.g. ['taipei', 'taichung']
 *   districtSelections: { [city]: string[] }       e.g. { taipei: ['taipei_daan'] }
 *   onCitiesChange:     (cities: string[]) => void
 *   onDistrictsChange:  (city: string, keys: string[]) => void
 */
export default function AreaSelector({
  selectedCities,
  districtSelections,
  onCitiesChange,
  onDistrictsChange,
}) {
  const toggleCity = (cityVal) => {
    if (selectedCities.includes(cityVal)) {
      onCitiesChange(selectedCities.filter(c => c !== cityVal))
    } else {
      onCitiesChange([...selectedCities, cityVal])
    }
  }

  const toggleDistrict = (city, districtKey) => {
    const current = districtSelections[city] || []
    if (current.includes(districtKey)) {
      onDistrictsChange(city, current.filter(k => k !== districtKey))
    } else {
      onDistrictsChange(city, [...current, districtKey])
    }
  }

  const selectAllDistricts = (city) => {
    onDistrictsChange(city, [])
  }

  // Cities that are selected AND have a district breakdown
  const expandedCities = selectedCities.filter(c => DISTRICT_MAP[c])

  return (
    <div>
      {/* Step 1: City pills */}
      <label className="block text-sm font-medium text-gray-600 mb-2">
        地區（可複選）
      </label>
      <div className="flex flex-wrap gap-2">
        {CITY_OPTIONS.map(city => (
          <button
            key={city.value}
            type="button"
            onClick={() => toggleCity(city.value)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              selectedCities.includes(city.value)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {city.label}
          </button>
        ))}
      </div>

      {/* Step 2: District panels for selected cities that have districts */}
      {expandedCities.length > 0 && (
        <div className="mt-3 space-y-3">
          {expandedCities.map(cityVal => {
            const cityLabel = CITY_OPTIONS.find(c => c.value === cityVal)?.label
            const districts = DISTRICT_MAP[cityVal]
            const selectedDistricts = districtSelections[cityVal] || []
            const isWholeCity = selectedDistricts.length === 0

            return (
              <div
                key={cityVal}
                className="border border-blue-200 rounded-lg p-3 bg-blue-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    {cityLabel} — 行政區細選
                  </span>
                  <span className="text-xs text-gray-500">
                    {isWholeCity ? '（全市）' : `已選 ${selectedDistricts.length} 區`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {/* "全市" pill */}
                  <button
                    type="button"
                    onClick={() => selectAllDistricts(cityVal)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      isWholeCity
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    全市
                  </button>

                  {/* District pills */}
                  {districts.map(d => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDistrict(cityVal, d.key)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        selectedDistricts.includes(d.key)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
