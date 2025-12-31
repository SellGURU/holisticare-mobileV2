import { createContext, useState } from "react";

export const AppContext = createContext({
    brandInfo: {
        last_update: '',
        logo: '',
        name: '',
        headline: '',
        primary_color: '',
        secondary_color: '',
        tone: '',
        focus_area: '',
    },
    wellnessScore: {
        scores: [] as any[],
        latest_date: null as string | null,
    }
});