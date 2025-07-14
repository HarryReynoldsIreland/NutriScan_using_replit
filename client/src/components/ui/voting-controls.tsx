import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VotingControlsProps {
  upvotes: number;
  downvotes: number;
  onVote: (voteType: 'upvote' | 'downvote') => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function VotingControls({ 
  upvotes, 
  downvotes, 
  onVote, 
  size = 'md',
  disabled = false 
}: VotingControlsProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'sm' : 'default';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={() => onVote('upvote')}
        disabled={disabled}
        className="text-gray-600 hover:text-primary p-1"
      >
        <ArrowUp className={iconSize} />
      </Button>
      <span className={`${textSize} font-medium text-neutral min-w-[2rem] text-center`}>
        {upvotes - downvotes}
      </span>
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={() => onVote('downvote')}
        disabled={disabled}
        className="text-gray-600 hover:text-accent p-1"
      >
        <ArrowDown className={iconSize} />
      </Button>
    </div>
  );
}
