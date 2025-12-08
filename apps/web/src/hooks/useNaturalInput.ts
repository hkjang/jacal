import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nluAPI, PendingAction } from '../lib/api';

export function useNaturalInput() {
  const [naturalInput, setNaturalInput] = useState('');
  const [pendingActions, setPendingActions] = useState<PendingAction[] | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const queryClient = useQueryClient();

  // Natural language parsing mutation
  const parseMutation = useMutation({
    mutationFn: (input: string) => nluAPI.parse(input),
    onSuccess: (data) => {
      if (data.requiresConfirmation && data.pendingActions && data.pendingActions.length > 0) {
        // Show confirmation dialog
        setPendingActions(data.pendingActions);
        setConfirmMessage(data.pendingActions.map(a => a.message).join('\n'));
      } else {
        // Action completed, refresh data
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        setNaturalInput('');
      }
    },
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: (actions: PendingAction[]) => nluAPI.confirm(actions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setPendingActions(null);
      setConfirmMessage('');
      setNaturalInput('');
    },
  });

  const handleNaturalInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;
    parseMutation.mutate(naturalInput);
  };

  const handleConfirm = () => {
    if (pendingActions) {
      confirmMutation.mutate(pendingActions);
    }
  };

  const handleCancel = () => {
    setPendingActions(null);
    setConfirmMessage('');
  };

  return {
    naturalInput,
    setNaturalInput,
    handleNaturalInput,
    parseMutation,
    // Confirmation state
    showConfirmation: pendingActions !== null,
    confirmMessage,
    handleConfirm,
    handleCancel,
    confirmMutation,
  };
}
