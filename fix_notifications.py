import sys

file = r'c:\Users\vishn\Desktop\Frelance\doctors_app\instant-doctor-connect-main\instant-doctor-connect-main\src\components\screens\UserProfileScreen.tsx'

with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('function NotificationsScreen({ onBack }')
end = content.find('function HelpSupportScreen', start)

if start < 0 or end < 0:
    print('NOT FOUND', start, end)
    sys.exit(1)

new_screen = '''function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (!u) { setLoading(false); return; }
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('firebase_uid', u.uid)
        .order('created_at', { ascending: false });
      setNotifications(data ?? []);
      setLoading(false);
      await supabase.from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('firebase_uid', u.uid).eq('is_read', false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">No notifications yet</p>
          </div>
        ) : notifications.map(n => (
          <div key={n.id} className={`bg-card rounded-xl p-4 border transition-all ${n.is_read ? 'border-border/50' : 'border-primary/30 bg-primary/5'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{n.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary capitalize flex-shrink-0">{n.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'''

new_content = content[:start] + new_screen + content[end:]

with open(file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('SUCCESS')
