import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { UserAdminNote, UserTag, userProfileApi } from '../api/users';

const DEMO_USER_ID = 'demo-user-001';
const tagColors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];

const fallbackTags: UserTag[] = [
  { id: 'verified-landlord', name: '已实名房东', color: '#2563eb' },
  { id: 'high-value', name: '高价值用户', color: '#059669' },
];

const fallbackNotes: UserAdminNote[] = [
  {
    id: 'note-demo-1',
    userId: DEMO_USER_ID,
    adminId: 'admin-demo',
    content: '仅后台可见：用户反馈希望优先推荐近地铁、可养宠房源。',
    createdAt: '2026-06-18T09:24:00.000Z',
  },
];

function normaliseTagName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function makeTag(name: string, index: number): UserTag {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-'),
    name,
    color: tagColors[index % tagColors.length],
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '操作失败，请稍后重试。';
}

export function UserDetail() {
  const [userId, setUserId] = useState(DEMO_USER_ID);
  const [tags, setTags] = useState<UserTag[]>(fallbackTags);
  const [notes, setNotes] = useState<UserAdminNote[]>(fallbackNotes);
  const [tagInput, setTagInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const sortedNotes = useMemo(
    () => [...notes].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [notes],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      setIsLoading(true);
      setErrorMessage('');
      setStatusMessage('');

      try {
        const [tagResponse, noteResponse] = await Promise.all([
          userProfileApi.getTags(userId),
          userProfileApi.getNotes(userId),
        ]);

        if (!isMounted) {
          return;
        }

        setTags(tagResponse.tags);
        setNotes(noteResponse.notes);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(`后端接口暂不可用，已展示本地示例数据。${getErrorMessage(error)}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const persistTags = async (nextTags: UserTag[]) => {
    setIsSavingTags(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const response = await userProfileApi.updateTags(userId, nextTags);
      setTags(response.tags);
      setStatusMessage('用户标签已保存。');
    } catch (error) {
      setTags(nextTags);
      setErrorMessage(`标签已在当前页面更新，但后端保存失败：${getErrorMessage(error)}`);
    } finally {
      setIsSavingTags(false);
    }
  };

  const handleAddTag = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = normaliseTagName(tagInput);

    if (!name || tags.some((tag) => tag.name === name)) {
      return;
    }

    setTagInput('');
    await persistTags([...tags, makeTag(name, tags.length)]);
  };

  const handleRemoveTag = async (tagId: string) => {
    await persistTags(tags.filter((tag) => tag.id !== tagId));
  };

  const handleCreateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = noteInput.trim();

    if (!content) {
      return;
    }

    setIsSavingNote(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const note = await userProfileApi.createNote(userId, content);
      setNotes((currentNotes) => [note, ...currentNotes]);
      setNoteInput('');
      setStatusMessage('内部备注已添加，仅后台可见。');
    } catch (error) {
      const offlineNote: UserAdminNote = {
        id: `local-${Date.now()}`,
        userId,
        adminId: 'current-admin',
        content,
        createdAt: new Date().toISOString(),
      };
      setNotes((currentNotes) => [offlineNote, ...currentNotes]);
      setNoteInput('');
      setErrorMessage(`备注已在当前页面添加，但后端保存失败：${getErrorMessage(error)}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="user-detail-page">
      <p className="eyebrow">用户详情</p>
      <div className="user-detail-header">
        <div>
          <h1>用户标签与管理员备注</h1>
          <p>标签用于后台运营分群；内部备注仅管理员可见，不会向 App 用户透出。</p>
        </div>
        <label className="user-id-field">
          用户 ID
          <input value={userId} onChange={(event) => setUserId(event.target.value.trim() || DEMO_USER_ID)} />
        </label>
      </div>

      {isLoading && <p className="info-text">正在从后端读取标签与备注……</p>}
      {statusMessage && <p className="success-text">{statusMessage}</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <div className="user-detail-grid">
        <section className="management-card">
          <div className="section-title">
            <h2>用户标签</h2>
            <span>GET /admin/users/:userId/tags · PUT /admin/users/:userId/tags</span>
          </div>
          <div className="tag-list" aria-label="用户标签列表">
            {tags.map((tag) => (
              <span className="tag-pill" key={tag.id} style={{ '--tag-color': tag.color ?? '#2563eb' } as React.CSSProperties}>
                {tag.name}
                <button type="button" onClick={() => handleRemoveTag(tag.id)} disabled={isSavingTags} aria-label={`删除${tag.name}标签`}>
                  ×
                </button>
              </span>
            ))}
            {tags.length === 0 && <span className="empty-state">暂无标签</span>}
          </div>
          <form className="inline-form" onSubmit={handleAddTag}>
            <input
              placeholder="输入新标签，例如：投诉敏感、优质房东"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
            />
            <button type="submit" disabled={isSavingTags || !normaliseTagName(tagInput)}>添加标签</button>
          </form>
        </section>

        <section className="management-card">
          <div className="section-title">
            <h2>管理员内部备注</h2>
            <span>GET /admin/users/:userId/notes · POST /admin/users/:userId/notes</span>
          </div>
          <form className="note-form" onSubmit={handleCreateNote}>
            <textarea
              placeholder="添加仅后台可见的内部备注，需由后端记录管理员 ID 与创建时间。"
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
              rows={4}
            />
            <button type="submit" disabled={isSavingNote || !noteInput.trim()}>添加备注</button>
          </form>
          <div className="note-list">
            {sortedNotes.map((note) => (
              <article className="note-item" key={note.id}>
                <p>{note.content}</p>
                <footer>
                  <span>管理员：{note.adminId}</span>
                  <time dateTime={note.createdAt}>{formatDate(note.createdAt)}</time>
                </footer>
              </article>
            ))}
            {sortedNotes.length === 0 && <p className="empty-state">暂无内部备注</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
