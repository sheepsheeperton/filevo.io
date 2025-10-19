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

interface RequestActionsProps {
  requestId: string;
  isArchived?: boolean;
  hasFiles?: boolean;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

export function RequestActions({ 
  requestId, 
  isArchived = false,
  hasFiles = false,
  onArchive,
  onRestore,
  onDelete
}: RequestActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/archive`, {
        method: 'POST',
      });
      
      if (response.ok) {
        onArchive?.();
        // Refresh the page to show updated state
        window.location.reload();
      } else {
        const error = await response.text();
        console.error('Failed to archive request:', error);
        alert('Failed to archive request. Please try again.');
      }
    } catch (error) {
      console.error('Error archiving request:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/restore`, {
        method: 'POST',
      });
      
      if (response.ok) {
        onRestore?.();
        // Refresh the page to show updated state
        window.location.reload();
      } else {
        const error = await response.text();
        console.error('Failed to restore request:', error);
        alert('Failed to restore request. Please try again.');
      }
    } catch (error) {
      console.error('Error restoring request:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this request? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/delete`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onDelete?.();
        // Refresh the page to show updated state
        window.location.reload();
      } else {
        const error = await response.text();
        console.error('Failed to delete request:', error);
        if (response.status === 409) {
          alert('Cannot delete request with uploaded files. Please archive instead.');
        } else {
          alert('Failed to delete request. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('An error occurred. Please try again.');
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
