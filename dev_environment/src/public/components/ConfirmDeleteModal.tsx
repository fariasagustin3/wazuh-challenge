import React from 'react';
import {
  EuiConfirmModal,
  EuiText,
} from '@elastic/eui';

interface ConfirmDeleteModalProps {
  todoTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  todoTitle,
  onConfirm,
  onCancel,
}) => {
    return (
    <EuiConfirmModal
      title="Delete TO-DO"
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelButtonText="Cancel"
      confirmButtonText="Delete"
      buttonColor="danger"
      defaultFocusedButton="cancel"
    >
      <EuiText>
        <p>
          Are you sure you want to delete this TO-DO: <strong>"{todoTitle}"</strong>?
        </p>
        <p>You will never see this TO-DO again</p>
      </EuiText>
    </EuiConfirmModal>
  );
}