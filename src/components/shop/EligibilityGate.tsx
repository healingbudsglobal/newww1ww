import { motion } from 'framer-motion';
import { ShieldAlert, FileCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShop } from '@/context/ShopContext';
import { Link } from 'react-router-dom';

interface EligibilityGateProps {
  children: React.ReactNode;
}

export function EligibilityGate({ children }: EligibilityGateProps) {
  const { drGreenClient, isEligible, isLoading } = useShop();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isEligible) {
    return <>{children}</>;
  }

  const steps = [
    {
      icon: FileCheck,
      title: 'Complete Registration',
      description: 'Provide your details and medical questionnaire',
      completed: !!drGreenClient,
      active: !drGreenClient,
    },
    {
      icon: ShieldAlert,
      title: 'KYC Verification',
      description: 'Verify your identity through our secure process',
      completed: drGreenClient?.is_kyc_verified ?? false,
      active: !!drGreenClient && !drGreenClient.is_kyc_verified,
    },
    {
      icon: Clock,
      title: 'Medical Review',
      description: 'Our medical team reviews your application',
      completed: drGreenClient?.admin_approval === 'VERIFIED',
      active:
        drGreenClient?.is_kyc_verified &&
        drGreenClient?.admin_approval !== 'VERIFIED',
    },
    {
      icon: CheckCircle2,
      title: 'Start Shopping',
      description: 'Access our full catalog of medical cannabis',
      completed: isEligible,
      active: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-12 px-4"
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {!drGreenClient ? 'No Medical Profile Found' : 'Medical Verification Required'}
          </CardTitle>
          <p className="text-muted-foreground">
            {!drGreenClient 
              ? 'We couldn\'t find a registered profile for your email. Please complete registration to access the dispensary.'
              : 'To purchase medical cannabis, you must complete our verification process.'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                  step.active
                    ? 'bg-primary/10 border border-primary/30'
                    : step.completed
                    ? 'bg-muted/30'
                    : 'opacity-50'
                }`}
              >
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-primary text-primary-foreground'
                      : step.active
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {step.active && (
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Action button */}
          {!drGreenClient ? (
            <Button className="w-full" size="lg" asChild>
              <Link to="/shop/register">
                Start Registration
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : drGreenClient.kyc_link && !drGreenClient.is_kyc_verified ? (
            <Button className="w-full" size="lg" asChild>
              <a href={drGreenClient.kyc_link} target="_blank" rel="noopener noreferrer">
                Complete KYC Verification
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          ) : (
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="font-medium text-foreground">Application Under Review</p>
              <p className="text-sm text-muted-foreground">
                Our medical team is reviewing your application. This typically takes 1-2 business days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
