'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Archive, Trash2, RotateCcw } from 'lucide-react';
import { archiveRequest, restoreRequest, deleteRequest } from '@/app/app/property/[id]/requests/actions';

interface RequestActionsMenuProps {
  requestId: string;
  isArchived?: boolean;
  hasFiles?: boolean;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

export function RequestActionsMenu({ 
  requestId, 
  isArchived = false,
  hasFiles = false,
  onArchive,
  onRestore,
  onDelete
}: RequestActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      const result = await archiveRequest(requestId);
      if (result.success) {
        onArchive?.();
      } else {
        console.error('Failed to archive request:', result.error);
      }
    } catch (error) {
      console.error('Error archiving request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const result = await restoreRequest(requestId);
      if (result.success) {
        onRestore?.();
      } else {
        console.error('Failed to restore request:', result.error);
      }
    } catch (error) {
      console.error('Error restoring request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteRequest(requestId);
      if (result.success) {
        onDelete?.();
      } else {
        console.error('Failed to delete request:', result.error);
        if (result.hasFiles) {
          // Show message that files exist
          alert('Cannot delete request with uploaded files. Please archive instead.');
        }
      }
    } catch (error) {
      console.error('Error deleting request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isArchived ? (
          <DropdownMenuItem onClick={handleRestore} disabled={isLoading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore Request
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={handleArchive} disabled={isLoading}>
              <Archive className="mr-2 h-4 w-4" />
              Archive Request
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete} 
              disabled={isLoading || hasFiles}
              className={hasFiles ? 'text-fg-muted' : 'text-danger'}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Permanently
              {hasFiles && (
                <span className="ml-2 text-xs">(Files exist)</span>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
