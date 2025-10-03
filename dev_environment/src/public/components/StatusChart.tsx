import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiIcon,
  EuiHorizontalRule,
} from '@elastic/eui';
import { TodoStats } from '../types/todo.types';

interface StatusChartProps {
  stats: TodoStats;
}

export const StatusChart: React.FC<StatusChartProps> = ({ stats }) => {
  if (stats.total === 0) {
    return (
      <EuiPanel hasBorder paddingSize="l">
        <EuiTitle size="xs">
          <h3>Task Status Distribution</h3>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiFlexGroup
          direction="column"
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: '280px' }}
        >
          <EuiFlexItem grow={false}>
            <EuiIcon type="visualizeApp" size="xxl" color="subdued" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s" color="subdued" textAlign="center">
              <p>No tasks available to display</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel hasBorder paddingSize="l">
      <EuiTitle size="xs">
        <h3>Task Status Distribution</h3>
      </EuiTitle>
      <EuiSpacer size="m" />

      <EuiFlexGroup direction="column" alignItems="center" gutterSize="l">
        <EuiFlexItem style={{ width: '100%', maxWidth: '200px' }}>
          <div
            style={{
              position: 'relative',
              width: '200px',
              height: '200px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(
                  #00BFB3 0% ${stats.completedPercentage}%,
                  #FEC514 ${stats.completedPercentage}% 100%
                )`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.6s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#343741' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '13px', color: '#69707D' }}>Total Tasks</div>
            </div>
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule margin="m" />

      <EuiFlexGroup direction="column" gutterSize="m">
        <EuiFlexItem>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#00BFB3',
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <EuiText size="s">
                <strong>Completed</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" color="subdued">
                {stats.completed} tasks
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: '55px', textAlign: 'right' }}>
              <EuiText size="s">
                <strong>{stats.completedPercentage}%</strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#FEC514',
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <EuiText size="s">
                <strong>Planned</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" color="subdued">
                {stats.planned} tasks
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: '55px', textAlign: 'right' }}>
              <EuiText size="s">
                <strong>{stats.plannedPercentage}%</strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
