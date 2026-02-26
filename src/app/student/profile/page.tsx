// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ProfilePhotoUpload } from '@/components/student/profile-photo-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfilePage() {
  const user = await requireStudent()
  const supabase = await createClient()

  // Fetch full profile
  const { data: profile } = await supabase
    .from('users')
    .select('*, coaches!users_coach_id_fkey(name)')
    .eq('id', user.id)
    .single()

  const coachName = (profile as any)?.coaches?.name || null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mijn Profiel</h1>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profielfoto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilePhotoUpload
            currentPhotoUrl={profile?.profile_photo_url || null}
            fullName={user.full_name}
          />
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Naam</p>
            <p className="font-medium">{user.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          {coachName && (
            <div>
              <p className="text-sm text-muted-foreground">Coach</p>
              <p className="font-medium">{coachName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Account aangemaakt</p>
            <p className="font-medium">
              {new Date(user.created_at).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
