import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/logo.png';

interface LoginScreenProps {
  onLogin: () => void;
  onBack: () => void;
}

export function LoginScreen({ onLogin, onBack }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) onLogin();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Login</h1>
      </div>

      <div className="flex-1 px-6 pt-4">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
            <img src={logo} alt="MediCare" className="relative w-14 h-14 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Medi<span className="text-primary">Care</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Welcome back!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full"
              disabled={!email || !password}
            >
              Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
