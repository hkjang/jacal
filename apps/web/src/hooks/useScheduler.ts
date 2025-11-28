import { useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulerAPI } from '../lib/api';

export function useScheduler() {
  const queryClient = useQueryClient();

  const autoScheduleMutation = useMutation({
    mutationFn: schedulerAPI.autoSchedule,
    onSuccess: (data) => {
      alert(`Scheduled ${data.scheduled} tasks!`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      alert('Failed to auto-schedule tasks');
    },
  });

  return {
    autoScheduleMutation,
  };
}
