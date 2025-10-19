"use client";

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryKey, inferCategoryFromRequest, getCategoryColor } from '@/lib/categories';

interface Activity {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  actor: string | null;
}

interface RequestItem {
  id: string;
  status: string;
  tag: string;
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  property_id: string | null;
  created_at: string;
  request_items: RequestItem[];
}

interface ActivityClientProps {
  activities: Activity[];
  requests: Request[];
}

interface ActivityWithCategory extends Activity {
  category?: CategoryKey;
  requestTitle?: string;
}

export function ActivityClient({ activities, requests }: ActivityClientProps) {
  // Enhance activities with category information
  const enhancedActivities = useMemo(() => {
    return activities.map(activity => {
      let category: CategoryKey = 'all';
      let requestTitle = '';

      // If activity is related to a request, try to find the request and infer category
      if (activity.entity === 'request' && activity.entity_id) {
        const request = requests.find(r => r.id === activity.entity_id);
        if (request) {
          category = inferCategoryFromRequest(request);
          requestTitle = request.title;
        }
      }

      return {
        ...activity,
        category,
        requestTitle
      } as ActivityWithCategory;
    });
  }, [activities, requests]);

  // Group activities by day
  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: ActivityWithCategory[] } = {};
    
    enhancedActivities.forEach(activity => {
      const date = new Date(activity.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    return groups;
  }, [enhancedActivities]);

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
        return 'text-green-500';
      case 'updated':
        return 'text-blue-500';
      case 'deleted':
        return 'text-red-500';
      case 'uploaded':
        return 'text-purple-500';
      default:
        return 'text-fg-subtle';
    }
  };

  const getCategoryBadgeColor = (category: CategoryKey) => {
    const color = getCategoryColor(category);
    switch (color) {
      case 'teal':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      case 'amber':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'violet':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (!enhancedActivities.length) {
    return (
      <div className="max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Activity Log</h1>
          <p className="text-fg-muted mt-2">Complete timeline of property changes, document uploads, and request updates</p>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <svg
                className="mx-auto h-12 w-12 text-fg-subtle"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-fg-muted">No activity yet</h3>
                <p className="text-sm text-fg-muted mt-2 max-w-md mx-auto">
                  Activity will appear here as you create properties, send requests, and receive documents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Activity Log</h1>
        <p className="text-fg-muted mt-2">Complete timeline of property changes, document uploads, and request updates</p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px bg-border flex-1"></div>
              <h2 className="text-lg font-semibold text-fg-muted px-3">{date}</h2>
              <div className="h-px bg-border flex-1"></div>
            </div>
            
            <div className="space-y-3">
              {dayActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-surface rounded-lg border border-border"
                >
                  <div className={`mt-0.5 ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm">
                        <span className="font-medium capitalize">{activity.action}</span>{' '}
                        <span className="text-fg-muted">{activity.entity}</span>
                        {activity.requestTitle && (
                          <span className="text-fg-muted ml-1">&ldquo;{activity.requestTitle}&rdquo;</span>
                        )}
                      </p>
                      {activity.category && activity.category !== 'all' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(activity.category)}`}>
                          {activity.category === 'onboarding' ? 'Onboarding' : 
                           activity.category === 'maintenance' ? 'Maintenance' : 
                           activity.category === 'audit' ? 'Audit' : activity.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-fg-subtle">
                      {new Date(activity.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
