import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PATIENT_PRIVACY_URL,
  PATIENT_TERMS_URL,
} from "@/lib/legalUrls";
import { openExternalUrl } from "@/lib/open-external-url";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

type LegalKind = "privacy" | "terms";

export function LegalPrivacy() {
  return <LegalPage kind="privacy" />;
}

export function LegalTerms() {
  return <LegalPage kind="terms" />;
}

function LegalPage({ kind }: { kind: LegalKind }) {
  const [, setLocation] = useLocation();
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const officialUrl = isPrivacy ? PATIENT_PRIVACY_URL : PATIENT_TERMS_URL;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4 px-0 text-gray-600"
        onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-4 pt-6">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm leading-6 text-gray-600">
            HolistiCare uses your account details and health records to show lab
            results, plans, and wearable insights in the app.
          </p>
          <p className="text-sm leading-6 text-gray-600">
            You can delete your account from Profile. That request erases stored
            health files, lab data, and wearable links for your account.
          </p>
          <p className="text-sm leading-6 text-gray-600">
            Questions: support@holisticare.com
          </p>
          <button
            className="text-sm text-emerald-700 underline"
            onClick={() => {
              void openExternalUrl(officialUrl);
            }}
          >
            Open the published {title.toLowerCase()}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

export default LegalPrivacy;
