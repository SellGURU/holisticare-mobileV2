import Application from "@/api/app";
import { AppContext } from "@/store/app";
import { useEffect, useState } from "react";

function AppProvider({ children }: { children: React.ReactNode }) {
  const [brandInfo, setBrandInfo] = useState<{
    last_update: string;
    logo: string;
    name: string;
    headline: string;
    primary_color: string;
    secondary_color: string;
    tone: string;
    focus_area: string;
  }>();
  useEffect(() => {
    Application.getBrandInfo()
      .then((res: any) => {
        setBrandInfo(res.data.brand_elements);
      });
  }, []);
  return (
    <AppContext.Provider value={{
        brandInfo: brandInfo || {
            last_update: '',
            logo: '',
            name: '',
            headline: '',
            primary_color: '',
            secondary_color: '',
            tone: '',
            focus_area: '',
        }
    }}>
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
