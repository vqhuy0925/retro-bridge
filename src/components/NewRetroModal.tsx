import { useState } from 'react';
import { Modal } from './Modal';
import { showToast } from '../hooks/useToast';

interface NewRetroModalProps {
  onCreate: (topic: string) => void;
  onCancel?: () => void;
}

export function NewRetroModal({ onCreate, onCancel }: NewRetroModalProps) {
  const [topic, setTopic] = useState('');

  function submit() {
    if (!topic.trim()) {
      showToast('Give this retro a topic first.');
      return;
    }
    onCreate(topic.trim());
  }

  const actions = onCancel
    ? [
        { label: 'Cancel', onClick: onCancel },
        { label: 'Create retro', primary: true, onClick: submit },
      ]
    : [{ label: 'Create retro', primary: true, onClick: submit }];

  return (
    <Modal
      title="Start a new retro"
      subtitle="Name this retro's topic, then share the room link it creates with your PO and team."
      actions={actions}
      onDismiss={onCancel ?? (() => {})}
    >
      <input
        autoFocus
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="e.g. Sprint 26.09.B Retro"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
      />
    </Modal>
  );
}
