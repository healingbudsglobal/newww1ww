import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Search,
  Link as LinkIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDrGreenApi } from '@/hooks/useDrGreenApi';
import { supabase } from '@/integrations/supabase/client';

// Predefined clients - using REAL Dr. Green emails for Find & Link
const PREDEFINED_CLIENTS = [
  {
    id: 'scott',
    firstName: 'Scott',
    lastName: 'K',
    email: 'scott.k1@outlook.com',  // Real Dr. Green email
    countryCode: 'ZAF',
    phoneCode: '+27',
    phoneCountryCode: 'ZA',
    contactNumber: '0000000000',
    shipping: {
      address1: 'Address Pending',
      city: 'Cape Town',
      state: 'Western Cape',
      country: 'South Africa',
      countryCode: 'ZAF',
      postalCode: '0000',
    },
  },
  {
    id: 'kayleigh',
    firstName: 'Kayleigh',
    lastName: 'SM',
    email: 'kayliegh.sm@gmail.com',  // Real Dr. Green email (note spelling)
    countryCode: 'ZAF',
    phoneCode: '+27',
    phoneCountryCode: 'ZA',
    contactNumber: '0000000000',
    shipping: {
      address1: 'Address Pending',
      city: 'Cape Town',
      state: 'Western Cape',
      country: 'South Africa',
      countryCode: 'ZAF',
      postalCode: '0000',
    },
  },
];

interface ClientResult {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  kycLink?: string;
  isKYCVerified?: boolean;
  adminApproval?: string;
  success: boolean;
  synced?: boolean;
  error?: string;
  mode: 'found' | 'created';
}

export function AdminClientCreator() {
  const { toast } = useToast();
  const { reregisterClient, syncClientByEmail } = useDrGreenApi();
  const [creating, setCreating] = useState<string | null>(null);
  const [finding, setFinding] = useState<string | null>(null);
  const [results, setResults] = useState<ClientResult[]>([]);
  
  // Custom client form
  const [customEmail, setCustomEmail] = useState('');
  const [customFirstName, setCustomFirstName] = useState('');
  const [customLastName, setCustomLastName] = useState('');
  const [customCountry, setCustomCountry] = useState('ZAF');

  // Find & Link existing client by email
  const findAndLinkClient = async (client: typeof PREDEFINED_CLIENTS[0]) => {
    setFinding(client.id);
    
    try {
      // Get current user ID for DB persistence
      const { data: { user } } = await supabase.auth.getUser();
      const localUserId = user?.id;
      const result = await syncClientByEmail(client.email, localUserId);

      if (result.error) {
        const errorResult: ClientResult = {
          clientId: '',
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          success: false,
          error: result.error,
          mode: 'found',
        };
        setResults(prev => [...prev.filter(r => r.email !== client.email), errorResult]);
        
        toast({
          title: 'Search Failed',
          description: `Could not search for ${client.firstName}: ${result.error}`,
          variant: 'destructive',
        });
      } else if (result.data?.success && result.data?.client) {
        const foundClient = result.data.client;
        const successResult: ClientResult = {
          clientId: foundClient.id,
          firstName: foundClient.firstName,
          lastName: foundClient.lastName,
          email: foundClient.email,
          isKYCVerified: foundClient.isKYCVerified,
          adminApproval: foundClient.adminApproval,
          success: true,
          synced: result.data.synced,
          mode: 'found',
        };
        setResults(prev => [...prev.filter(r => r.email !== client.email), successResult]);
        
        toast({
          title: 'Client Found!',
          description: `${foundClient.firstName} ${foundClient.lastName} linked successfully.`,
        });
      } else {
        // Not found
        const notFoundResult: ClientResult = {
          clientId: '',
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          success: false,
          error: result.data?.message || 'Client not found in Dr. Green API',
          mode: 'found',
        };
        setResults(prev => [...prev.filter(r => r.email !== client.email), notFoundResult]);
        
        toast({
          title: 'Not Found',
          description: result.data?.message || `${client.email} not found. Try "Create New" instead.`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Find error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setFinding(null);
    }
  };

  // Create new client (existing functionality)
  const createClient = async (client: typeof PREDEFINED_CLIENTS[0]) => {
    setCreating(client.id);
    
    try {
      const result = await reregisterClient({
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        countryCode: client.countryCode,
        phoneCode: client.phoneCode,
        phoneCountryCode: client.phoneCountryCode,
        contactNumber: client.contactNumber,
        shipping: client.shipping,
      });

      if (result.error) {
        const errorResult: ClientResult = {
          clientId: '',
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          success: false,
          error: result.error,
          mode: 'created',
        };
        setResults(prev => [...prev.filter(r => r.email !== client.email), errorResult]);
        
        toast({
          title: 'Creation Failed',
          description: `Failed to create ${client.firstName}: ${result.error}`,
          variant: 'destructive',
        });
      } else if (result.data?.success) {
        const successResult: ClientResult = {
          clientId: result.data.clientId || '',
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          kycLink: result.data.kycLink,
          success: true,
          mode: 'created',
        };
        setResults(prev => [...prev.filter(r => r.email !== client.email), successResult]);
        
        toast({
          title: 'Client Created!',
          description: `${client.firstName} ${client.lastName} registered successfully.`,
        });
        
        // Copy KYC link if available
        if (result.data.kycLink) {
          navigator.clipboard.writeText(result.data.kycLink);
        }
      }
    } catch (err) {
      console.error('Creation error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setCreating(null);
    }
  };

  const createCustomClient = async () => {
    if (!customEmail || !customFirstName || !customLastName) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const customClient = {
      id: 'custom',
      firstName: customFirstName,
      lastName: customLastName,
      email: customEmail,
      countryCode: customCountry,
      phoneCode: customCountry === 'GBR' ? '+44' : '+27',
      phoneCountryCode: customCountry === 'GBR' ? 'GB' : 'ZA',
      contactNumber: '0000000000',
      shipping: {
        address1: 'Address Pending',
        city: 'City',
        state: 'State',
        country: customCountry === 'GBR' ? 'United Kingdom' : 'South Africa',
        countryCode: customCountry,
        postalCode: '0000',
      },
    };

    await createClient(customClient);
    
    // Clear form on success
    setCustomEmail('');
    setCustomFirstName('');
    setCustomLastName('');
  };

  const findAllPredefined = async () => {
    for (const client of PREDEFINED_CLIENTS) {
      await findAndLinkClient(client);
    }
  };

  const copyKycLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied!',
      description: 'KYC link copied to clipboard.',
    });
  };

  const getApprovalBadge = (approval?: string) => {
    if (!approval) return null;
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      VERIFIED: 'default',
      PENDING: 'secondary',
      REJECTED: 'destructive',
    };
    return (
      <Badge variant={variants[approval] || 'outline'} className="text-xs">
        {approval}
      </Badge>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <UserPlus className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Sync & Link Dr. Green Clients</CardTitle>
            <CardDescription>
              Find existing clients or create new ones under the current API key
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Predefined Clients with Find & Link */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Find & Link Existing Clients
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PREDEFINED_CLIENTS.map((client) => {
              const existingResult = results.find(r => r.email === client.email);
              const isLoading = finding === client.id || creating === client.id;
              
              return (
                <motion.div
                  key={client.id}
                  className="p-4 rounded-lg border bg-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{client.firstName} {client.lastName}</p>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    </div>
                    {existingResult?.success ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        {existingResult.mode === 'found' && (
                          <Badge variant="outline" className="text-xs">Linked</Badge>
                        )}
                      </div>
                    ) : existingResult?.error ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : null}
                  </div>
                  
                  {/* Status display for found clients */}
                  {existingResult?.success && existingResult.mode === 'found' && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        ID: <span className="font-mono">{existingResult.clientId.slice(0, 16)}...</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">KYC:</span>
                        <Badge variant={existingResult.isKYCVerified ? 'default' : 'secondary'} className="text-xs">
                          {existingResult.isKYCVerified ? 'Verified' : 'Pending'}
                        </Badge>
                        {getApprovalBadge(existingResult.adminApproval)}
                      </div>
                    </div>
                  )}
                  
                  {/* KYC link for created clients */}
                  {existingResult?.kycLink && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyKycLink(existingResult.kycLink!)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy KYC Link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(existingResult.kycLink, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Error display */}
                  {existingResult?.error && (
                    <p className="mt-2 text-xs text-red-500">{existingResult.error}</p>
                  )}
                  
                  {/* Action buttons */}
                  {!existingResult?.success && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => findAndLinkClient(client)}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {finding === client.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-1" />
                            Find & Link
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => createClient(client)}
                        disabled={isLoading}
                      >
                        {creating === client.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Create New
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <Button
            variant="secondary"
            onClick={findAllPredefined}
            disabled={!!finding || !!creating}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            Find & Link All Predefined Clients
          </Button>
        </div>

        {/* Custom Client Form */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-medium text-sm">Create Custom Client</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={customFirstName}
                onChange={(e) => setCustomFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={customLastName}
                onChange={(e) => setCustomLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={customCountry} onValueChange={setCustomCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZAF">South Africa</SelectItem>
                  <SelectItem value="GBR">United Kingdom</SelectItem>
                  <SelectItem value="PRT">Portugal</SelectItem>
                  <SelectItem value="THA">Thailand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={createCustomClient}
            disabled={creating === 'custom'}
            className="w-full"
          >
            {creating === 'custom' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Create Custom Client
          </Button>
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="border-t pt-6 space-y-3">
            <h4 className="font-medium text-sm">Results Summary</h4>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    result.success 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {result.firstName} {result.lastName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {result.mode === 'found' ? 'Linked' : 'Created'}
                      </Badge>
                    </div>
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {result.success && result.clientId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: <span className="font-mono">{result.clientId.slice(0, 24)}...</span>
                    </p>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
          <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">
            How this works:
          </p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• <strong>Find & Link:</strong> Searches Dr. Green API for existing clients by email</li>
            <li>• <strong>Create New:</strong> Registers a new client under current API key pair</li>
            <li>• Existing clients will be synced to local database for quick access</li>
            <li>• Admin approval must be done in Dr. Green DApp portal</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
