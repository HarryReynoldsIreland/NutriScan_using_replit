import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, UserCircle, LogOut, Settings, Activity, Award, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/ui/mobile-header";
import { auth, signInAnonymouslyWithUsername, onAuthStateChange } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { type UserActivity } from "@shared/schema";

interface ProfileProps {
  currentUser?: any;
  onUserChange: (user: any) => void;
}

export default function Profile({ currentUser, onUserChange }: ProfileProps) {
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { data: userActivity = [], isLoading } = useQuery({
    queryKey: ['/api/users', currentUser?.id, 'activity'],
    queryFn: async () => {
      if (!currentUser) return [];
      const response = await fetch(`/api/users/${currentUser.id}/activity`);
      if (!response.ok) throw new Error('Failed to fetch user activity');
      return response.json() as Promise<UserActivity[]>;
    },
    enabled: !!currentUser,
  });

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { user } = await signInAnonymouslyWithUsername();
      onUserChange(user);
      toast({
        title: "Success",
        description: `Welcome, ${user.username}!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      onUserChange(null);
      toast({
        title: "Success",
        description: "You have been signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getReputationLevel = (reputation: number) => {
    if (reputation >= 1000) return { level: 'Expert', color: 'bg-purple-100 text-purple-800' };
    if (reputation >= 500) return { level: 'Advanced', color: 'bg-blue-100 text-blue-800' };
    if (reputation >= 100) return { level: 'Intermediate', color: 'bg-green-100 text-green-800' };
    return { level: 'Beginner', color: 'bg-gray-100 text-gray-800' };
  };

  const formatActivityAction = (action: string) => {
    switch (action) {
      case 'post_created': return 'Created a post';
      case 'comment_created': return 'Added a comment';
      case 'vote_cast': return 'Voted on content';
      default: return action;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Profile" />
        
        <main className="pb-20">
          <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <UserCircle className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to NutriScan</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Sign in to track your scans, participate in discussions, and bookmark your favorite ingredients
                  </p>
                  <Button 
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="w-full bg-primary hover:bg-green-600"
                  >
                    {isSigningIn ? "Signing in..." : "Sign In Anonymously"}
                  </Button>
                  <p className="text-xs text-gray-500 mt-4">
                    Anonymous sign-in creates a temporary account with a random username
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const reputationInfo = getReputationLevel(currentUser.reputation || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Profile" />
      
      <main className="pb-20">
        {/* Profile Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-neutral">{currentUser.username}</h2>
              <p className="text-sm text-gray-600">
                {currentUser.isAnonymous ? 'Anonymous User' : 'Registered User'}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={`text-xs ${reputationInfo.color}`}>
                  {reputationInfo.level}
                </Badge>
                <span className="text-sm text-gray-600">
                  {currentUser.reputation || 0} reputation
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-neutral">Reputation</h3>
                <p className="text-2xl font-bold text-primary">{currentUser.reputation || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 text-secondary mx-auto mb-2" />
                <h3 className="font-semibold text-neutral">Activity</h3>
                <p className="text-2xl font-bold text-secondary">{userActivity.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Achievement Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-neutral mb-3 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Achievements
              </h3>
              <div className="space-y-2">
                {currentUser.reputation >= 100 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">Community Contributor</span>
                  </div>
                )}
                {userActivity.filter(a => a.action === 'post_created').length >= 5 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">Discussion Starter</span>
                  </div>
                )}
                {userActivity.filter(a => a.action === 'comment_created').length >= 10 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700">Active Commenter</span>
                  </div>
                )}
                {userActivity.length === 0 && (
                  <p className="text-sm text-gray-500">No achievements yet. Start participating to earn badges!</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-neutral mb-3 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : userActivity.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity</p>
                ) : (
                  userActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-neutral">
                          {formatActivityAction(activity.action)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-neutral mb-3 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Account ID: {currentUser.id}
                </p>
                <p className="text-sm text-gray-600">
                  Member since: {new Date(currentUser.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Account type: {currentUser.isAnonymous ? 'Anonymous' : 'Registered'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
