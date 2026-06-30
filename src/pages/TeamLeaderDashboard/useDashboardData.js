import { useState, useEffect, useCallback } from 'react';
import { teamLeaderApi } from '../../services/teamLeaderApi';
import { mapDashboardData } from './dashboardMapper';
import { isTlMockOn, buildMockTlRaw } from './mockData';

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Dev preview: rich fake data flowing through the real mapper.
      if (isTlMockOn()) {
        setData(mapDashboardData(buildMockTlRaw()));
        return;
      }
      const raw = await teamLeaderApi.getDashboard();
      setData(mapDashboardData(raw));
    } catch (e) {
      console.error('Failed to load dashboard', e);
      setError(e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
