import { useLocation, Navigate } from 'react-router';

interface LegacyRedirectProps {
  targetCanonical: string;
  defaultTab: string;
}

export function LegacyRedirect({ targetCanonical, defaultTab }: LegacyRedirectProps) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  if (!params.has('tab')) {
    params.set('tab', defaultTab);
  }

  const destination = `${targetCanonical}?${params.toString()}${location.hash}`;

  return <Navigate to={destination} replace />;
}
