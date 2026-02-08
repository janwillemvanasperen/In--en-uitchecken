'use client'

import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HistoryFilterTabsProps {
  currentFilter: 'week' | 'month' | 'all'
}

export function HistoryFilterTabs({ currentFilter }: HistoryFilterTabsProps) {
  return (
    <Tabs value={currentFilter} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="week" asChild>
          <Link href="/student/history?filter=week">Week</Link>
        </TabsTrigger>
        <TabsTrigger value="month" asChild>
          <Link href="/student/history?filter=month">Maand</Link>
        </TabsTrigger>
        <TabsTrigger value="all" asChild>
          <Link href="/student/history?filter=all">Alle</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
