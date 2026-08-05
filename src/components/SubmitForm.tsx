import { useState } from 'react';
import type { ResourceType } from '@/lib/types';
import { useT, useLocalize } from '@/i18n/useI18n';
import { subTypes } from '@/data/taxonomy';
import { submitResource } from '@/lib/data';
import { useToastStore } from '@/store/useToastStore';
import { ALL_TYPES, TYPE_META } from '@/lib/format';
import { Icon } from './Icon';

/** 提交冷却：60 秒内禁止重复投稿（防刷垃圾） */
const COOLDOWN_MS = 60_000;
function checkCooldown(): { ok: boolean; left: number } {
  try {
    const last = Number(localStorage.getItem('ob_submit_cd') ?? '0');
    const left = COOLDOWN_MS - (Date.now() - last);
    return left > 0 ? { ok: false, left: Math.ceil(left / 1000) } : { ok: true, left: 0 };
  } catch {
    return { ok: true, left: 0 };
  }
}
function markSubmitted() {
  try {
    localStorage.setItem('ob_submit_cd', String(Date.now()));
  } catch { /* ignore */ }
}

export function SubmitForm() {
  const t = useT();
  const localize = useLocalize();
  const push = useToastStore((s) => s.push);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [subType, setSubType] = useState(subTypes[0].slug);
  const [type, setType] = useState<ResourceType>('free');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameV = name.trim();
    const urlV = url.trim();
    const summaryV = summary.trim();
    if (!nameV || !urlV || !summaryV) {
      push(t('submit.required'), 'error');
      return;
    }
    // URL 格式白名单（http/https 且域名有效），拦截 javascript:/data: 等畸形输入
    if (!/^https?:\/\/[^\s]+\.[^\s]{2,}$/i.test(urlV)) {
      push(t('submit.invalidUrl'), 'error');
      return;
    }
    // 提交冷却：60 秒内只能投一条
    const cd = checkCooldown();
    if (!cd.ok) {
      push(`${t('submit.cooldown')}（${cd.left}s）`, 'error');
      return;
    }
    setSubmitting(true);
    const res = await submitResource({
      name: nameV,
      url: urlV,
      subType,
      type,
      summary: summaryV,
      description: description.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      markSubmitted();
      push(`${t('submit.success')}${res.message ? ' ' + res.message : ''}`, 'success');
      setName('');
      setUrl('');
      setSummary('');
      setDescription('');
    } else {
      push(res.message ?? t('submit.fail'), 'error');
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.name')} *</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. AnyRouter" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.url')} *</span>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={500} placeholder="https://" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.category')}</span>
          <select className="input" value={subType} onChange={(e) => setSubType(e.target.value)}>
            {subTypes.map((c) => (
              <option key={c.slug} value={c.slug}>
                {localize(c.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.type')}</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
            {ALL_TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {TYPE_META[tp].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.summary')} *</span>
        <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={200} placeholder="一句话介绍这个资源" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.description')}</span>
        <textarea
          className="input min-h-24 resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          placeholder={t('submit.description')}
        />
      </label>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
          {t('submit.submit')}
        </button>
        <p className="text-xs text-[var(--color-muted)]">{t('submit.note')}</p>
      </div>
    </form>
  );
}
