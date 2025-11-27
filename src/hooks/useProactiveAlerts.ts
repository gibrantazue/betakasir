import { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';
import { ProactiveAlert, AlertStats } from '../types/alerts';

export function useProactiveAlerts() {
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    unread: 0,
    byType: { warning: 0, info: 0, success: 0, opportunity: 0, critical: 0 },
    byCategory: { stock: 0, sales: 0, system: 0, opportunity: 0, employee: 0 },
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
  });

  useEffect(() => {
    // Subscribe to alert updates
    const unsubscribe = alertService.subscribe((newAlerts) => {
      setAlerts(newAlerts);
      setStats(alertService.getStats());
    });

    // Start monitoring
    alertService.startMonitoring();

    // Initial load
    setAlerts(alertService.getUnreadAlerts());
    setStats(alertService.getStats());

    return () => {
      unsubscribe();
      alertService.stopMonitoring();
    };
  }, []);

  const markAsRead = (alertId: string) => {
    alertService.markAsRead(alertId);
  };

  const dismissAlert = (alertId: string) => {
    alertService.dismissAlert(alertId);
  };

  const clearAll = () => {
    alertService.clearAll();
  };

  const runChecks = async () => {
    return await alertService.runAllChecks();
  };

  return {
    alerts,
    stats,
    markAsRead,
    dismissAlert,
    clearAll,
    runChecks,
  };
}
