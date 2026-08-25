import { useParams, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useGuestOrganization } from "../hooks/useGuest";
import GuestShell from "../components/GuestShell";

export default function GuestConfirmation() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: organization } = useGuestOrganization(subdomain);

  return (
    <GuestShell organization={organization}>
      <div className="flex flex-col items-center text-center py-16 gap-3">
        <CheckCircle2 className="w-12 h-12 text-success" />
        <h1 className="text-lg font-semibold text-foreground">Thank you!</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your submission was received. Any payment amount will be confirmed by the organizers.
        </p>
        <Link to={`/g/${subdomain}`} className="text-sm text-primary font-medium mt-2">
          Back to events
        </Link>
      </div>
    </GuestShell>
  );
}
