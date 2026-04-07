'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    Percent,
    MapPin,
    Bell,
    ShieldCheck,
    Save,
    RefreshCcw,
    Globe,
    Lock,
    Wallet,
    Zap,
    Clock,
    Smartphone,
    Server
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    const TABS = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'financial', label: 'Financials', icon: Wallet },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
    ];

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            // toast success (if toast component exists)
        }, 1000);
    };

    return (
        <div className="pb-10">
            <Breadcrumbs />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">System Settings</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure platform-wide parameters, pricing, and integrations.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <RefreshCcw size={14} />
                        Reset Defaults
                    </Button>
                    <Button size="sm" className="h-9 gap-2 shadow-lg shadow-primary/20" onClick={handleSave} isLoading={isSaving}>
                        <Save size={14} />
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Settings Navigation */}
                <div className="lg:w-64 flex-shrink-0">
                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm p-2 sticky top-24">
                        <nav className="space-y-1">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all",
                                            activeTab === tab.id
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon size={18} className={activeTab === tab.id ? "text-primary" : "text-muted-foreground"} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="border-border shadow-sm">
                                <CardHeader className="bg-muted/10 border-b border-border/50">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} className="text-primary" />
                                        <CardTitle className="text-base font-bold">Operational Constraints</CardTitle>
                                    </div>
                                    <CardDescription className="text-[11px] font-medium uppercase tracking-wider">Configure service proximity and geography.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Maximum Service Radius</label>
                                            <div className="relative">
                                                <Input placeholder="50" defaultValue="25" className="h-11 font-bold text-sm pr-12" />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">KM</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground px-1 italic">Maximum distance between agent and customer location.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Default Search Limit</label>
                                            <Input placeholder="50" defaultValue="10" className="h-11 font-bold text-sm" />
                                            <p className="text-[10px] text-muted-foreground px-1 italic">Number of matching agents offered to user initially.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border shadow-sm overflow-hidden">
                                <CardHeader className="bg-muted/10 border-b border-border/50">
                                    <div className="flex items-center gap-2">
                                        <Zap size={18} className="text-primary" />
                                        <CardTitle className="text-base font-bold">Performance & Speed</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/5 group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Booking Expiration</p>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Automatic request timeout interval</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input defaultValue="5" className="h-8 w-16 text-center text-xs font-bold" />
                                            <span className="text-[10px] font-bold text-muted-foreground">MIN</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="border-border shadow-sm">
                                <CardHeader className="bg-muted/10 border-b border-border/50">
                                    <div className="flex items-center gap-2">
                                        <Percent size={18} className="text-primary" />
                                        <CardTitle className="text-base font-bold">Platform Monetization</CardTitle>
                                    </div>
                                    <CardDescription className="text-[11px] font-medium uppercase tracking-wider">Manage platform usage fees and agent payouts.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Primary Commission</label>
                                                <Badge variant="secondary" className="bg-primary/10 text-primary h-5 px-1.5 text-[9px] font-bold">STANDARD</Badge>
                                            </div>
                                            <div className="relative">
                                                <Input defaultValue="15" className="h-11 font-bold text-lg pr-12 text-primary" />
                                                <Percent size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40" />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">Percentage deducted from every successful booking settlement.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Platform Tax (GST)</label>
                                            <div className="relative">
                                                <Input defaultValue="18" className="h-11 font-bold text-lg pr-12" />
                                                <Percent size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">Fixed tax rate applied on top of platform commission fee.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Notify User logic for more tabs if needed */}
                    {(activeTab === 'notifications' || activeTab === 'security') && (
                        <div className="h-64 flex flex-col items-center justify-center opacity-50 space-y-4 bg-muted/20 border border-dashed border-border rounded-2xl animate-in fade-in duration-700">
                            <div className="h-14 w-14 bg-background rounded-full flex items-center justify-center border border-border shadow-sm">
                                {activeTab === 'notifications' ? <Bell size={24} className="text-muted-foreground" /> : <Lock size={24} className="text-muted-foreground" />}
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-bold text-foreground">Advanced Configuration Required</h3>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Modules under security clearance</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
