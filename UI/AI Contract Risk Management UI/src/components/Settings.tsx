import { useState } from 'react';
import { Shield, FileText, Users, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { AppSettings } from '../App';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function Settings({ settings, onSave }: SettingsProps) {
  // Local draft state — only committed on Save
  const [draft, setDraft] = useState<AppSettings>({ ...settings });

  const handleSave = () => {
    onSave(draft);
    toast.success('Settings saved', {
      description: 'Your preferences have been updated.',
    });
  };

  const handleCancel = () => {
    setDraft({ ...settings }); // Revert to last saved
    toast.info('Changes discarded');
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your contract risk analysis preferences
        </p>
      </div>

      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Risk Sensitivity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <CardTitle>Risk Sensitivity</CardTitle>
                  <CardDescription>
                    Control how strictly contracts are evaluated against golden clauses
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="risk-level">Risk Assessment Level</Label>
                <Select
                  value={draft.riskLevel}
                  onValueChange={(val) => setDraft(d => ({ ...d, riskLevel: val as AppSettings['riskLevel'] }))}
                >
                  <SelectTrigger id="risk-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">Low Sensitivity</span>
                        <span className="text-xs text-muted-foreground">
                          Only flags major deviations from standards
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">Medium Sensitivity (Recommended)</span>
                        <span className="text-xs text-muted-foreground">
                          Balanced approach for most organizations
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="strict">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">Strict Sensitivity</span>
                        <span className="text-xs text-muted-foreground">
                          Flags all deviations, even minor ones
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border">
                <div className="space-y-0.5">
                  <Label>Auto-flag high-risk clauses</Label>
                  <p className="text-sm text-muted-foreground">
                    Highlight contracts with high-risk clauses on the dashboard
                  </p>
                </div>
                <Switch
                  checked={draft.autoFlag}
                  onCheckedChange={(val) => setDraft(d => ({ ...d, autoFlag: val }))}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border">
                <div className="space-y-0.5">
                  <Label>Send risk alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when high-risk contracts are uploaded
                  </p>
                </div>
                <Switch
                  checked={draft.sendAlerts}
                  onCheckedChange={(val) => setDraft(d => ({ ...d, sendAlerts: val }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Default Industry Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Default Industry Templates
                    <Badge variant="outline" className="text-xs text-muted-foreground font-normal">Stored · Coming soon</Badge>
                  </CardTitle>
                  <CardDescription>
                    Set default risk assessment templates based on industry
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-industry">Default Industry</Label>
                <Select
                  value={draft.industry}
                  onValueChange={(val) => setDraft(d => ({ ...d, industry: val }))}
                >
                  <SelectTrigger id="default-industry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance &amp; Banking</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="retail">Retail &amp; E-commerce</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-template">Default Contract Type</Label>
                <Select
                  value={draft.contractType}
                  onValueChange={(val) => setDraft(d => ({ ...d, contractType: val }))}
                >
                  <SelectTrigger id="contract-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service Agreement</SelectItem>
                    <SelectItem value="license">License Agreement</SelectItem>
                    <SelectItem value="employment">Employment Contract</SelectItem>
                    <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                    <SelectItem value="partnership">Partnership Agreement</SelectItem>
                    <SelectItem value="lease">Lease Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                ℹ️ These preferences are saved and will be passed to the analysis engine in a future update.
              </p>
            </CardContent>
          </Card>

          {/* Clause Library Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Clause Library Management</CardTitle>
                  <CardDescription>
                    Customize your organization's golden clause library
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label>Use custom clause library</Label>
                  <p className="text-sm text-muted-foreground">
                    Override default clauses with your organization's standards
                  </p>
                </div>
                <Switch
                  checked={draft.useCustomLibrary}
                  onCheckedChange={(val) => setDraft(d => ({ ...d, useCustomLibrary: val }))}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border">
                <div className="space-y-0.5">
                  <Label>Allow clause suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Let AI suggest improvements to your golden clauses
                  </p>
                </div>
                <Switch
                  checked={draft.allowSuggestions}
                  onCheckedChange={(val) => setDraft(d => ({ ...d, allowSuggestions: val }))}
                />
              </div>

              <div className="pt-3 border-t border-border">
                <Button variant="outline" className="w-full" disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  Import Custom Clause Library
                  <Badge variant="outline" className="ml-2 text-xs">Coming soon</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>User Roles &amp; Permissions</CardTitle>
                  <CardDescription>
                    Manage access levels for your team members
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Admin</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Full access to all features
                    </p>
                    <Badge variant="secondary" className="text-xs">3 users</Badge>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Reviewer</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Can review and comment on contracts
                    </p>
                    <Badge variant="secondary" className="text-xs">12 users</Badge>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Viewer</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Read-only access to reports
                    </p>
                    <Badge variant="secondary" className="text-xs">8 users</Badge>
                  </div>
                </div>

                <Button variant="outline" className="w-full" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Team Members
                  <Badge variant="outline" className="ml-2 text-xs">Coming soon</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save / Cancel */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
              Save Changes
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
