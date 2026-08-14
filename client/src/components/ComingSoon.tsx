import Layout from '@/components/Layout';
import { Rocket } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ComingSoon() {
  const location = useLocation();
  const moduleName = location.pathname
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    )
    .join(' — ') || 'Module';

  return (
    <Layout title={moduleName} subtitle="Module coming soon">
      <div className="bg-background min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The <span className="font-medium text-foreground">{moduleName}</span> module is currently under development. Stay tuned for updates.
          </p>
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse" />
            In Development
          </div>
        </div>
      </div>
    </Layout>
  );
}
