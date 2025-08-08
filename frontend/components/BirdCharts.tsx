'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Feather, TreePine } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface BirdChartsProps {
  speciesData: Record<string, number>
  locationData: Record<string, number>
  onSpeciesClick?: (species: string) => void
  onLocationClick?: (location: string) => void
  activeFilter?: { type: 'species' | 'location', value: string } | null
}

// Nature-inspired color palette
const COLORS = [
  '#2D5A2D', '#87A96B', '#C65D00', '#8B6F47', '#87CEEB',
  '#6B8E4E', '#A8896A', '#4A7C4A', '#C9B199', '#537239'
]

const ACTIVE_COLOR = '#C65D00' // Terracotta for active selection

export function BirdCharts({ speciesData, locationData, onSpeciesClick, onLocationClick, activeFilter }: BirdChartsProps) {
  // Transform and sort data for species
  const sortedSpecies = Object.entries(speciesData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const speciesLabels = sortedSpecies.map(([name]) => 
    name.length > 25 ? name.substring(0, 25) + '...' : name
  )
  const speciesValues = sortedSpecies.map(([_, count]) => count)
  const fullSpeciesNames = sortedSpecies.map(([name]) => name)

  // Transform and sort data for locations
  const sortedLocations = Object.entries(locationData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const locationLabels = sortedLocations.map(([name]) => 
    name.length > 30 ? name.substring(0, 30) + '...' : name
  )
  const locationValues = sortedLocations.map(([_, count]) => count)
  const fullLocationNames = sortedLocations.map(([name]) => name)

  // Determine colors based on active filter
  const speciesColors = fullSpeciesNames.map(name => 
    activeFilter?.type === 'species' && activeFilter.value === name 
      ? ACTIVE_COLOR 
      : COLORS[fullSpeciesNames.indexOf(name) % COLORS.length]
  )

  const locationColors = fullLocationNames.map(name => 
    activeFilter?.type === 'location' && activeFilter.value === name 
      ? ACTIVE_COLOR 
      : COLORS[(fullLocationNames.indexOf(name) + 3) % COLORS.length]
  )

  const speciesChartData = {
    labels: speciesLabels,
    datasets: [
      {
        label: 'Sightings',
        data: speciesValues,
        backgroundColor: speciesColors,
        borderWidth: 2,
        borderColor: speciesColors.map(color => color === ACTIVE_COLOR ? color : 'transparent'),
        borderRadius: 8,
        hoverBackgroundColor: speciesColors.map(color => color === ACTIVE_COLOR ? color : '#C65D00'),
      }
    ]
  }

  const locationChartData = {
    labels: locationLabels,
    datasets: [
      {
        label: 'Sightings',
        data: locationValues,
        backgroundColor: locationColors,
        borderWidth: 2,
        borderColor: locationColors.map(color => color === ACTIVE_COLOR ? color : 'transparent'),
        borderRadius: 8,
        hoverBackgroundColor: locationColors.map(color => color === ACTIVE_COLOR ? color : '#C65D00'),
      }
    ]
  }

  const createChartOptions = (type: 'species' | 'location') => ({
    indexAxis: 'y' as const, // This makes it horizontal
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index
        if (type === 'species' && onSpeciesClick) {
          onSpeciesClick(fullSpeciesNames[index])
        } else if (type === 'location' && onLocationClick) {
          onLocationClick(fullLocationNames[index])
        }
      }
    },
    onHover: (_: any, elements: any[]) => {
      const canvas = _.native?.target as HTMLCanvasElement
      if (canvas) {
        canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default'
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(45, 90, 45, 0.9)',
        padding: 12,
        titleFont: {
          size: 14,
          family: 'Montserrat'
        },
        bodyFont: {
          size: 13,
          family: 'Merriweather'
        },
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            return `Sightings: ${context.parsed.x}`
          },
          afterLabel: function(context: any) {
            const isActive = (type === 'species' && activeFilter?.type === 'species' && 
                            activeFilter.value === fullSpeciesNames[context.dataIndex]) ||
                           (type === 'location' && activeFilter?.type === 'location' && 
                            activeFilter.value === fullLocationNames[context.dataIndex])
            return isActive ? '(Currently filtered)' : 'Click to filter'
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: '#E5E7EB'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            family: 'Merriweather'
          },
          color: '#8B6F47'
        }
      }
    }
  })

  return (
    <div className="h-[500px] flex flex-col gap-4">
      <div className="bg-white rounded-xl shadow-nature p-4 border border-sage-100 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-forest-100 rounded-lg">
              <Feather className="w-4 h-4 text-forest-600" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-forest-600">Species Distribution</h3>
              <p className="text-xs text-earth-500">Click bars to filter • Top 10</p>
            </div>
          </div>
          {activeFilter?.type === 'species' && (
            <div className="px-2 py-0.5 bg-terracotta-100 rounded-full">
              <span className="text-xs font-heading font-semibold text-terracotta-600">Active</span>
            </div>
          )}
        </div>
        
        <div className="flex-1" style={{ minHeight: '0' }}>
          <Bar data={speciesChartData} options={createChartOptions('species')} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-nature p-4 border border-sage-100 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sage-100 rounded-lg">
              <TreePine className="w-4 h-4 text-sage-600" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-forest-600">Location Hotspots</h3>
              <p className="text-xs text-earth-500">Click bars to filter • Top 8</p>
            </div>
          </div>
          {activeFilter?.type === 'location' && (
            <div className="px-2 py-0.5 bg-terracotta-100 rounded-full">
              <span className="text-xs font-heading font-semibold text-terracotta-600">Active</span>
            </div>
          )}
        </div>
        
        <div className="flex-1" style={{ minHeight: '0' }}>
          <Bar data={locationChartData} options={createChartOptions('location')} />
        </div>
      </div>
    </div>
  )
}