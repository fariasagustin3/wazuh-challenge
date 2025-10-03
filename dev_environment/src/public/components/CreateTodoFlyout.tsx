import React, { useState } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiTextArea,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { CreateTodoRequest } from '../types/todo.types';

interface CreateTodoFlyoutProps {
  onClose: () => void;
  onSubmit: (todo: CreateTodoRequest) => Promise<boolean>;
}

export const CreateTodoFlyout: React.FC<CreateTodoFlyoutProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const todo: CreateTodoRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
    };

    const success = await onSubmit(todo);

    if (success) {
      setTitle('');
      setDescription('');
      setErrors({});
      onClose();
    }

    setIsSubmitting(false);
  };

  return (
    <EuiFlyout onClose={onClose} aria-labelledby="createTodoFlyoutTitle">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id="createTodoFlyoutTitle">Create New Task</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          <p>
            Create a new task
          </p>
        </EuiText>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiForm component="form">
          <EuiFormRow
            label="Title"
            isInvalid={!!errors.title}
            error={errors.title}
            helpText="Briefly describe the task to be performed"
            fullWidth
          >
            <EuiFieldText
              placeholder="e.g. Title example"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              isInvalid={!!errors.title}
              autoFocus
              fullWidth
            />
          </EuiFormRow>

          <EuiFormRow
            label="Description (optional)"
            helpText="Add additional details about the task"
            fullWidth
          >
            <EuiTextArea
              placeholder="e.g. This description is optional, and this one can be longer than title"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              fullWidth
            />
          </EuiFormRow>

          <EuiSpacer size="m" />
        </EuiForm>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={onClose} disabled={isSubmitting}>
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={handleSubmit}
              fill
              isLoading={isSubmitting}
              disabled={isSubmitting}
              iconType="plus"
            >
              Create Task
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
