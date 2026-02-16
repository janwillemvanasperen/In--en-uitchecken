'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download } from 'lucide-react'
import type { Coach } from '@/types'

type CheckInWithDetails = {
  id: string
  user_id: string
  location_id: string
  check_in_time: string
  check_out_time: string | null
  expected_start: string
  expected_end: string
  users: { full_name: string } | null
  locations: { name: string } | null
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(checkIn: string, checkOut: string | null): string {
  if (!checkOut) return '-'
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}u ${minutes}m`
}

export function CheckInList({
  checkIns,
  coaches = [],
  userCoachMap = {},
}: {
  checkIns: CheckInWithDetails[]
  coaches?: Coach[]
  userCoachMap?: Record<string, string | null>
}) {
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [coachFilter, setCoachFilter] = useState('__all__')

  const filteredCheckIns = checkIns.filter((ci) => {
    const ciDate = new Date(ci.check_in_time).toISOString().split('T')[0]
    const matchesDate = ciDate === dateFilter
    const matchesCoach =
      coachFilter === '__all__' ||
      (coachFilter === '__none__' && !userCoachMap[ci.user_id]) ||
      userCoachMap[ci.user_id] === coachFilter
    return matchesDate && matchesCoach
  })

  const coachNameMap = Object.fromEntries(coaches.map((c) => [c.id, c.name]))

  const handleExportCSV = () => {
    const headers = ['Student', 'Coach', 'Locatie', 'Check-in', 'Check-out', 'Verwacht start', 'Verwacht eind', 'Duur', 'Status']
    const rows = filteredCheckIns.map((ci) => {
      const coachId = userCoachMap[ci.user_id]
      return [
      (ci.users as any)?.full_name || 'Onbekend',
      coachId ? (coachNameMap[coachId] || '') : '',
      (ci.locations as any)?.name || 'Onbekend',
      formatTime(ci.check_in_time),
      ci.check_out_time ? formatTime(ci.check_out_time) : 'Actief',
      formatTime(ci.expected_start),
      formatTime(ci.expected_end),
      formatDuration(ci.check_in_time, ci.check_out_time),
      ci.check_out_time ? 'Afgerond' : 'Actief',
    ]})

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `check-ins-${dateFilter}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <Label htmlFor="date-filter">Datum</Label>
          <Input
            id="date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        {coaches.length > 0 && (
          <div>
            <Label>Coach</Label>
            <Select value={coachFilter} onValueChange={setCoachFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle coaches</SelectItem>
                <SelectItem value="__none__">Geen coach</SelectItem>
                {coaches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
      </div>

      {filteredCheckIns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Geen check-ins gevonden voor deze datum.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Locatie</th>
                  <th className="text-left px-4 py-3 font-medium">Check-in</th>
                  <th className="text-left px-4 py-3 font-medium">Check-out</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Duur</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCheckIns.map((ci) => (
                  <tr key={ci.id}>
                    <td className="px-4 py-3 font-medium">
                      {(ci.users as any)?.full_name || 'Onbekend'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {(ci.locations as any)?.name || 'Onbekend'}
                    </td>
                    <td className="px-4 py-3">{formatTime(ci.check_in_time)}</td>
                    <td className="px-4 py-3">
                      {ci.check_out_time ? formatTime(ci.check_out_time) : '-'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {formatDuration(ci.check_in_time, ci.check_out_time)}
                    </td>
                    <td className="px-4 py-3">
                      {ci.check_out_time ? (
                        <Badge variant="secondary">Afgerond</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actief</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredCheckIns.length} check-in{filteredCheckIns.length !== 1 ? 's' : ''}
            {' · '}
            {filteredCheckIns.filter(ci => !ci.check_out_time).length} actief
          </p>
        </>
      )}
    </div>
  )
}
