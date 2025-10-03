import React, { useState, useEffect } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldSearch,
  EuiFilterGroup,
  EuiFilterButton,
  EuiSpacer,
} from '@elastic/eui';

interface SearchAndFiltersProps {
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status?: 'planned' | 'completed') => void;
  currentStatus?: 'planned' | 'completed';
  totalResults?: number;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  onSearchChange,
  onStatusFilterChange,
  currentStatus,
  totalResults,
}) => {
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(searchValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleStatusClick = (status?: 'planned' | 'completed') => {
    if (currentStatus === status) {
      onStatusFilterChange(undefined);
    } else {
      onStatusFilterChange(status);
    }
  };

  return (
    <>
      <EuiFlexGroup gutterSize="m" alignItems="center">
        <EuiFlexItem grow={true}>
          <EuiFieldSearch
            placeholder="Search tasks by title or description..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={(value) => setSearchValue(value)}
            fullWidth
            aria-label="Search tasks"
          />
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiFilterGroup>
            <EuiFilterButton
              hasActiveFilters={currentStatus === undefined}
              onClick={() => handleStatusClick(undefined)}
            >
              All Tasks
              {currentStatus === undefined && totalResults !== undefined && ` (${totalResults})`}
            </EuiFilterButton>
            <EuiFilterButton
              hasActiveFilters={currentStatus === 'planned'}
              onClick={() => handleStatusClick('planned')}
              color={currentStatus === 'planned' ? 'primary' : 'text'}
            >
              Planned
            </EuiFilterButton>
            <EuiFilterButton
              hasActiveFilters={currentStatus === 'completed'}
              onClick={() => handleStatusClick('completed')}
              color={currentStatus === 'completed' ? 'primary' : 'text'}
            >
              Completed
            </EuiFilterButton>
          </EuiFilterGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
    </>
  );
};
