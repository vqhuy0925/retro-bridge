import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { WarmupTab } from './components/WarmupTab';
import { BoardTab } from './components/BoardTab';
import { GroupVoteTab } from './components/GroupVoteTab';
import { WrapTab } from './components/WrapTab';
import { ToastHost } from './components/ToastHost';
import { NewRetroModal } from './components/NewRetroModal';
import { useRoom } from './hooks/useRoom';
import { useIdentity } from './hooks/useIdentity';
import { useStoreDoc } from './hooks/useStoreDoc';
import { useStoreCollection } from './hooks/useStoreCollection';
import { showToast } from './hooks/useToast';
import { ensureAnonymousUser } from './services/firebase/authService';
import { createRetroStore } from './services/store';
import { DEFAULT_COLUMNS } from './data/defaults';
import type { ActionItem, BoardPhoto, Group, Note, RetroConfig, TabId, Vote, WarmupState } from './types';

export default function App() {
  const { roomId, startRoom } = useRoom();
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [tab, setTab] = useState<TabId>('warmup');
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [showNewRetroModal, setShowNewRetroModal] = useState(false);

  useEffect(() => {
    ensureAnonymousUser().then((u) => {
      setUser(u);
      setAuthResolved(true);
    });
  }, []);

  const store = useMemo(
    () => (authResolved && roomId ? createRetroStore(roomId, user) : null),
    [roomId, user, authResolved],
  );

  function handleCreateRetro(topic: string) {
    setPendingTitle(topic);
    startRoom();
    setShowNewRetroModal(false);
  }

  function handleJoinRoom(code: string) {
    startRoom(code);
    setShowNewRetroModal(false);
  }

  useEffect(() => {
    if (!store || !pendingTitle) return;
    const title = pendingTitle;
    setPendingTitle(null);
    store
      .doc<RetroConfig>('config')
      .set({ title, columns: DEFAULT_COLUMNS })
      .then(() => navigator.clipboard?.writeText(window.location.href).catch(() => {}))
      .then(() => showToast(`"${title}" is ready — invite link copied, share it with your PO and team.`));
  }, [store, pendingTitle]);

  const { role, setRole, displayName, voterId } = useIdentity(user);

  const defaultConfig: RetroConfig = useMemo(
    () => ({ title: 'Retro Bridge', columns: DEFAULT_COLUMNS }),
    [],
  );
  const config = useStoreDoc<RetroConfig>(store, 'config', defaultConfig);
  const warmup = useStoreDoc<WarmupState | { gameId: '' }>(store, 'warmup', { gameId: '' });
  const notes = useStoreCollection<Note>(store, 'notes');
  const photos = useStoreCollection<BoardPhoto>(store, 'photos');
  const groups = useStoreCollection<Group>(store, 'groups');
  const votes = useStoreCollection<Vote>(store, 'votes');
  const actions = useStoreCollection<ActionItem>(store, 'actions');

  if (!roomId) {
    return (
      <>
        <NewRetroModal onCreate={handleCreateRetro} onJoin={handleJoinRoom} />
        <ToastHost />
      </>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft">Loading Retro Bridge…</div>
    );
  }

  const configDoc = store.doc<RetroConfig>('config');
  const warmupDoc = store.doc<WarmupState>('warmup');
  const notesCol = store.collection<Note>('notes');
  const photosCol = store.collection<BoardPhoto>('photos');
  const groupsCol = store.collection<Group>('groups');
  const votesCol = store.collection<Vote>('votes');
  const actionsCol = store.collection<ActionItem>('actions');

  const safeConfig = config.columns?.length ? config : defaultConfig;

  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-12 pt-0">
      <Header
        role={role}
        onRoleChange={setRole}
        storeMode={store.mode}
        topic={safeConfig.title}
        onNewRetro={() => setShowNewRetroModal(true)}
      />

      {showNewRetroModal && (
        <NewRetroModal
          onCreate={handleCreateRetro}
          onJoin={handleJoinRoom}
          onCancel={() => setShowNewRetroModal(false)}
        />
      )}

      <Tabs active={tab} onChange={setTab} />

      {tab === 'warmup' && (
        <WarmupTab warmup={warmup.gameId ? (warmup as WarmupState) : null} warmupDoc={warmupDoc} />
      )}
      {tab === 'board' && (
        <BoardTab
          config={safeConfig}
          configDoc={configDoc}
          notes={notes}
          notesCol={notesCol}
          photos={photos}
          photosCol={photosCol}
          role={role}
          author={displayName}
        />
      )}
      {tab === 'group' && (
        <GroupVoteTab
          columns={safeConfig.columns}
          notes={notes}
          notesCol={notesCol}
          groups={groups}
          groupsCol={groupsCol}
          votes={votes}
          votesCol={votesCol}
          voterId={voterId}
          voterName={displayName}
          role={role}
        />
      )}
      {tab === 'wrap' && (
        <WrapTab
          columns={safeConfig.columns}
          notes={notes}
          groups={groups}
          votes={votes}
          actions={actions}
          actionsCol={actionsCol}
          warmup={warmup.gameId ? (warmup as WarmupState) : null}
        />
      )}

      <ToastHost />
    </div>
  );
}
