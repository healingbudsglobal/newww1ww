import { useState } from 'react';
import { ChevronDown, User, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'patient' | 'user';
  description: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'scott@healingbuds.global',
    password: 'Admin123!',
    name: 'Scott (Admin)',
    role: 'admin',
    description: 'Full admin access',
  },
  {
    email: 'scott@healingbuds.co.uk',
    password: 'Patient123!',
    name: 'Scott Cunningham',
    role: 'patient',
    description: 'UK Patient - KYC Pending',
  },
  {
    email: 'kayleigh@healingbuds.co.uk',
    password: 'Patient123!',
    name: 'Kayleigh Cunningham',
    role: 'patient',
    description: 'UK Patient - KYC Pending',
  },
  {
    email: 'test@healingbuds.co.uk',
    password: 'Test123!',
    name: 'Test User',
    role: 'user',
    description: 'Standard test account',
  },
];

interface DevQuickLoginProps {
  onSelectUser: (email: string, password: string) => void;
  disabled?: boolean;
}

export function DevQuickLogin({ onSelectUser, disabled }: DevQuickLoginProps) {
  const [open, setOpen] = useState(false);

  const getRoleIcon = (role: TestUser['role']) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'patient':
        return <User className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleBadgeColor = (role: TestUser['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'patient':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const handleSelect = (user: TestUser) => {
    onSelectUser(user.email, user.password);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
          disabled={disabled}
        >
          <Zap className="w-4 h-4 mr-2" />
          Quick Login (Dev)
          <ChevronDown className="w-4 h-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 bg-card border border-border shadow-xl z-50"
        align="center"
        sideOffset={5}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
          Test Accounts — Auto-fill & Login
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEST_USERS.map((user) => (
          <DropdownMenuItem
            key={user.email}
            className="flex flex-col items-start p-3 cursor-pointer focus:bg-primary/10"
            onSelect={() => handleSelect(user)}
          >
            <div className="flex items-center gap-2 w-full">
              {getRoleIcon(user.role)}
              <span className="font-medium text-foreground">{user.name}</span>
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded border uppercase font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground pl-6">
              <div className="flex items-center gap-2">
                <span className="text-foreground/70">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-foreground/50">Password:</span>
                <code className="bg-muted/50 px-1 rounded text-foreground/70">{user.password}</code>
              </div>
              <div className="mt-0.5 text-muted-foreground/80">{user.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2 text-[10px] text-muted-foreground text-center">
          Click to auto-fill credentials and login
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
