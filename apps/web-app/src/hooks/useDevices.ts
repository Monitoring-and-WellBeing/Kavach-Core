import { useState, useEffect, useCallback } from 'react'
import { devicesApi, Device } from '@/lib/devices'

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await devicesApi.list()
      setDevices(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  // Poll every 30 seconds to refresh statuses
  useEffect(() => {
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [fetch])

  const pause = useCallback(async (id: string) => {
    const updated = await devicesApi.pause(id)
    setDevices(prev => prev.map(d => d.id === id ? updated : d))
    return updated
  }, [])

  const resume = useCallback(async (id: string) => {
    const updated = await devicesApi.resume(id)
    setDevices(prev => prev.map(d => d.id === id ? updated : d))
    return updated
  }, [])

  const link = useCallback(async (code: string, name?: string, assignedTo?: string) => {
    const newDevice = await devicesApi.link(code, name, assignedTo)
    setDevices(prev => [...prev, newDevice])
    return newDevice
  }, [])

  const remove = useCallback(async (id: string) => {
    await devicesApi.remove(id)
    setDevices(prev => prev.filter(d => d.id !== id))
  }, [])

  return { devices, loading, error, refetch: fetch, pause, resume, link, remove }
}
