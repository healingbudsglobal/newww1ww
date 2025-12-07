import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollAnimation from "@/components/ScrollAnimation";
import BackToTop from "@/components/BackToTop";
import MobileBottomActions from "@/components/MobileBottomActions";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import greenhouseImage from "@/assets/greenhouse-rows.png";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Contact form validation schema
const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  subject: z.string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be less than 200 characters"),
  message: z.string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const { t } = useTranslation('contact');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { data: response, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        },
      });

      if (error) {
        throw error;
      }

      if (response?.success) {
        setSubmitStatus('success');
        reset();
        toast({
          title: "Message sent!",
          description: "Thank you for contacting us. We'll get back to you soon.",
        });
      } else {
        throw new Error(response?.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
      
      let errorMessage = "Something went wrong. Please try again later.";
      if (error?.message?.includes('Too many requests')) {
        errorMessage = "Too many requests. Please wait a few minutes before trying again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 lg:pb-0">
        <Header onMenuStateChange={setMenuOpen} />
      <main className="pt-28 md:pt-32">
        {/* Hero Section - Linear style */}
        <section className="bg-background py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimation>
              <div className="max-w-5xl">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
                  {t('hero.title')}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl font-light">
                  {t('hero.subtitle')}
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Hero Image */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
          <ScrollAnimation variant="scale" duration={0.8}>
            <div className="relative h-[300px] md:h-[400px] overflow-hidden rounded-xl border border-border/30">
              <img 
                src={greenhouseImage} 
                alt="Healing Buds facilities" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
            </div>
          </ScrollAnimation>
        </section>

        {/* Contact Information - Linear style */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
              {/* Contact Details */}
              <ScrollAnimation>
                <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-8 tracking-tight">
                  {t('connect.title')}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground/80 mb-12 leading-relaxed">
                  {t('connect.subtitle')}
                </p>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{t('connect.email')}</h3>
                    <p className="text-muted-foreground/80 text-sm">info@healingbuds.com</p>
                  </div>
                </div>
                </div>
              </ScrollAnimation>

              {/* Contact Form */}
              <ScrollAnimation delay={0.2}>
                <div className="card-linear p-8">
                <h3 className="text-2xl font-semibold text-foreground mb-6 tracking-tight">
                  {t('form.title')}
                </h3>
                
                {/* Success Message */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Message sent successfully!</p>
                      <p className="text-sm text-muted-foreground mt-1">We'll get back to you as soon as possible.</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Failed to send message</p>
                      <p className="text-sm text-muted-foreground mt-1">Please try again later or contact us directly.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      {t('form.name')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register('name')}
                      className={`w-full px-4 py-2.5 rounded-lg bg-background border ${
                        errors.name ? 'border-destructive' : 'border-border/40'
                      } focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200`}
                      placeholder={t('form.namePlaceholder')}
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="text-destructive text-xs mt-1.5">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      {t('form.email')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email')}
                      className={`w-full px-4 py-2.5 rounded-lg bg-background border ${
                        errors.email ? 'border-destructive' : 'border-border/40'
                      } focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200`}
                      placeholder={t('form.emailPlaceholder')}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1.5">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      {t('form.subject')} *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      {...register('subject')}
                      className={`w-full px-4 py-2.5 rounded-lg bg-background border ${
                        errors.subject ? 'border-destructive' : 'border-border/40'
                      } focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200`}
                      placeholder={t('form.subjectPlaceholder')}
                      disabled={isSubmitting}
                    />
                    {errors.subject && (
                      <p className="text-destructive text-xs mt-1.5">{errors.subject.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      {t('form.message')} *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      {...register('message')}
                      className={`w-full px-4 py-2.5 rounded-lg bg-background border ${
                        errors.message ? 'border-destructive' : 'border-border/40'
                      } focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all duration-200`}
                      placeholder={t('form.messagePlaceholder')}
                      disabled={isSubmitting}
                    />
                    {errors.message && (
                      <p className="text-destructive text-xs mt-1.5">{errors.message.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      t('form.submit')
                    )}
                  </button>
                </form>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
      <MobileBottomActions menuOpen={menuOpen} />
      </div>
    </PageTransition>
  );
};

export default Contact;
