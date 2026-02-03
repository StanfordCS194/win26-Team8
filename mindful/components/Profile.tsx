import { useAuth } from '../contexts/AuthContext';
import { Item } from '../App';
import { User, Calendar, Target, Clock, TrendingUp } from 'lucide-react';

interface ProfileProps {
  items: Item[];
}

export function Profile({ items }: ProfileProps) {
  const { user, profile, signOut } = useAuth();

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const timeBasedItems = items.filter(item => item.constraintType === 'time');
  const goalsBasedItems = items.filter(item => item.constraintType === 'goals');
  
  const easyGoals = goalsBasedItems.filter(item => item.difficulty === 'easy').length;
  const mediumGoals = goalsBasedItems.filter(item => item.difficulty === 'medium').length;
  const hardGoals = goalsBasedItems.filter(item => item.difficulty === 'hard').length;

  const avgScore = items.length > 0
    ? (items.reduce((sum, item) => sum + item.consumptionScore, 0) / items.length).toFixed(1)
    : '0';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const recentItems = items.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-card rounded-3xl shadow-lg border border-border p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{getDisplayName()}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">Member since {memberSince}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="px-6 py-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Total Items</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{items.length}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Time-Based</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{timeBasedItems.length}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-semibold text-foreground">Goals-Based</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{goalsBasedItems.length}</p>
        </div>
      </div>

      {/* Average Score */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">Average Consumption Score</h3>
        <p className="text-4xl font-bold text-primary">{avgScore}<span className="text-2xl text-muted-foreground">/10</span></p>
      </div>

      {/* Recent Activity */}
      {recentItems.length > 0 && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/48'}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.addedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  Score: {item.consumptionScore}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
