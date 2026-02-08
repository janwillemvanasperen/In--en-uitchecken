export async function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocatie wordt niet ondersteund door je browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Locatietoegang geweigerd. Geef toestemming in je browser instellingen.'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Locatie niet beschikbaar. Controleer je GPS instellingen.'))
            break
          case error.TIMEOUT:
            reject(new Error('Locatie ophalen duurde te lang. Probeer het opnieuw.'))
            break
          default:
            reject(new Error('Onbekende fout bij ophalen locatie'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Check if user is within specified radius of a location
 * @param radius Radius in meters (default 500m)
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  locationLat: number,
  locationLng: number,
  radius: number = 500
): boolean {
  const distance = calculateDistance(userLat, userLng, locationLat, locationLng)
  return distance <= radius
}
