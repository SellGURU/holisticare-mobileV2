import Application from "@/api/app";
import {
  applyBrandCssVars,
  brandInfoChanged,
  readCachedBrandInfo,
  writeCachedBrandInfo,
} from "@/lib/brandCache";
import {
  AppContext,
  DEFAULT_CHAT_MODE,
  type ChatMode,
} from "@/store/app";
import { useEffect, useState } from "react";

const EMPTY_BRAND = {
  last_update: "",
  logo: "",
  name: "",
  headline: "",
  primary_color: "",
  secondary_color: "",
  tone: "",
  focus_area: "",
};

function AppProvider({ children }: { children: React.ReactNode }) {
  const [brandInfo, setBrandInfo] = useState(() => {
    const cached = readCachedBrandInfo();
    if (cached) applyBrandCssVars(cached);
    return cached;
  });
  const [wellnessScore, setWellnessScore] = useState({
    scores: [] as Array<{ name?: string; score?: number | string | null }>,
    latest_date: null as string | null,
  });
  const [chatMode, setChatMode] = useState<ChatMode>(DEFAULT_CHAT_MODE);

  useEffect(() => {
    Application.getBrandInfo()
      .then((res: any) => {
        const next = res.data?.brand_elements;
        if (!next) return;
        setBrandInfo((prev) => {
          if (!brandInfoChanged(prev, next)) {
            return prev ?? next;
          }
          writeCachedBrandInfo(next);
          applyBrandCssVars(next);
          return next;
        });
      })
      .catch(() => {});

    Application.getWellnessScores()
      .then((res: any) => {
        const scores = Array.isArray(res?.data?.scores) ? res.data.scores : [];
        setWellnessScore({
          scores,
          latest_date: res?.data?.latest_date ?? null,
        });
      })
      .catch(() => {
        setWellnessScore({ scores: [], latest_date: null });
      });
  }, []);

  return (
    <AppContext.Provider
      value={{
        brandInfo: brandInfo || EMPTY_BRAND,
        wellnessScore: wellnessScore,
        chatMode,
        setChatMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
