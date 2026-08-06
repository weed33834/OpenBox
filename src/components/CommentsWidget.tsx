import { useEffect, useState, type FormEvent } from 'react';
import { useT } from '@/i18n/useI18n';
import { getComments, addComment, type CommentItem } from '@/lib/data';
import { useToastStore } from '@/store/useToastStore';
import { Icon } from './Icon';

/** 显示 MM-DD 与时刻 */
function fmtTime(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10);
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mi = `${d.getMinutes()}`.padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

/**
 * 资源评论区（社区式：薅到/踩坑在此分享，帮后来人避坑）。
 * 匿名可留言（昵称可选），云端共享 + localStorage 兜底。
 */
export function CommentsWidget({ resourceId }: { resourceId: string }) {
  const t = useT();
  const push = useToastStore((s) => s.push);
  const [list, setList] = useState<CommentItem[] | null>(null);
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let m = true;
    getComments(resourceId).then((c) => {
      if (m) setList(c);
    });
    return () => {
      m = false;
    };
  }, [resourceId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    const res = await addComment(resourceId, text, nickname);
    setSending(false);
    if (!res.ok) {
      push(res.message ?? 'error', 'error');
      return;
    }
    setContent('');
    // 刷新列表
    const fresh = await getComments(resourceId);
    setList(fresh);
    push(t('comments.added'), 'success');
  };

  return (
    <div className="mt-6">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-fg)]">
        <Icon name="MessageSquare" size={15} /> {t('comments.title')}
        {list && <span className="text-xs font-normal text-[var(--color-muted)]">({list.length})</span>}
      </h3>

      <form onSubmit={submit} className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            className="input max-w-full !py-1.5 !text-sm sm:max-w-[180px]"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('comments.nickname')}
            maxLength={20}
          />
        </div>
        <div className="flex items-end gap-2">
          <textarea
            className="input min-h-[64px] flex-1 resize-y !text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('comments.placeholder')}
            maxLength={500}
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !content.trim()}>
            {sending ? t('common.loading') : t('comments.submit')}
          </button>
        </div>
      </form>

      {list === null ? (
        <p className="mt-3 text-xs text-[var(--color-muted)]">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">{t('comments.empty')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((c) => (
            <li key={c.id} className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
                <span className="font-semibold text-[var(--color-fg)]">{c.nickname}</span>
                <span>·</span>
                <span>{fmtTime(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-fg)]">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
