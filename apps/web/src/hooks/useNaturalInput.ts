import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nluAPI } from '../lib/api';

export function useNaturalInput() {
  const [naturalInput, setNaturalInput] = useState('');
  const queryClient = useQueryClient();

  // Natural language parsing mutation
  const parseMutation = useMutation({
    mutationFn: (input: string) => nluAPI.parse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNaturalInput('');
    },
  });

  const handleNaturalInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;
    parseMutation.mutate(naturalInput);
  };

  return {
    naturalInput,
    setNaturalInput,
    handleNaturalInput,
    parseMutation,
  };
}
