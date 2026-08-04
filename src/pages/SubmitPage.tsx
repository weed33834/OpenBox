import { useT } from '@/i18n/useI18n';
import { SubmitForm } from '@/components/SubmitForm';

export function SubmitPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--color-fg)]">{t('submit.title')}</h1>
        <p className="mt-2 text-[var(--color-muted)]">{t('submit.subtitle')}</p>
      </div>
      <SubmitForm />
    </div>
  );
}
