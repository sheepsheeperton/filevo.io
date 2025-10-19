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
      } else {
        const error = await response.text();
        console.error('Failed to archive request:', error);
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
      const response = await fetch(`/api/requests/${requestId}/restore`, {
        method: 'POST',
      });
      
      if (response.ok) {
        onRestore?.();
      } else {
        const error = await response.text();
        console.error('Failed to restore request:', error);
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
      const response = await fetch(`/api/requests/${requestId}/delete`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onDelete?.();
      } else {
        const error = await response.text();
        console.error('Failed to delete request:', error);
        if (response.status === 409) {
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
        <DropdownMenuItem disabled>
          <Archive className="mr-2 h-4 w-4" />
          Archive Request (Coming Soon)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Permanently (Coming Soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
