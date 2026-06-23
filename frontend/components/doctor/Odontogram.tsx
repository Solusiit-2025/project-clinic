'use client'

import React, { useState, useMemo } from 'react'
import { OdontogramStateData, ToothState, OdontogramCondition, Surface, ConditionType } from '@/types/odontogram.schema'

interface OdontogramProps {
  value: OdontogramStateData
  onChange: (newState: OdontogramStateData) => void
  readonly?: boolean
  doctorId?: string
}

const conditionColors: Record<ConditionType, string> = {
  normal: '#ffffff',
  karies: '#ef4444',          // red-500
  karies_sekunder: '#b91c1c', // red-700
  tambalan: '#22c55e',        // green-500
  missing: '#1f2937',         // gray-800
  sisa_akar: '#a855f7',       // purple-500
  crown: '#facc15',           // yellow-400
  bridge: '#3b82f6',          // blue-500
  implan: '#0ea5e9',          // sky-500
}

const conditionLabels: Record<ConditionType, string> = {
  normal: 'Normal',
  karies: 'Karies',
  karies_sekunder: 'Karies Sekunder',
  tambalan: 'Tambalan',
  missing: 'Missing',
  sisa_akar: 'Sisa Akar',
  crown: 'Crown',
  bridge: 'Bridge',
  implan: 'Implan',
}

const topAdultTeeth = [
  '18','17','16','15','14','13','12','11',
  '21','22','23','24','25','26','27','28'
]
const topChildTeeth = [
  '55','54','53','52','51',
  '61','62','63','64','65'
]
const bottomChildTeeth = [
  '85','84','83','82','81',
  '71','72','73','74','75'
]
const bottomAdultTeeth = [
  '48','47','46','45','44','43','42','41',
  '31','32','33','34','35','36','37','38'
]

// Determine if a tooth is on the right side of the mouth (left on screen)
const isRightSide = (tooth: string) => ['1', '4', '5', '8'].includes(tooth[0])
const isTopJaw = (tooth: string) => ['1', '2', '5', '6'].includes(tooth[0])

const ToothComponent = ({ 
  toothNumber, 
  state, 
  onSurfaceClick, 
  selected, 
  readonly 
}: { 
  toothNumber: string, 
  state?: ToothState, 
  onSurfaceClick: (tooth: string, surface: Surface) => void,
  selected: boolean,
  readonly: boolean
}) => {
  // Mapping orientation
  const isRight = isRightSide(toothNumber)
  
  // Logic to determine surface colors based on conditions
  // Last added condition for a surface takes precedence in display
  const getSurfaceColor = (s: Surface) => {
    let color = '#ffffff'
    if (!state) return color
    
    // Check existing conditions
    for (const cond of state.existing) {
      if (cond.surface.includes(s) || cond.surface.includes('full')) {
        color = conditionColors[cond.type]
      }
    }
    return color
  }

  // Check if there is any planned condition
  const hasPlanned = state?.planned && state.planned.length > 0
  const isMissing = state?.existing.some(c => c.type === 'missing')
  const isSisaAkar = state?.existing.some(c => c.type === 'sisa_akar')

  const handleSVGClick = (e: React.MouseEvent, surfaceId: Surface) => {
    e.stopPropagation()
    if (!readonly) onSurfaceClick(toothNumber, surfaceId)
  }

  // Define SVG polygons
  // Top: B (Buccal/Labial) for top jaw, L (Lingual/Palatal) for bottom jaw?
  // Usually top polygon is Buccal for upper jaw, Lingual for lower jaw?
  // Let's standardise: Top = B/L, Bottom = P/L, Center = O/I, Left/Right = M/D
  const surfaceMapping = {
    top: 'B' as Surface,
    bottom: 'P' as Surface, // Or L
    center: 'O' as Surface, // Or I
    left: isRight ? 'D' as Surface : 'M' as Surface,
    right: isRight ? 'M' as Surface : 'D' as Surface
  }

  const cTop = getSurfaceColor(surfaceMapping.top)
  const cBottom = getSurfaceColor(surfaceMapping.bottom)
  const cLeft = getSurfaceColor(surfaceMapping.left)
  const cRight = getSurfaceColor(surfaceMapping.right)
  const cCenter = getSurfaceColor(surfaceMapping.center)

  return (
    <div 
      className={`flex flex-col items-center cursor-pointer transition-all ${selected ? 'scale-110 ring-2 ring-primary ring-offset-2 rounded-md' : 'hover:scale-105'} relative`}
      onClick={() => { if (!readonly) onSurfaceClick(toothNumber, 'full') }}
    >
      <span className="text-xs font-semibold mb-1 text-gray-500">{toothNumber}</span>
      
      <div className="relative w-8 h-8 sm:w-10 sm:h-10">
        {hasPlanned && (
          <div className="absolute -inset-1 border-2 border-red-500 border-dashed rounded pointer-events-none z-10"></div>
        )}
        {isMissing || isSisaAkar ? (
          <div 
            className="absolute inset-0 rounded-full border-2 border-gray-400 flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: isMissing ? conditionColors.missing : conditionColors.sisa_akar }}
          >
            {isMissing ? 'X' : 'V'}
          </div>
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <polygon 
              points="0,0 100,0 75,25 25,25" 
              fill={cTop} 
              stroke="#94a3b8" strokeWidth="2"
              onClick={(e) => handleSVGClick(e, surfaceMapping.top)}
              className={readonly ? '' : 'hover:opacity-80 cursor-pointer'}
            />
            <polygon 
              points="100,0 100,100 75,75 75,25" 
              fill={cRight} 
              stroke="#94a3b8" strokeWidth="2"
              onClick={(e) => handleSVGClick(e, surfaceMapping.right)}
              className={readonly ? '' : 'hover:opacity-80 cursor-pointer'}
            />
            <polygon 
              points="0,100 100,100 75,75 25,75" 
              fill={cBottom} 
              stroke="#94a3b8" strokeWidth="2"
              onClick={(e) => handleSVGClick(e, surfaceMapping.bottom)}
              className={readonly ? '' : 'hover:opacity-80 cursor-pointer'}
            />
            <polygon 
              points="0,0 25,25 25,75 0,100" 
              fill={cLeft} 
              stroke="#94a3b8" strokeWidth="2"
              onClick={(e) => handleSVGClick(e, surfaceMapping.left)}
              className={readonly ? '' : 'hover:opacity-80 cursor-pointer'}
            />
            <rect 
              x="25" y="25" width="50" height="50" 
              fill={cCenter} 
              stroke="#94a3b8" strokeWidth="2"
              onClick={(e) => handleSVGClick(e, surfaceMapping.center)}
              className={readonly ? '' : 'hover:opacity-80 cursor-pointer'}
            />
          </svg>
        )}
      </div>
    </div>
  )
}

export default function Odontogram({ value, onChange, readonly = false, doctorId = 'dr-default' }: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [selectedSurface, setSelectedSurface] = useState<Surface | null>(null)
  const [isAdult, setIsAdult] = useState(true)
  
  // Layer to edit: 'existing' | 'planned'
  const [editLayer, setEditLayer] = useState<'existing' | 'planned'>('existing')

  const teethData = value?.teeth || {}

  const handleSurfaceClick = (tooth: string, surface: Surface) => {
    if (readonly) return
    setSelectedTooth(tooth)
    setSelectedSurface(surface)
  }

  const handleAddCondition = (type: ConditionType) => {
    if (!selectedTooth || !selectedSurface || readonly) return

    const currentState = teethData[selectedTooth] || { existing: [], planned: [] }
    
    if (type === 'normal') {
      // Clear all conditions for this surface on the active layer
      const newState = { ...value }
      if (!newState.teeth) newState.teeth = {}
      
      const filtered = currentState[editLayer].filter(c => !c.surface.includes(selectedSurface) && !c.surface.includes('full'))
      
      newState.teeth[selectedTooth] = {
        ...currentState,
        [editLayer]: filtered
      }
      
      onChange(newState)
      return
    }

    const newCondition: OdontogramCondition = {
      type,
      surface: selectedSurface === 'full' ? ['full'] : [selectedSurface],
      recordedAt: new Date().toISOString(),
      doctorId
    }

    const newState = { ...value }
    if (!newState.teeth) newState.teeth = {}
    
    // For 'missing', 'sisa_akar', 'crown', 'bridge', 'implan', they affect the 'full' tooth
    if (['missing', 'sisa_akar', 'crown', 'bridge', 'implan'].includes(type)) {
      newCondition.surface = ['full']
    }

    newState.teeth[selectedTooth] = {
      ...currentState,
      [editLayer]: [...currentState[editLayer], newCondition]
    }

    onChange(newState)
  }

  const renderToothRow = (teethArray: string[]) => {
    return (
      <div className="flex justify-center gap-1 sm:gap-2 mb-2 w-full flex-wrap">
        {teethArray.map((tooth, index) => {
          const isSelected = selectedTooth === tooth
          const isMiddle = index === teethArray.length / 2 - 1
          
          return (
            <React.Fragment key={tooth}>
              <ToothComponent 
                toothNumber={tooth} 
                state={teethData[tooth]}
                onSurfaceClick={handleSurfaceClick}
                selected={isSelected}
                readonly={readonly}
              />
              {isMiddle && <div className="w-4 sm:w-8 border-r-2 border-gray-300 mx-1"></div>}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">
            {isAdult ? 'Odontogram Dewasa' : 'Odontogram Anak'}
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm font-normal">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAdult} 
                onChange={(e) => setIsAdult(e.target.checked)}
                className="rounded text-primary border-slate-300 focus:ring-primary"
              />
              Tampilkan Gigi Dewasa
            </label>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-lg">
            {/* Top Jaw */}
            {isAdult ? renderToothRow(topAdultTeeth) : renderToothRow(topChildTeeth)}
            
            <div className="h-4 w-full border-b-2 border-dashed border-gray-300 my-2"></div>
            
            {/* Bottom Jaw */}
            {isAdult ? renderToothRow(bottomAdultTeeth) : renderToothRow(bottomChildTeeth)}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Legenda:</h3>
          <div className="flex flex-wrap gap-3 text-xs">
            {(Object.keys(conditionColors) as ConditionType[]).map(cond => {
              if (cond === 'normal') return null;
              return (
                <div key={cond} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: conditionColors[cond] }}></div>
                  <span className="text-slate-600">{conditionLabels[cond]}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-red-500 bg-transparent"></div>
              <span className="text-slate-600">Rencana Perawatan (Planned)</span>
            </div>
          </div>
        </div>

        {/* Edit Panel */}
        {!readonly && selectedTooth && (
          <div data-html2canvas-ignore="true" className="mt-6 p-4 border border-blue-100 rounded-xl bg-blue-50/50 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <span className="font-semibold text-blue-900">
                  Gigi {selectedTooth} - Area: <span className="font-bold text-blue-700">{selectedSurface === 'full' ? 'Seluruh Gigi' : selectedSurface}</span>
                </span>
                
                <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                  <button
                    onClick={() => setEditLayer('existing')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${editLayer === 'existing' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Kondisi Aktual
                  </button>
                  <button
                    onClick={() => setEditLayer('planned')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${editLayer === 'planned' ? 'bg-red-100 text-red-800 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Rencana (Planned)
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(conditionColors) as ConditionType[]).map(cond => (
                  <button
                    key={cond}
                    className="px-4 py-2 text-sm border rounded-full font-medium shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
                    style={{ 
                      backgroundColor: cond === 'normal' ? '#ffffff' : conditionColors[cond],
                      color: ['normal', 'crown'].includes(cond) ? '#1f2937' : '#ffffff',
                      borderColor: cond === 'normal' ? '#e2e8f0' : conditionColors[cond]
                    }}
                    onClick={() => handleAddCondition(cond)}
                  >
                    {cond === 'normal' ? 'Hapus / Normal' : conditionLabels[cond]}
                  </button>
                ))}
              </div>

              {/* List of current conditions for this tooth */}
              {teethData[selectedTooth] && (teethData[selectedTooth].existing.length > 0 || teethData[selectedTooth].planned.length > 0) && (
                <div className="mt-4 bg-white rounded-lg p-3 border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Riwayat Entri Gigi {selectedTooth}</h4>
                  <ul className="space-y-2">
                    {teethData[selectedTooth].existing.map((c, i) => (
                      <li key={`ex-${i}`} className="text-sm flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-700">{conditionLabels[c.type]}</span>
                          <span className="text-slate-400 mx-2">•</span>
                          <span className="text-slate-600">Area: {c.surface.join(', ')}</span>
                        </div>
                        <span className="text-xs text-slate-400">Aktual</span>
                      </li>
                    ))}
                    {teethData[selectedTooth].planned.map((c, i) => (
                      <li key={`pl-${i}`} className="text-sm flex items-center justify-between">
                        <div>
                          <span className="font-medium text-red-600">{conditionLabels[c.type]}</span>
                          <span className="text-slate-400 mx-2">•</span>
                          <span className="text-slate-600">Area: {c.surface.join(', ')}</span>
                        </div>
                        <span className="text-xs text-red-400 font-medium">Planned</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
