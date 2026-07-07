import { useEffect, useMemo, useState } from "react";
import { fetchActiveMedications } from "@/lib/medication-service";
import type { Database } from "@/integrations/supabase/types";

type Medication = Database["public"]["Tables"]["medications"]["Row"];

export function useMedications() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveMedications()
      .then(setMeds)
      .catch(() => setMeds([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(meds.map((m) => m.category))).sort()],
    [meds],
  );

  function filter(query: string, category: string) {
    const q = query.trim().toLowerCase();
    const cat = category === "All" ? null : category;
    return meds.filter((m) => {
      const matchesQuery =
        !q || m.name.toLowerCase().includes(q) || (m.description ?? "").toLowerCase().includes(q);
      const matchesCat = !cat || m.category === cat;
      return matchesQuery && matchesCat;
    });
  }

  return { meds, loading, categories, filter };
}
