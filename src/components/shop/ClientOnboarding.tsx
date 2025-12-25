import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  MapPin,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Clock,
  Camera,
  ShieldCheck,
  FileWarning,
  HeartPulse,
  Building2,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/context/ShopContext';

// Age calculation helper
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Valid postal code zones per country
const validPostalZones: Record<string, { pattern: RegExp; description: string }> = {
  PT: { 
    pattern: /^\d{4}(-\d{3})?$/, 
    description: 'Portuguese postal codes (e.g., 1000-001)' 
  },
  ZA: { 
    pattern: /^(0[1-9]\d{2}|1[0-8]\d{2}|19[0-5]\d|[2-9]\d{3})$/, 
    description: 'South African postal codes (0100-9999)' 
  },
  TH: { 
    pattern: /^10[0-9]{3}$/, 
    description: 'Bangkok area postal codes only (10XXX)' 
  },
  GB: { 
    pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, 
    description: 'UK postal codes (England & Wales delivery zones)' 
  },
};

// Legal minimum ages by country
const legalAgeByCountry: Record<string, number> = {
  PT: 18, // Portugal - Medical cannabis legal at 18
  GB: 18, // UK - Medical cannabis legal at 18
  ZA: 18, // South Africa - Private use legal at 18
  TH: 20, // Thailand - Legal age for cannabis is 20
  US: 21, // USA - Federal standard
};

const DEFAULT_MINIMUM_AGE = 21; // Conservative fallback

// Get minimum age for a country
const getMinimumAge = (countryCode: string): number => {
  return legalAgeByCountry[countryCode] || DEFAULT_MINIMUM_AGE;
};

// Create personal details schema with country-specific age validation
const createPersonalDetailsSchema = (countryCode: string) => {
  const minimumAge = getMinimumAge(countryCode);
  return z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name is too long'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name is too long'),
    email: z.string().email('Invalid email address').max(255, 'Email is too long'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number is too long'),
    dateOfBirth: z.string().min(1, 'Date of birth is required').refine(
      (dob) => {
        const age = calculateAge(dob);
        return age >= minimumAge;
      },
      { message: `You must be at least ${minimumAge} years old to register for medical cannabis in your region` }
    ),
    gender: z.string().min(1, 'Please select your gender'),
  });
};

// Default schema for initial form (uses conservative age)
const personalDetailsSchema = createPersonalDetailsSchema('US');

const createAddressSchema = (country: string) => z.object({
  street: z.string().min(5, 'Street address is required').max(200, 'Street address is too long'),
  city: z.string().min(2, 'City is required').max(100, 'City name is too long'),
  postalCode: z.string().min(4, 'Postal code is required').refine(
    (code) => {
      const zone = validPostalZones[country];
      if (!zone) return true; // Allow if country not in our list
      return zone.pattern.test(code.trim());
    },
    { message: 'Delivery is not available in your postal zone' }
  ),
  country: z.string().min(2, 'Country is required'),
});

const addressSchema = z.object({
  street: z.string().min(5, 'Street address is required').max(200, 'Street address is too long'),
  city: z.string().min(2, 'City is required').max(100, 'City name is too long'),
  postalCode: z.string().min(4, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

// Legacy medical history schema matching WordPress DAPP API
const medicalHistorySchema = z.object({
  medicalHistory0: z.boolean().default(false), // Heart problems
  medicalHistory1: z.boolean().default(false), // Cancer treatment
  medicalHistory2: z.boolean().default(false), // Immunosuppressants
  medicalHistory3: z.boolean().default(false), // Liver disease
  medicalHistory4: z.boolean().default(false), // Psychiatric history
  medicalHistory5: z.array(z.string()).default(['none']), // Diagnosed conditions
  medicalHistory6: z.boolean().default(false), // Suicidal history
  medicalHistory7: z.array(z.string()).default(['none']), // Family conditions
  medicalHistory9: z.boolean().default(false), // Alcohol abuse history
  medicalHistory10: z.boolean().default(false), // Drug services care history
  medicalHistory11: z.string().default('0'), // Alcohol units per week
  medicalHistory12: z.boolean().default(false), // Using cannabis to reduce other meds
  medicalHistory13: z.string().default('Never'), // How often cannabis used
  medicalHistory14: z.array(z.string()).default(['never']), // How cannabis used
  medicalHistory15: z.string().max(500).optional(), // Additional notes
  medicalHistory16: z.boolean().default(false), // Pregnant or breastfeeding
});

const medicalSchema = z.object({
  conditions: z.string().min(10, 'Please describe your medical conditions').max(2000, 'Description is too long'),
  currentMedications: z.string().max(1000, 'Text is too long').optional(),
  allergies: z.string().max(500, 'Text is too long').optional(),
  previousCannabisUse: z.boolean(),
  doctorApproval: z.boolean().refine(
    (val) => val === true,
    { message: 'Healthcare provider consultation is required for medical cannabis registration' }
  ),
  consent: z.boolean().refine((val) => val, 'You must consent to continue'),
});

// Business registration schema
const businessSchema = z.object({
  isBusiness: z.boolean().default(false),
  businessType: z.string().optional(),
  businessName: z.string().optional(),
  businessAddress1: z.string().optional(),
  businessAddress2: z.string().optional(),
  businessCity: z.string().optional(),
  businessState: z.string().optional(),
  businessCountryCode: z.string().optional(),
  businessPostalCode: z.string().optional(),
});

type PersonalDetails = z.infer<typeof personalDetailsSchema>;
type Address = z.infer<typeof addressSchema>;
type Business = z.infer<typeof businessSchema>;
type MedicalHistory = z.infer<typeof medicalHistorySchema>;
type Medical = z.infer<typeof medicalSchema>;

const steps = [
  { id: 'personal', title: 'Personal Details', icon: User },
  { id: 'address', title: 'Shipping Address', icon: MapPin },
  { id: 'business', title: 'Business Details', icon: Building2 },
  { id: 'history', title: 'Medical History', icon: HeartPulse },
  { id: 'medical', title: 'Medical Information', icon: Stethoscope },
  { id: 'complete', title: 'Complete', icon: CheckCircle2 },
];

const businessTypes = [
  { value: 'dispensary', label: 'Dispensary' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'wellness_center', label: 'Wellness Center' },
  { value: 'research', label: 'Research Institution' },
  { value: 'other', label: 'Other' },
];

const countries = [
  { code: 'PT', name: 'Portugal' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'TH', name: 'Thailand' },
  { code: 'GB', name: 'United Kingdom' },
];

// Medical history field labels for checkboxes
const medicalHistoryFields = [
  { key: 'medicalHistory0', label: 'History of heart problems', description: 'Including heart disease, arrhythmia, or heart attacks' },
  { key: 'medicalHistory1', label: 'Currently treated for cancer', description: 'Undergoing chemotherapy, radiation, or other cancer treatments' },
  { key: 'medicalHistory2', label: 'Taking immunosuppressants', description: 'Medications that suppress the immune system' },
  { key: 'medicalHistory3', label: 'History of liver disease', description: 'Including hepatitis, cirrhosis, or fatty liver' },
  { key: 'medicalHistory4', label: 'Psychiatric history', description: 'History of mental health conditions requiring treatment' },
  { key: 'medicalHistory6', label: 'History of suicidal thoughts or self-harm', description: 'Past or current suicidal ideation' },
  { key: 'medicalHistory9', label: 'History of alcohol abuse', description: 'Past or current alcohol dependency' },
  { key: 'medicalHistory10', label: 'History of drug services care', description: 'Previous treatment for substance abuse' },
  { key: 'medicalHistory12', label: 'Using cannabis to reduce other medications', description: 'Seeking to reduce reliance on other prescribed medications' },
  { key: 'medicalHistory16', label: 'Pregnant or breastfeeding', description: 'Currently pregnant or nursing' },
] as const;

const cannabisUsageOptions = [
  { value: 'Never', label: 'Never used' },
  { value: 'Rarely', label: 'Rarely (few times a year)' },
  { value: 'Occasionally', label: 'Occasionally (monthly)' },
  { value: 'Regularly', label: 'Regularly (weekly)' },
  { value: 'Daily', label: 'Daily' },
];

const cannabisMethodOptions = [
  { value: 'never', label: 'Never used' },
  { value: 'smoking', label: 'Smoking' },
  { value: 'vaping', label: 'Vaping' },
  { value: 'edibles', label: 'Edibles' },
  { value: 'oils', label: 'Oils/Tinctures' },
  { value: 'topicals', label: 'Topicals' },
];

export function ClientOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [postalError, setPostalError] = useState<string | null>(null);
  const [kycLinkReceived, setKycLinkReceived] = useState<boolean | null>(null);
  const [storedClientId, setStoredClientId] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [kycProgress, setKycProgress] = useState(0);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    personal?: PersonalDetails;
    address?: Address;
    business?: Business;
    medicalHistory?: MedicalHistory;
    medical?: Medical;
  }>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshClient } = useShop();

  const personalForm = useForm<PersonalDetails>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: formData.personal || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
    },
  });

  const addressForm = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: formData.address || {
      street: '',
      city: '',
      postalCode: '',
      country: 'PT',
    },
  });

  const businessForm = useForm<Business>({
    resolver: zodResolver(businessSchema),
    defaultValues: formData.business || {
      isBusiness: false,
      businessType: '',
      businessName: '',
      businessAddress1: '',
      businessAddress2: '',
      businessCity: '',
      businessState: '',
      businessCountryCode: '',
      businessPostalCode: '',
    },
  });

  const medicalHistoryForm = useForm<MedicalHistory>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: formData.medicalHistory || {
      medicalHistory0: false,
      medicalHistory1: false,
      medicalHistory2: false,
      medicalHistory3: false,
      medicalHistory4: false,
      medicalHistory5: ['none'],
      medicalHistory6: false,
      medicalHistory7: ['none'],
      medicalHistory9: false,
      medicalHistory10: false,
      medicalHistory11: '0',
      medicalHistory12: false,
      medicalHistory13: 'Never',
      medicalHistory14: ['never'],
      medicalHistory15: '',
      medicalHistory16: false,
    },
  });

  const medicalForm = useForm<Medical>({
    resolver: zodResolver(medicalSchema),
    defaultValues: formData.medical || {
      conditions: '',
      currentMedications: '',
      allergies: '',
      previousCannabisUse: false,
      doctorApproval: false,
      consent: false,
    },
  });

  // Watch country for age and postal code validation
  const selectedCountry = addressForm.watch('country') || 'PT';
  const minimumAge = getMinimumAge(selectedCountry);

  const handlePersonalSubmit = (data: PersonalDetails) => {
    // Double-check age validation with country-specific minimum
    const minAge = getMinimumAge(selectedCountry);
    const age = calculateAge(data.dateOfBirth);
    if (age < minAge) {
      // Redirect to Not Eligible page with context
      navigate('/not-eligible', { 
        state: { 
          reason: 'age', 
          country: countries.find(c => c.code === selectedCountry)?.name,
          minimumAge: minAge 
        } 
      });
      return;
    }
    setAgeError(null);
    setFormData((prev) => ({ ...prev, personal: data }));
    setCurrentStep(1);
  };

  const handleAddressSubmit = (data: Address) => {
    // Validate postal code against country zones
    const zone = validPostalZones[data.country];
    if (zone && !zone.pattern.test(data.postalCode.trim())) {
      // Redirect to Not Eligible page with context
      navigate('/not-eligible', { 
        state: { 
          reason: 'postal',
          country: countries.find(c => c.code === data.country)?.name
        } 
      });
      return;
    }
    setPostalError(null);
    setFormData((prev) => ({ ...prev, address: data }));
    setCurrentStep(2); // Go to Business Details step
  };

  const handleBusinessSubmit = (data: Business) => {
    setFormData((prev) => ({ ...prev, business: data }));
    setCurrentStep(3); // Go to Medical History step
  };

  const handleMedicalHistorySubmit = (data: MedicalHistory) => {
    setFormData((prev) => ({ ...prev, medicalHistory: data }));
    setCurrentStep(4); // Go to Medical Information step
  };

  const handleMedicalSubmit = async (data: Medical) => {
    setFormData((prev) => ({ ...prev, medical: data }));
    setIsSubmitting(true);
    setDocumentError(null);
    setKycStatus('verifying');
    setKycProgress(0);

    // Simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      setKycProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        clearInterval(progressInterval);
        setKycStatus('idle');
        toast({
          title: 'Authentication required',
          description: 'Please sign in to continue.',
          variant: 'destructive',
        });
        return;
      }

      // Prepare client data
      let clientId = `local-${Date.now()}`;
      let kycLink = null;
      let apiSuccess = false;

      // Try to call edge function to create client (non-blocking)
      try {
        const { data: result, error } = await supabase.functions.invoke('drgreen-proxy', {
          body: {
            action: 'create-client',
            data: {
              personal: formData.personal,
              address: formData.address,
              medicalHistory: formData.medicalHistory,
              medicalRecord: data,
            },
          },
        });

        // Handle 422 Unprocessable Entity (e.g., blurry ID)
        if (error) {
          const errorData = error as any;
          if (errorData?.context?.status === 422 || result?.errorCode === 'DOCUMENT_QUALITY') {
            clearInterval(progressInterval);
            setKycStatus('error');
            setDocumentError('document_quality');
            setIsSubmitting(false);
            return;
          }
        }

        if (!error && result?.clientId) {
          clientId = result.clientId;
          kycLink = result.kycLink || null;
          apiSuccess = true;
        }
      } catch (apiError: any) {
        // Check for 422 error in catch block
        if (apiError?.status === 422 || apiError?.message?.includes('Unprocessable')) {
          clearInterval(progressInterval);
          setKycStatus('error');
          setDocumentError('document_quality');
          setIsSubmitting(false);
          return;
        }
        // Edge function failed - continue with local client ID
        console.warn('Dr Green API unavailable, using local client ID:', apiError);
      }

      clearInterval(progressInterval);
      setKycProgress(100);

      // Store client info locally
      const { error: dbError } = await supabase.from('drgreen_clients').insert({
        user_id: user.id,
        drgreen_client_id: clientId,
        country_code: formData.address?.country || 'PT',
        is_kyc_verified: false,
        admin_approval: 'PENDING',
        kyc_link: kycLink,
      });

      if (dbError) {
        // Only show error if DB insertion fails
        throw dbError;
      }

      await refreshClient();
      setStoredClientId(clientId);
      setKycLinkReceived(!!kycLink);
      setKycStatus('success');
      setCurrentStep(5); // Go to Complete step

      // Show appropriate toast based on API success
      if (kycLink) {
        toast({
          title: 'Registration complete!',
          description: 'Check your email for next steps.',
        });
      } else if (apiSuccess) {
        toast({
          title: 'Registration saved!',
          description: "We'll email your verification link shortly.",
        });
      } else {
        toast({
          title: 'Registration saved',
          description: 'This is taking longer than expected. Your information is saved.',
        });
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setKycStatus('idle');
      console.error('Registration error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again. Contact support if the problem persists.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry submission after document quality error
  const retrySubmission = () => {
    setDocumentError(null);
    setKycStatus('idle');
    // Re-trigger submission with existing form data
    if (formData.medical) {
      handleMedicalSubmit(formData.medical);
    }
  };

  // Retry function to request verification link
  const retryKycLink = async () => {
    setIsRetrying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: result, error } = await supabase.functions.invoke('drgreen-proxy', {
        body: {
          action: 'request-kyc-link',
          data: {
            clientId: storedClientId,
            personal: formData.personal,
            address: formData.address,
          },
        },
      });

      if (!error && result?.kycLink) {
        // Update the stored KYC link
        await supabase.from('drgreen_clients')
          .update({ kyc_link: result.kycLink })
          .eq('user_id', user.id);

        setKycLinkReceived(true);
        toast({
          title: 'Verification link sent!',
          description: 'Please check your email.',
        });
      } else {
        toast({
          title: 'Still processing',
          description: 'Please contact support if the problem persists.',
        });
      }
    } catch (error) {
      console.error('Retry KYC error:', error);
      toast({
        title: 'Still processing',
        description: 'Please contact support if the problem persists.',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute h-1 bg-muted w-full rounded" />
          <motion.div
            className="absolute h-1 bg-primary rounded"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Personal Details */}
        {currentStep === 0 && (
          <motion.div
            key="personal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...personalForm}>
                  <form
                    onSubmit={personalForm.handleSubmit(handlePersonalSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={personalForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={personalForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+351 123 456 789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={personalForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                max={new Date(new Date().setFullYear(new Date().getFullYear() - minimumAge)).toISOString().split('T')[0]}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You must be at least {minimumAge} years old to register in {countries.find(c => c.code === selectedCountry)?.name || 'your region'}
                    </p>
                    {ageError && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{ageError}</span>
                      </div>
                    )}
                    <Button type="submit" className="w-full">
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Address */}
        {currentStep === 1 && (
          <motion.div
            key="address"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...addressForm}>
                  <form
                    onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={addressForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addressForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Lisbon" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="1000-001" {...field} />
                            </FormControl>
                            <FormMessage />
                            {validPostalZones[selectedCountry] && (
                              <p className="text-xs text-muted-foreground">
                                {validPostalZones[selectedCountry].description}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>
                    {postalError && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{postalError}</span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="flex-1"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Business Details (Optional) */}
        {currentStep === 2 && (
          <motion.div
            key="business"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Details
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  If you're registering on behalf of a business, please provide the details below. Otherwise, you can skip this step.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...businessForm}>
                  <form
                    onSubmit={businessForm.handleSubmit(handleBusinessSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={businessForm.control}
                      name="isBusiness"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium cursor-pointer">
                              I am registering as a business
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Select this if you're a dispensary, clinic, pharmacy, or other business
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {businessForm.watch('isBusiness') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-2"
                      >
                        <FormField
                          control={businessForm.control}
                          name="businessType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {businessTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Company Ltd" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessForm.control}
                          name="businessAddress1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Business Street" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessForm.control}
                          name="businessAddress2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2 (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Suite, Floor, Building" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={businessForm.control}
                            name="businessCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Lisbon" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={businessForm.control}
                            name="businessState"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State/Province</FormLabel>
                                <FormControl>
                                  <Input placeholder="Optional" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={businessForm.control}
                            name="businessCountryCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || formData.address?.country}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {countries.map((country) => (
                                      <SelectItem key={country.code} value={country.code}>
                                        {country.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={businessForm.control}
                            name="businessPostalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="1000-001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="flex-1"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        {businessForm.watch('isBusiness') ? 'Continue' : 'Skip & Continue'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Medical History (Legacy DAPP fields) */}
        {currentStep === 3 && (
          <motion.div
            key="medical-history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5" />
                  Medical History
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Please answer the following health screening questions honestly. This information helps us ensure your safety.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...medicalHistoryForm}>
                  <form
                    onSubmit={medicalHistoryForm.handleSubmit(handleMedicalHistorySubmit)}
                    className="space-y-6"
                  >
                    {/* Boolean checkbox fields */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Health Conditions</h4>
                      <div className="space-y-3">
                        {medicalHistoryFields.map((field) => (
                          <FormField
                            key={field.key}
                            control={medicalHistoryForm.control}
                            name={field.key as keyof MedicalHistory}
                            render={({ field: formField }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                                <FormControl>
                                  <Checkbox
                                    checked={formField.value as boolean}
                                    onCheckedChange={formField.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    {field.label}
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    {field.description}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Alcohol consumption */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Alcohol Consumption</h4>
                      <FormField
                        control={medicalHistoryForm.control}
                        name="medicalHistory11"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alcohol units per week</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select amount" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">None</SelectItem>
                                <SelectItem value="1-7">1-7 units</SelectItem>
                                <SelectItem value="8-14">8-14 units</SelectItem>
                                <SelectItem value="15-21">15-21 units</SelectItem>
                                <SelectItem value="22+">22+ units</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              1 unit = 1 small glass of wine, half pint of beer, or 1 shot
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Cannabis usage */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Cannabis Experience</h4>
                      <FormField
                        control={medicalHistoryForm.control}
                        name="medicalHistory13"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How often have you used cannabis?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cannabisUsageOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Additional notes */}
                    <FormField
                      control={medicalHistoryForm.control}
                      name="medicalHistory15"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Medical Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any other medical information you'd like to share..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="flex-1"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Medical Information */}
        {currentStep === 4 && (
          <motion.div
            key="medical"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...medicalForm}>
                  <form
                    onSubmit={medicalForm.handleSubmit(handleMedicalSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={medicalForm.control}
                      name="conditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Conditions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your medical conditions that you're seeking treatment for..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={medicalForm.control}
                      name="currentMedications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Medications (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any medications you're currently taking..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={medicalForm.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="List any known allergies..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={medicalForm.control}
                      name="previousCannabisUse"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            I have previous experience with medical cannabis
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={medicalForm.control}
                      name="doctorApproval"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-medium">
                              I have discussed medical cannabis with my healthcare provider *
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Medical consultation is required before accessing cannabis products
                            </p>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={medicalForm.control}
                      name="consent"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0 p-4 bg-muted/30 rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-normal">
                              I consent to the processing of my medical information
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Your information will be handled in accordance with GDPR
                              and medical data protection regulations.
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* KYC Verification In Progress Screen */}
        {currentStep === 4 && kycStatus === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <Card className="max-w-md w-full mx-4 bg-card/95 border-border/50">
              <CardContent className="pt-8 pb-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6"
                >
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">We're Verifying Your ID</h2>
                <p className="text-muted-foreground mb-6">
                  Please wait while we process your information. This usually takes a few moments.
                </p>
                <div className="space-y-2">
                  <Progress value={kycProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {kycProgress < 30 && 'Validating your information...'}
                    {kycProgress >= 30 && kycProgress < 60 && 'Checking eligibility...'}
                    {kycProgress >= 60 && kycProgress < 90 && 'Preparing verification link...'}
                    {kycProgress >= 90 && 'Almost done...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Document Quality Error Screen (422) */}
        {currentStep === 4 && documentError === 'document_quality' && (
          <motion.div
            key="document-error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-destructive/30">
              <CardContent className="pt-8 pb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6"
                >
                  <FileWarning className="h-10 w-10 text-destructive" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2 text-destructive">Document Issue Detected</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't process your submission. This is usually due to image quality issues.
                </p>
                
                <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Tips for a successful submission:
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Ensure your ID photo is clear and not blurry
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Use good lighting — avoid glare or shadows
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Make sure all corners of the document are visible
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Use a plain background without patterns
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={retrySubmission}
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Still having issues? Please <button onClick={() => navigate('/support')} className="text-primary underline">contact support</button> for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 6: Complete */}
        {currentStep === 5 && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 text-center">
              <CardContent className="pt-8 pb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
                
                {kycLinkReceived ? (
                  // Success state - KYC link received
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Mail className="h-5 w-5" />
                      <p className="text-muted-foreground">
                        Your verification link has been sent. Check your email to continue.
                      </p>
                    </div>
                    <Button onClick={() => navigate('/shop')}>
                      Return to Shop
                    </Button>
                  </div>
                ) : (
                  // Pending state - KYC link not received yet
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          Verification link pending
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your registration was saved successfully. We're preparing your verification link.
                      </p>
                      <Button
                        variant="outline"
                        onClick={retryKycLink}
                        disabled={isRetrying}
                        className="w-full"
                      >
                        {isRetrying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Request Verification Link
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Or check your email in the next 24 hours. If you don't receive it, please contact support.
                    </p>
                    <Button onClick={() => navigate('/shop')}>
                      Return to Shop
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
