import { useState } from "react";
import { ArrowUp, ArrowDown, MessageCircle, Share, UserCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { type Discussion, type Comment } from "@shared/schema";

interface DiscussionThreadProps {
  discussion: Discussion;
  comments: Comment[];
  currentUserId?: number;
  onVote: (discussionId: number, voteType: 'upvote' | 'downvote') => void;
  onComment: (discussionId: number, content: string, parentId?: number) => void;
  onVoteComment: (commentId: number, voteType: 'upvote' | 'downvote') => void;
  onFlag: (discussionId?: number, commentId?: number, reason: string) => void;
}

export function DiscussionThread({ 
  discussion, 
  comments, 
  currentUserId,
  onVote,
  onComment,
  onVoteComment,
  onFlag 
}: DiscussionThreadProps) {
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showComments, setShowComments] = useState(true);

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    if (currentUserId) {
      onVote(discussion.id, voteType);
    }
  };

  const handleCommentVote = (commentId: number, voteType: 'upvote' | 'downvote') => {
    if (currentUserId) {
      onVoteComment(commentId, voteType);
    }
  };

  const handleReply = (parentId?: number) => {
    if (replyContent.trim() && currentUserId) {
      onComment(discussion.id, replyContent, parentId);
      setReplyContent("");
      setReplyTo(null);
    }
  };

  const handleFlag = (reason: string, commentId?: number) => {
    if (currentUserId) {
      onFlag(commentId ? undefined : discussion.id, commentId, reason);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <Card className="mb-4 shadow-sm">
      {/* Discussion Header */}
      <CardContent className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-2">
          <UserCircle className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-neutral">User{discussion.userId}</span>
          <span className="text-xs text-gray-500">
            {formatTimeAgo(discussion.createdAt)}
          </span>
        </div>
        <h4 className="font-medium text-neutral mb-2">{discussion.title}</h4>
        <p className="text-sm text-gray-700">{discussion.content}</p>
      </CardContent>

      {/* Discussion Actions */}
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('upvote')}
              className="text-gray-600 hover:text-primary p-1"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-neutral">{discussion.upvotes || 0}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('downvote')}
              className="text-gray-600 hover:text-accent p-1"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="text-gray-600 hover:text-primary text-sm"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {discussion.commentCount || 0}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFlag("inappropriate")}
            className="text-gray-600 hover:text-red-500 p-1"
          >
            <Flag className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-primary p-1"
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-200">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 border-b border-gray-100 last:border-b-0">
              <div className="flex space-x-3">
                <UserCircle className="h-5 w-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-neutral">User{comment.userId}</span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentVote(comment.id, 'upvote')}
                        className="text-gray-500 hover:text-primary p-1 text-xs"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-gray-600">{comment.upvotes || 0}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentVote(comment.id, 'downvote')}
                        className="text-gray-500 hover:text-accent p-1 text-xs"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(comment.id)}
                      className="text-gray-500 hover:text-primary text-xs"
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Reply Form */}
          <div className="p-4 border-t border-gray-100">
            <Textarea
              placeholder="Write a comment..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="mb-3"
              rows={3}
            />
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyContent("");
                  setReplyTo(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReply(replyTo || undefined)}
                disabled={!replyContent.trim()}
                size="sm"
              >
                Reply
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
