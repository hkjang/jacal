import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventAPI, Event } from '../lib/api';

export function useEventMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (event: Partial<Event>) => eventAPI.create(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) => 
      eventAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
