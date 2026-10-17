"use client";

import { useEffect, useState } from "react";
import { XeniosStore } from "@/lib/store";
import { FirestoreService } from "@/lib/firestore-service";
import { DEFAULT_CATEGORY_CONFIGS, type CategoryConfig } from "@/lib/marketplace/categories";

/**
 * Panelden düzenlenen kategori listesini (ad, ikon, sıra, gizli/açık) okur ve
 * değişikliklerde (yerel kayıt veya Firestore senkronu) otomatik güncellenir.
 *
 * İlk render sunucu çıktısıyla aynı olsun diye varsayılan listeyle başlar,
 * ardından istemcide gerçek yapılandırmaya geçer (hydration uyuşmazlığı olmaz).
 * Hook kendi Firestore aboneliğini de açar; ayrıca bir senkron çağrısı gerekmez.
 */
export function useCategoryConfigs(): CategoryConfig[] {
  const [configs, setConfigs] = useState<CategoryConfig[]>(DEFAULT_CATEGORY_CONFIGS);

  useEffect(() => {
    const refresh = () => setConfigs(XeniosStore.getCategoryConfigs());
    refresh();
    window.addEventListener("xenios_categories_updated", refresh);
    window.addEventListener("storage", refresh);
    const unsub = FirestoreService.subscribeToCategoryConfigs();
    return () => {
      window.removeEventListener("xenios_categories_updated", refresh);
      window.removeEventListener("storage", refresh);
      unsub();
    };
  }, []);

  return configs;
}
