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
} from 'lucide-react';
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

type PersonalDetails = z.infer<typeof personalDetailsSchema>;
type Address = z.infer<typeof addressSchema>;
type Medical = z.infer<typeof medicalSchema>;

const steps = [
  { id: 'personal', title: 'Personal Details', icon: User },
  { id: 'address', title: 'Shipping Address', icon: MapPin },
  { id: 'medical', title: 'Medical Information', icon: Stethoscope },
  { id: 'complete', title: 'Complete', icon: CheckCircle2 },
];

const countries = [
  { code: 'PT', name: 'Portugal' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'TH', name: 'Thailand' },
  { code: 'GB', name: 'United Kingdom' },
];

export function ClientOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [postalError, setPostalError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    personal?: PersonalDetails;
    address?: Address;
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
    const minimumAge = getMinimumAge(selectedCountry);
    const age = calculateAge(data.dateOfBirth);
    if (age < minimumAge) {
      setAgeError(`You must be at least ${minimumAge} years old to register for medical cannabis in your region`);
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
      setPostalError(`Delivery is not available in your postal zone. ${zone.description}`);
      return;
    }
    setPostalError(null);
    setFormData((prev) => ({ ...prev, address: data }));
    setCurrentStep(2);
  };

  const handleMedicalSubmit = async (data: Medical) => {
    setFormData((prev) => ({ ...prev, medical: data }));
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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

      // Try to call edge function to create client (non-blocking)
      try {
        const { data: result, error } = await supabase.functions.invoke('drgreen-proxy', {
          body: {
            action: 'create-client',
            data: {
              personal: formData.personal,
              address: formData.address,
              medicalRecord: data,
            },
          },
        });

        if (!error && result?.clientId) {
          clientId = result.clientId;
          kycLink = result.kycLink || null;
        }
      } catch (apiError) {
        // Edge function failed - continue with local client ID
        console.warn('Dr Green API unavailable, using local client ID:', apiError);
      }

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
      setCurrentStep(3);

      toast({
        title: 'Registration submitted',
        description: 'Please complete KYC verification to continue.',
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
                          <p className="text-xs text-muted-foreground">
                            You must be at least {minimumAge} years old to register in {countries.find(c => c.code === selectedCountry)?.name || 'your region'}
                          </p>
                        </FormItem>
                      )}
                    />
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

        {/* Step 3: Medical Information */}
        {currentStep === 2 && (
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

        {/* Step 4: Complete */}
        {currentStep === 3 && (
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
                <p className="text-muted-foreground mb-6">
                  Your application is being reviewed. You'll receive an email with KYC instructions shortly.
                </p>
                <Button onClick={() => navigate('/shop')}>
                  Return to Shop
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
