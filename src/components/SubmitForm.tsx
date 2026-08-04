import { useState } from 'react';
import type { ResourceType } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { subTypes } from '@/data/taxonomy';
import { submitResource } from '@/lib/data';
import { useToastStore } from '@/store/useToastStore';
import { ALL_TYPES, TYPE_META } from '@/lib/format';
import { Icon } from './Icon';

export function SubmitForm() {
  const t = useT();
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
    if (!name.trim() || !url.trim() || !summary.trim()) {
      push(t('submit.required'), 'error');
      return;
    }
    setSubmitting(true);
    const res = await submitResource({
      name: name.trim(),
      url: url.trim(),
      subType,
      type,
      summary: summary.trim(),
      description: description.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
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
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AnyRouter" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.url')} *</span>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.category')}</span>
          <select className="input" value={subType} onChange={(e) => setSubType(e.target.value)}>
            {subTypes.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name.zh}
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
        <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="一句话介绍这个资源" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--color-fg)]">{t('submit.description')}</span>
        <textarea
          className="input min-h-24 resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
