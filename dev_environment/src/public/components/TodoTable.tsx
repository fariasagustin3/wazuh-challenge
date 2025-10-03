import React, { useState } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiBadge,
  EuiButton,
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { Todo, PaginationInfo } from '../types/todo.types';
import { getRelativeTime } from '../utils/dateUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface TodoTableProps {
  todos: Todo[];
  loading: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onUpdateStatus: (id: string, status: 'planned' | 'completed') => void;
  onDelete: (id: string) => void;
  onCreateClick: () => void;
}

export const TodoTable: React.FC<TodoTableProps> = ({
  todos,
  loading,
  pagination,
  onPageChange,
  onUpdateStatus,
  onDelete,
  onCreateClick,
}) => {
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);

  const handleDeleteClick = (todo: Todo) => {
    setTodoToDelete(todo);
  };

  const handleConfirmDelete = () => {
    if (todoToDelete) {
      onDelete(todoToDelete.id);
      setTodoToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setTodoToDelete(null);
  };

  const columns: Array<EuiBasicTableColumn<Todo>> = [
    {
      field: 'title',
      name: 'Title',
      width: '25%',
      render: (title: string) => (
        <EuiText size="s">
          <strong>{title}</strong>
        </EuiText>
      ),
    },
    {
      field: 'description',
      name: 'Description',
      width: '30%',
      render: (description?: string) => (
        <EuiText size="s" color="subdued">
          {description || '-'}
        </EuiText>
      ),
    },
    {
      field: 'status',
      name: 'Status',
      width: '15%',
      render: (status: 'planned' | 'completed') => (
        <EuiBadge color={status === 'completed' ? 'success' : 'warning'}>
          {status === 'completed' ? 'Completed' : 'Planned'}
        </EuiBadge>
      ),
    },
    {
      field: 'createdAt',
      name: 'Created At',
      width: '15%',
      render: (createdAt: string) => (
        <EuiText size="s" color="subdued">
          {getRelativeTime(createdAt)}
        </EuiText>
      ),
    },
    {
      name: 'Actions',
      width: '15%',
      render: (todo: Todo) => (
        <EuiFlexGroup gutterSize="s" responsive={false} wrap>
          <EuiFlexItem grow={false}>
            <EuiButton
              size="s"
              color={todo.status === 'planned' ? 'success' : 'text'}
              onClick={() =>
                onUpdateStatus(todo.id, todo.status === 'planned' ? 'completed' : 'planned')
              }
              iconType={todo.status === 'planned' ? 'check' : 'cross'}
            >
              {todo.status === 'planned' ? 'Complete' : 'Revert'}
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              color="danger"
              iconType="trash"
              onClick={() => handleDeleteClick(todo)}
              aria-label="Delete"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
  ];

  const paginationConfig = {
    pageIndex: pagination.page - 1,
    pageSize: pagination.limit,
    totalItemCount: pagination.total,
    pageSizeOptions: [10, 25, 50],
    showPerPageOptions: true,
  };

  const onTableChange = ({ page }: any) => {
    if (page) {
      onPageChange(page.index + 1); // Convert base 0 index to base 1 index
    }
  };

  if (!loading && todos.length === 0) {
    return (
      <>
        <EuiEmptyPrompt
          iconType="documentEdit"
          title={<h2>There is no TO-DOs!</h2>}
          body={<p>Let's start creating our first TO-DO</p>}
          actions={
            <EuiButton color="primary" fill onClick={onCreateClick} iconType="plus">
              Create TO-DO
            </EuiButton>
          }
        />

        {todoToDelete && (
          <ConfirmDeleteModal
            todoTitle={todoToDelete.title}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </>
    );
  }

  return (
    <>
      <EuiBasicTable
        items={todos}
        columns={columns}
        pagination={paginationConfig}
        loading={loading}
        onChange={onTableChange}
        rowHeader="title"
      />
      {todoToDelete && (
        <ConfirmDeleteModal
          todoTitle={todoToDelete.title}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};
