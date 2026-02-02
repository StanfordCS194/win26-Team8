import { useAuth } from '../contexts/AuthContext';
import { Item } from '../App';
import { User, TrendingUp, Calendar, Target, LogOut } from 'lucide-react';

interface ProfileProps {
  items: Item[];
}

export function Profile({ items }: ProfileProps) {
  const { user, profile, signOut } = useAuth();

  // Get user's display name from multiple sources
  const getDisplayName = () => {
    // Try profile first/last name
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    
    // Try user metadata
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName;
    }
    
    // Try email (first part before @)
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  // Calculate metrics
  const totalItems = items.length;
  const timeBasedItems = items.filter(item => item.constraintType === 'time').length;
  const goalsBasedItems = items.filter(item => item.constraintType === 'goals').length;
  
  const averageConsumptionScore = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + item.consumptionScore, 0) / items.length)
    : 0;

  // Count items by difficulty
  const easyItems = items.filter(item => item.difficulty === 'easy').length;
  const mediumItems = items.filter(item => item.difficulty === 'medium').length;
  const hardItems = items.filter(item => item.difficulty === 'hard').length;

  // Recent activity
  const recentItems = [...items]
    .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
    .slice(0, 5);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      console.log('User confirmed sign out');
      try {
        console.log('Calling signOut...');
        await signOut();
        console.log('SignOut completed');
        // Force reload to ensure clean state
        window.location.reload();
      } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out. Please try again.');
      }
    } else {
      console.log('User cancelled sign out');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getDisplayName()}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Items</h3>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalItems}</p>
          <p className="text-xs text-muted-foreground mt-1">Items in reflection</p>
        </div>

        {/* Time-Based */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Time-Based</h3>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{timeBasedItems}</p>
          <p className="text-xs text-muted-foreground mt-1">Waiting constraints</p>
        </div>

        {/* Goals-Based */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Goals-Based</h3>
            <Target className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{goalsBasedItems}</p>
          <p className="text-xs text-muted-foreground mt-1">Challenge constraints</p>
        </div>

        {/* Average Score */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Avg. Score</h3>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{averageConsumptionScore}/10</p>
          <p className="text-xs text-muted-foreground mt-1">Consumption score</p>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Challenge Difficulty Breakdown</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">✨ Easy</span>
              <span className="text-sm text-muted-foreground">{easyItems} items</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${totalItems > 0 ? (easyItems / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">⚡ Medium</span>
              <span className="text-sm text-muted-foreground">{mediumItems} items</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${totalItems > 0 ? (mediumItems / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">🔥 Hard</span>
              <span className="text-sm text-muted-foreground">{hardItems} items</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${totalItems > 0 ? (hardItems / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
        {recentItems.length > 0 ? (
          <div className="space-y-3">
            {recentItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.addedDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.constraintType === 'time' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {item.constraintType === 'time' ? '⏰ Time' : '🎯 Goals'}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {item.consumptionScore}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No items yet. Start by adding your first item for reflection!</p>
          </div>
        )}
      </div>
    </div>
  );
}
