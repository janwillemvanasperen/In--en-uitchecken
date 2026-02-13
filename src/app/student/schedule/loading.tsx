import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ScheduleLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
