'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save } from 'lucide-react'
import { updateSetting } from '@/app/admin/actions'
import type { Settings } from '@/types'

const SETTING_LABELS: Record<string, { label: string; description: string; type: string }> = {
  minimum_hours_per_week: {
    label: 'Minimum uren per week',
    description: 'Minimum aantal uren dat een student per week moet inplannen',
    type: 'number',
  },
  default_start_time: {
    label: 'Standaard starttijd',
    description: 'Standaard starttijd voor nieuwe roosters',
    type: 'time',
  },
  schedule_approval_period_weeks: {
    label: 'Rooster geldigheidsperiode (weken)',
    description: 'Aantal weken dat een goedgekeurd rooster geldig is',
    type: 'number',
  },
  geofence_radius_meters: {
    label: 'Geofence radius (meters)',
    description: 'Maximale afstand tot locatie voor GPS check-in',
    type: 'number',
  },
}

export function SettingsForm({ settings }: { settings: Settings[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map(s => [s.key, s.value]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async (key: string) => {
    setSaving(key)
    setMessage(null)

    const result = await updateSetting(key, values[key])
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Instelling opgeslagen' })
    }

    setSaving(null)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {settings.map((setting) => {
        const config = SETTING_LABELS[setting.key]
        if (!config) return null

        return (
          <Card key={setting.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{config.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor={setting.key} className="sr-only">{config.label}</Label>
                  <Input
                    id={setting.key}
                    type={config.type}
                    value={values[setting.key] || ''}
                    onChange={(e) => setValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSave(setting.key)}
                  disabled={saving === setting.key || values[setting.key] === setting.value}
                >
                  {saving === setting.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="ml-2">Opslaan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
