import React, { useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { PLUGIN_ID } from '../../common';
import { useTodos } from '../hooks/useTodos';
import { TodoTable } from './TodoTable';
import { CreateTodoFlyout } from './CreateTodoFlyout';
import { SearchAndFilters } from './SearchAndFilters';
import { StatsPanel } from './StatsPanel';
import { StatusChart } from './StatusChart';

interface CustomPluginAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

export const CustomPluginApp = ({
  basename,
  notifications,
  http,
  navigation,
}: CustomPluginAppDeps) => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);

  const {
    todos,
    loading,
    pagination,
    filters,
    stats,
    updateStatus,
    deleteTodo,
    updateFilters,
    createTodo,
  } = useTodos({ http, notifications });

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleSearchChange = (search: string) => {
    updateFilters({ search: search || undefined, page: 1 });
  };

  const handleStatusFilterChange = (status?: 'planned' | 'completed') => {
    updateFilters({ status, page: 1 });
  };

  const handleCreateClick = () => {
    setIsFlyoutVisible(true);
  };

  const handleCloseFlyout = () => {
    setIsFlyoutVisible(false);
  };

  const handleCreateTodo = async (todo: any) => {
    const success = await createTodo(todo);
    return success;
  };

  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu
            appName={PLUGIN_ID}
            showSearchBar={false}
            useDefaultBehaviors={true}
          />
          <EuiPage restrictWidth="1400px">
            <EuiPageBody>
              <EuiPageHeader>
                <EuiPageHeaderSection>
                  <EuiTitle size="l">
                    <h1>Tasks Management App</h1>
                  </EuiTitle>
                </EuiPageHeaderSection>
              </EuiPageHeader>

              <EuiPageContent>
                <EuiPageContentHeader>
                  <EuiPageContentHeaderSection>
                    <EuiTitle size="m">
                      <h2>Task List</h2>
                    </EuiTitle>
                    <EuiSpacer size="xs" />
                    <EuiText size="s" color="subdued">
                      <p>Manage your tasks easily with this platform</p>
                    </EuiText>
                  </EuiPageContentHeaderSection>
                  <EuiPageContentHeaderSection>
                    <EuiFlexGroup alignItems="center" gutterSize="s">
                      <EuiFlexItem grow={false}>
                        <EuiButton fill iconType="plus" onClick={handleCreateClick}>
                          New Task
                        </EuiButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPageContentHeaderSection>
                </EuiPageContentHeader>

                <EuiPageContentBody>
                  <EuiSpacer size="l" />

                  <StatsPanel stats={stats} loading={loading} />

                  <EuiFlexGroup gutterSize="l" responsive={false}>
                    <EuiFlexItem grow={1} style={{ minWidth: '300px', maxWidth: '450px' }}>
                      <StatusChart stats={stats} />
                    </EuiFlexItem>
                    <EuiFlexItem grow={2}>
                      <SearchAndFilters
                        onSearchChange={handleSearchChange}
                        onStatusFilterChange={handleStatusFilterChange}
                        currentStatus={filters.status}
                        totalResults={pagination.total}
                      />

                      <TodoTable
                        todos={todos}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onUpdateStatus={updateStatus}
                        onDelete={deleteTodo}
                        onCreateClick={handleCreateClick}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>

          {isFlyoutVisible && (
            <CreateTodoFlyout onClose={handleCloseFlyout} onSubmit={handleCreateTodo} />
          )}
        </>
      </I18nProvider>
    </Router>
  );
};
