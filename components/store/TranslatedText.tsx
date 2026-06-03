"use client";

import { useTranslation } from "./LanguageProvider";

export default function TranslatedText({ tKey, className }: { tKey: string, className?: string }) {
  const { t } = useTranslation();
  return <span className={className}>{t(tKey)}</span>;
}
