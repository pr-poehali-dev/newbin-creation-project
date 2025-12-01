import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Pin {
  id: number;
  title: string;
  content: string;
  author: string;
  author_id: number;
  date: string;
  views: number;
  comment_count: number;
}

interface Comment {
  id: number;
  author: string;
  author_id: number;
  content: string;
  date: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  
  const [activeTab, setActiveTab] = useState<'main' | 'create' | 'favorites'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'views' | 'newest' | 'oldest'>('newest');
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [selectedPinComments, setSelectedPinComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinContent, setNewPinContent] = useState('');
  
  const { toast } = useToast();

  const [pins, setPins] = useState<Pin[]>([]);
  const [favoritePins, setFavoritePins] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadPins();
      loadFavorites();
    }
  }, [isAuthenticated, searchQuery, sortBy]);

  const loadPins = async () => {
    setLoading(true);
    const data = await api.getPins(searchQuery, sortBy);
    if (data.pins) {
      setPins(data.pins);
    }
    setLoading(false);
  };

  const loadFavorites = async () => {
    if (currentUserId) {
      const data = await api.getFavorites(currentUserId);
      if (data.favorites) {
        setFavoritePins(data.favorites);
      }
    }
  };

  const handleAuth = async () => {
    if (!username || !password) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    const data = isLogin 
      ? await api.login(username, password)
      : await api.register(username, password);
    
    setLoading(false);

    if (data.error) {
      toast({ title: 'Error', description: data.error, variant: 'destructive' });
      return;
    }

    if (data.user_id && data.username) {
      setCurrentUser(data.username);
      setCurrentUserId(data.user_id);
      setIsAuthenticated(true);
      toast({ title: 'Success', description: `Welcome, ${data.username}!` });
    }
  };

  const handleCreatePin = async () => {
    if (!newPinTitle || !newPinContent) {
      toast({ title: 'Error', description: 'Please fill title and content', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const data = await api.createPin(newPinTitle, newPinContent, currentUserId);
    setLoading(false);

    if (data.error) {
      toast({ title: 'Error', description: data.error, variant: 'destructive' });
      return;
    }

    setNewPinTitle('');
    setNewPinContent('');
    toast({ title: 'Success', description: 'Pin created successfully!' });
    await loadPins();
    setActiveTab('main');
  };

  const handleAddComment = async () => {
    if (!newComment || !selectedPin) return;

    setLoading(true);
    const data = await api.createComment(selectedPin.id, currentUserId, newComment);
    setLoading(false);

    if (data.error) {
      toast({ title: 'Error', description: data.error, variant: 'destructive' });
      return;
    }

    setSelectedPinComments([...selectedPinComments, data]);
    setNewComment('');
    toast({ title: 'Comment added!' });
  };

  const handlePinClick = async (pin: Pin) => {
    await api.updatePinViews(pin.id);
    setSelectedPin({ ...pin, views: pin.views + 1 });
    
    const commentsData = await api.getComments(pin.id);
    if (commentsData.comments) {
      setSelectedPinComments(commentsData.comments);
    }
  };

  const toggleFavorite = async (pinId: number) => {
    if (favoritePins.includes(pinId)) {
      await api.removeFavorite(currentUserId, pinId);
      setFavoritePins(favoritePins.filter(id => id !== pinId));
    } else {
      await api.addFavorite(currentUserId, pinId);
      setFavoritePins([...favoritePins, pinId]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  const highlightSyntax = (code: string) => {
    return code
      .replace(/\b(local|function|if|then|else|end|for|while|do|return|require)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/\b(const|let|var|function|return|import|export|class|new)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/(".*?"|'.*?')/g, '<span class="text-green-400">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-yellow-400">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
      .replace(/(--.*$)/gm, '<span class="text-gray-500">$1</span>');
  };

  const favoritePinsList = pins.filter(p => favoritePins.includes(p.id));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Newbin
            </h1>
            <p className="text-muted-foreground">Professional code sharing platform</p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-input"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input"
            />
            <Button 
              onClick={handleAuth} 
              className="w-full gradient-button"
              disabled={loading}
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full"
            >
              {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Newbin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">@{currentUser}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'main' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search pins by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-input"
                />
              </div>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-input">
                  <Icon name="ArrowUpDown" size={16} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="views">Most Views</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading pins...</p>
              </div>
            ) : pins.length === 0 ? (
              <Card className="p-12 text-center">
                <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pins yet. Create the first one!</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pins.map((pin) => (
                  <Card 
                    key={pin.id} 
                    className="p-4 cursor-pointer hover:border-primary transition-all hover-scale"
                    onClick={() => handlePinClick(pin)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{pin.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(pin.id);
                        }}
                      >
                        <Icon 
                          name="Star" 
                          size={18} 
                          className={favoritePins.includes(pin.id) ? 'fill-yellow-500 text-yellow-500' : ''}
                        />
                      </Button>
                    </div>
                    <pre className="bg-input p-3 rounded text-sm overflow-x-auto mb-3">
                      <code>{pin.content.slice(0, 150)}...</code>
                    </pre>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Eye" size={14} />
                        {pin.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="MessageSquare" size={14} />
                        {pin.comment_count}
                      </span>
                      <span>by {pin.author}</span>
                      <span>{new Date(pin.date).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="p-6 space-y-4">
              <h2 className="text-2xl font-bold">Create New Pin</h2>
              <Input
                placeholder="Pin title..."
                value={newPinTitle}
                onChange={(e) => setNewPinTitle(e.target.value)}
                className="bg-input"
              />
              <Textarea
                placeholder="Paste your code here..."
                value={newPinContent}
                onChange={(e) => setNewPinContent(e.target.value)}
                className="bg-input min-h-[400px] font-mono"
              />
              <Button 
                onClick={handleCreatePin} 
                className="w-full gradient-button"
                disabled={loading}
              >
                <Icon name="Send" size={18} />
                {loading ? 'Publishing...' : 'Publish Pin'}
              </Button>
            </Card>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Favorite Pins</h2>
            {favoritePinsList.length === 0 ? (
              <Card className="p-12 text-center">
                <Icon name="Star" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No favorite pins yet</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {favoritePinsList.map((pin) => (
                  <Card 
                    key={pin.id} 
                    className="p-4 cursor-pointer hover:border-primary transition-all"
                    onClick={() => handlePinClick(pin)}
                  >
                    <h3 className="font-semibold text-lg mb-2">{pin.title}</h3>
                    <pre className="bg-input p-3 rounded text-sm overflow-x-auto mb-3">
                      <code>{pin.content.slice(0, 150)}...</code>
                    </pre>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Eye" size={14} />
                        {pin.views}
                      </span>
                      <span>by {pin.author}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={!!selectedPin} onOpenChange={() => setSelectedPin(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPin && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedPin.title}</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>by {selectedPin.author}</span>
                <span>•</span>
                <span>{new Date(selectedPin.date).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="Eye" size={14} />
                  {selectedPin.views} views
                </span>
              </div>

              <div className="relative">
                <pre className="bg-input p-4 rounded-lg overflow-x-auto">
                  <code 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSyntax(selectedPin.content) 
                    }}
                  />
                </pre>
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(selectedPin.content)}
                  >
                    <Icon name="Copy" size={14} />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const blob = new Blob([selectedPin.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    }}
                  >
                    <Icon name="FileText" size={14} />
                    RAW
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3">Comments ({selectedPinComments.length})</h3>
                <div className="space-y-3 mb-4">
                  {selectedPinComments.map((comment) => (
                    <Card key={comment.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-input"
                  />
                  <Button onClick={handleAddComment} className="gradient-button" disabled={loading}>
                    <Icon name="Send" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container mx-auto px-4 py-3 flex justify-around">
          <Button
            variant={activeTab === 'main' ? 'default' : 'ghost'}
            className={activeTab === 'main' ? 'gradient-button' : ''}
            onClick={() => setActiveTab('main')}
          >
            <Icon name="Home" size={20} />
            <span className="ml-2">Main</span>
          </Button>
          <Button
            variant={activeTab === 'create' ? 'default' : 'ghost'}
            className={activeTab === 'create' ? 'gradient-button' : ''}
            onClick={() => setActiveTab('create')}
          >
            <Icon name="Hammer" size={20} />
            <span className="ml-2">Create</span>
          </Button>
          <Button
            variant={activeTab === 'favorites' ? 'default' : 'ghost'}
            className={activeTab === 'favorites' ? 'gradient-button' : ''}
            onClick={() => setActiveTab('favorites')}
          >
            <Icon name="Star" size={20} />
            <span className="ml-2">Favorites</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
