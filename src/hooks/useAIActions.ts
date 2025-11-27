import { useState, useEffect } from 'react';
import { aiActionsService } from '../services/aiActionsService';
import { intentDetectionService } from '../services/intentDetectionService';
import { AIAction, ActionResult, ActionExecution, ActionIntent } from '../types/actions';

export function useAIActions(userId: string = 'default-user') {
  const [actions, setActions] = useState<AIAction[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ActionExecution[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    // Load actions
    setActions(aiActionsService.getActions());
    setExecutionHistory(aiActionsService.getExecutionHistory());

    // Subscribe to execution updates
    const unsubscribe = aiActionsService.subscribe((execution) => {
      setExecutionHistory(aiActionsService.getExecutionHistory());
      if (execution.status !== 'executing') {
        setIsExecuting(false);
      }
    });

    return unsubscribe;
  }, []);

  // Detect intent from message
  const detectIntent = (message: string): ActionIntent => {
    return intentDetectionService.detectIntent(message);
  };

  // Check if message is action request
  const isActionRequest = (message: string): boolean => {
    return intentDetectionService.isActionRequest(message);
  };

  // Execute action
  const executeAction = async (
    actionId: string,
    parameters: Record<string, any>
  ): Promise<ActionResult> => {
    setIsExecuting(true);
    try {
      const result = await aiActionsService.executeAction(actionId, parameters, userId);
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  // Get action by ID
  const getAction = (actionId: string): AIAction | undefined => {
    return aiActionsService.getAction(actionId);
  };

  return {
    actions,
    executionHistory,
    isExecuting,
    detectIntent,
    isActionRequest,
    executeAction,
    getAction,
  };
}
