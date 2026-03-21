import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { devicesApi, Device } from '@/lib/devices'

const DEVICES_KEY = ['devices'] as const

export function useDevices() {
  const queryClient = useQueryClient()

  const {
    data: devices = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: DEVICES_KEY,
    queryFn: devicesApi.list,
    refetchInterval: 30_000,
  })

  const error = queryError
    ? ((queryError as any).response?.data?.message ?? 'Failed to load devices')
    : null

  const pauseMutation = useMutation({
    mutationFn: (id: string) => devicesApi.pause(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<Device[]>(DEVICES_KEY, (prev = []) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      )
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => devicesApi.resume(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<Device[]>(DEVICES_KEY, (prev = []) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      )
    },
  })

  const linkMutation = useMutation({
    mutationFn: ({
      code,
      name,
      assignedTo,
    }: {
      code: string
      name?: string
      assignedTo?: string
    }) => devicesApi.link(code, name, assignedTo),
    onSuccess: (newDevice) => {
      queryClient.setQueryData<Device[]>(DEVICES_KEY, (prev = []) => [
        ...prev,
        newDevice,
      ])
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => devicesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Device[]>(DEVICES_KEY, (prev = []) =>
        prev.filter((d) => d.id !== id)
      )
    },
  })

  return {
    devices,
    loading,
    error,
    refetch,
    pause: (id: string) => pauseMutation.mutateAsync(id),
    resume: (id: string) => resumeMutation.mutateAsync(id),
    link: (code: string, name?: string, assignedTo?: string) =>
      linkMutation.mutateAsync({ code, name, assignedTo }),
    remove: (id: string) => removeMutation.mutateAsync(id),
  }
}
