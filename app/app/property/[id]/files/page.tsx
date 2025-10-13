import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilesList } from '@/components/files/FilesList';

export default async function PropertyFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const db = await supabaseServer();

  const { data: files } = await db
    .from('files')
    .select(`
      id,
      file_name,
      storage_path,
      uploaded_at,
      request_item:request_items!inner(
        id,
        tag,
        status,
        request:requests!inner(
          id,
          title,
          property_id
        )
      )
    `)
    .eq('request_item.request.property_id', id)
    .order('uploaded_at', { ascending: false });

  const totalFiles = files?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Files</h2>
          <p className="text-sm text-fg-muted mt-1">
            {totalFiles} {totalFiles === 1 ? 'file' : 'files'} uploaded
          </p>
        </div>
        <div className="flex gap-2">
          <form action="/api/export" method="GET">
            <input type="hidden" name="propertyId" value={id} />
            <Button type="submit" variant="secondary">
              Export All as ZIP
            </Button>
          </form>
        </div>
      </div>

      {files && files.length > 0 ? (
        <FilesList files={files} propertyId={id} />
      ) : (
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">No files yet</h3>
                <p className="text-sm text-fg-muted mt-1">
                  Files will appear here once they are uploaded via request links
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

