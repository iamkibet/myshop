import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    Search, 
    Plus, 
    Bell, 
    MessageSquare, 
    Settings, 
    Maximize2, 
    Flag
} from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager';
}

interface PageProps {
    auth: {
        user: User;
    };
    [key: string]: unknown;
}

export function ProfessionalHeader() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-4 sm:px-6 bg-white">
            {/* Left Section - Search */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search" 
                        className="pl-10 pr-16 w-64"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        ⌘K
                    </div>
                </div>
            </div>

            {/* Right Section - Controls and User */}
            <div className="flex items-center gap-3">
                {/* Add New Button */}
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                </Button>

                {/* Flag */}
                <Button variant="ghost" size="sm">
                    <Flag className="h-4 w-4" />
                </Button>

                {/* Fullscreen */}
                <Button variant="ghost" size="sm">
                    <Maximize2 className="h-4 w-4" />
                </Button>

                {/* Messages */}
                <Button variant="ghost" size="sm" className="relative">
                    <MessageSquare className="h-4 w-4" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs bg-red-500">
                        1
                    </Badge>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="sm">
                    <Bell className="h-4 w-4" />
                </Button>

                {/* Settings */}
                <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                </Button>

                {/* User Avatar */}
                <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                    <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
