import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiStat, EuiTitle, EuiSpacer } from '@elastic/eui';
import { TodoStats } from '../types/todo.types';

interface StatsPanelProps {
  stats: TodoStats;
  loading?: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, loading = false }) => {
  return (
    <>
      <EuiTitle size="xs">
        <h3>Task Statistics</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="m">
        <EuiFlexItem>
          <EuiPanel>
            <EuiStat
              title={loading ? '-' : stats.total.toString()}
              description="Total Tasks"
              titleColor="primary"
              isLoading={loading}
            />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel>
            <EuiStat
              title={loading ? '-' : stats.completed.toString()}
              description="Completed Tasks"
              titleColor="success"
              isLoading={loading}
            />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel>
            <EuiStat
              title={loading ? '-' : stats.planned.toString()}
              description="Planned Tasks"
              titleColor="warning"
              isLoading={loading}
            />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel>
            <EuiStat
              title={loading ? '-' : `${stats.completedPercentage}%`}
              description="Completion Rate"
              titleColor="accent"
              isLoading={loading}
            />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="l" />
    </>
  );
};
