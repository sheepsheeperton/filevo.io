import { Card, CardContent } from '@/components/ui/card';

interface Activity {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  actor: string | null;
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case 'created':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case 'updated':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case 'deleted':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case 'uploaded':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const getActivityColor = (action: string) => {
  switch (action) {
    case 'created':
      return 'text-success';
    case 'updated':
      return 'text-info';
    case 'deleted':
      return 'text-danger';
    case 'uploaded':
      return 'text-brand';
    default:
      return 'text-fg-subtle';
  }
};

export function ActivityList({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return (
      <Card className="py-12">
        <CardContent>
          <div className="text-center text-fg-muted">
            <p>No activity yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 bg-elev rounded-lg"
            >
              <div className={`mt-0.5 ${getActivityColor(activity.action)}`}>
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium capitalize">{activity.action}</span>{' '}
                  <span className="text-fg-muted">{activity.entity}</span>
                  {activity.entity_id && (
                    <span className="text-fg-subtle font-mono text-xs ml-2">
                      {activity.entity_id.slice(0, 8)}...
                    </span>
                  )}
                </p>
                <p className="text-xs text-fg-subtle mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

