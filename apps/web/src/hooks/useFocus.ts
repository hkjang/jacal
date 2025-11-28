import { useMutation, useQueryClient } from '@tanstack/react-query';
import { focusAPI } from '../lib/api';

export function useFocus() {
  const queryClient = useQueryClient();

  const focusTimeMutation = useMutation({
    mutationFn: focusAPI.protect,
    onSuccess: (data) => {
      alert(`Protected ${data.protected} focus time blocks!`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      alert('Failed to protect focus time');
    },
  });

  return {
    focusTimeMutation,
  };
}
