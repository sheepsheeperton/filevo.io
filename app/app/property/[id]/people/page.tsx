import { Card, CardContent } from '@/components/ui/card';

export default async function PropertyPeoplePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">People</h2>
          <p className="text-sm text-fg-muted mt-1">Manage team access to this property</p>
        </div>
      </div>

      <Card className="py-12">
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-fg-muted">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium">Team Access (Coming Soon)</h3>
              <p className="text-sm text-fg-muted mt-1">
                Invite team members to collaborate on this property
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

