import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Dna, Leaf, Scissors, Microscope, Package, Truck, CheckCircle, Shield, Eye, Lock } from 'lucide-react';

interface TrackingStage {
  id: string;
  title: string;
  description: string;
  Icon: typeof Sprout;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
  details: {
    label: string;
    value: string;
  }[];
}

const BlockchainTraceability = () => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const trackingStages: TrackingStage[] = [
    {
      id: 'seed',
      title: 'Seed Registration',
      description: 'Cannabis seed registered with unique genome sequence',
      Icon: Sprout,
      status: 'completed',
      timestamp: '2024-01-15 08:30:00',
      details: [
        { label: 'Genome ID', value: '0x7A3F...B2C9' },
        { label: 'Strain', value: 'Northern Lights' },
        { label: 'Origin', value: 'Cape Town Facility' },
        { label: 'Genetics', value: 'Indica Dominant' }
      ]
    },
    {
      id: 'sequencing',
      title: 'Genome Sequencing',
      description: 'Plant DNA encrypted into blockchain key-pairs',
      Icon: Dna,
      status: 'completed',
      timestamp: '2024-01-15 09:45:00',
      details: [
        { label: 'Public Key', value: '0xA1B2...C3D4' },
        { label: 'Private Key', value: 'Secured on-chain' },
        { label: 'QR Code', value: 'Generated' },
        { label: 'Verification', value: 'Blockchain Verified' }
      ]
    },
    {
      id: 'cultivation',
      title: 'Cultivation Tracking',
      description: 'Growth cycle monitored with blockchain checkpoints',
      Icon: Leaf,
      status: 'completed',
      timestamp: '2024-02-20 14:20:00',
      details: [
        { label: 'Duration', value: '90 Days' },
        { label: 'Environment', value: 'Controlled Indoor' },
        { label: 'Checkpoints', value: '24 Verified' },
        { label: 'License', value: 'SAHPRA-2024-001' }
      ]
    },
    {
      id: 'harvest',
      title: 'Harvest & Processing',
      description: 'Product harvested and quality tested',
      Icon: Scissors,
      status: 'completed',
      timestamp: '2024-03-15 11:00:00',
      details: [
        { label: 'Batch ID', value: 'NL-2024-Q1-045' },
        { label: 'Weight', value: '2.5 kg' },
        { label: 'THC Content', value: '22.4%' },
        { label: 'CBD Content', value: '1.2%' }
      ]
    },
    {
      id: 'lab',
      title: 'Lab Testing',
      description: 'Independent lab verification and certification',
      Icon: Microscope,
      status: 'completed',
      timestamp: '2024-03-18 16:30:00',
      details: [
        { label: 'Lab', value: 'CannaSafe Analytics' },
        { label: 'Microbial', value: 'Pass' },
        { label: 'Heavy Metals', value: 'Pass' },
        { label: 'Certificate', value: 'CS-2024-0318' }
      ]
    },
    {
      id: 'packaging',
      title: 'Packaging & QR',
      description: 'Product sealed with blockchain-verified QR code',
      Icon: Package,
      status: 'active',
      timestamp: '2024-03-20 10:15:00',
      details: [
        { label: 'QR Generated', value: 'Yes' },
        { label: 'Tamper Seal', value: 'Applied' },
        { label: 'Package ID', value: 'PKG-2024-045-01' },
        { label: 'Expiry Date', value: '2025-03-20' }
      ]
    },
    {
      id: 'distribution',
      title: 'Distribution',
      description: 'Licensed partner delivery to medical dispensaries',
      Icon: Truck,
      status: 'pending',
      details: [
        { label: 'Carrier', value: 'Licensed Courier' },
        { label: 'Destination', value: 'Medical Clinic - Lisbon' },
        { label: 'ETA', value: '2024-03-22' },
        { label: 'Temperature', value: 'Monitored' }
      ]
    },
    {
      id: 'consumer',
      title: 'Consumer Verification',
      description: 'End user scans QR to verify authenticity',
      Icon: CheckCircle,
      status: 'pending',
      details: [
        { label: 'Verification', value: 'Pending' },
        { label: 'Authenticity', value: 'Blockchain Verified' },
        { label: 'Journey', value: 'Full Transparency' },
        { label: 'Anti-Spoofing', value: 'Protected' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-brand-lime-green/20 text-brand-lime-green border-brand-lime-green/40';
      case 'active':
        return 'bg-brand-deep-teal/20 text-brand-deep-teal border-brand-deep-teal/40';
      case 'pending':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const stage = selectedStage ? trackingStages.find(s => s.id === selectedStage) : null;

  return (
    <div className="w-full bg-background py-20 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <Badge className="mb-4 text-xs font-bold tracking-wider">
            BLOCKCHAIN TECHNOLOGY
          </Badge>
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
            Seed-to-Sale <span className="text-brand-deep-teal">Traceability</span>
          </h2>
          <p className="text-lg text-muted-foreground/80 leading-relaxed">
            Every product journey is immutably recorded on the blockchain with genome sequencing verification, eliminating counterfeits and ensuring complete transparency.
          </p>
        </div>

        {/* Tracking Timeline */}
        <div className="relative mb-16 max-w-6xl mx-auto">
          {/* Progress Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border/40 transform -translate-x-1/2 hidden md:block" />
          
          <div className="space-y-8">
            {trackingStages.map((stage, index) => {
              const IconComponent = stage.Icon;
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`flex items-center gap-6 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content Card */}
                    <div
                      className={`flex-1 card-linear p-6 cursor-pointer transition-all hover-lift ${
                        selectedStage === stage.id ? 'ring-2 ring-brand-deep-teal shadow-xl' : ''
                      }`}
                      onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-lime-green to-brand-deep-teal rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <IconComponent className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-foreground">{stage.title}</h3>
                          <Badge className={`text-[10px] ${getStatusColor(stage.status)}`}>
                            {stage.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground/80 mb-2">
                          {stage.description}
                        </p>
                        {stage.timestamp && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {stage.timestamp}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Node */}
                  <div className="relative z-10 hidden md:block">
                    <div
                      className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold transition-all ${
                        stage.status === 'completed'
                          ? 'bg-brand-lime-green border-brand-lime-green/20 text-white shadow-lg'
                          : stage.status === 'active'
                          ? 'bg-brand-deep-teal border-brand-deep-teal/20 text-white animate-pulse shadow-lg'
                          : 'bg-background border-border text-muted-foreground'
                      }`}
                    >
                      {stage.status === 'completed' && <CheckCircle className="w-6 h-6" />}
                      {stage.status === 'active' && <div className="w-3 h-3 rounded-full bg-white" />}
                      {stage.status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-muted-foreground" />}
                    </div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stage Details Panel */}
        <AnimatePresence mode="wait">
          {stage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <div className="card-linear p-8 bg-gradient-to-br from-brand-lime-green/5 to-brand-deep-teal/5">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-brand-lime-green to-brand-deep-teal rounded-xl flex items-center justify-center shadow-lg">
                      <stage.Icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground mb-1">
                        {stage.title}
                      </h3>
                      <p className="text-muted-foreground/80">{stage.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStage(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stage.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="card-linear p-4 hover-lift"
                    >
                      <div className="text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider mb-1">
                        {detail.label}
                      </div>
                      <div className="text-sm font-mono font-semibold text-foreground">
                        {detail.value}
                      </div>
                    </div>
                  ))}
                </div>

                {stage.id === 'sequencing' && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={() => setShowQRCode(!showQRCode)}
                      className="w-full"
                    >
                      {showQRCode ? 'Hide' : 'View'} QR Code Verification
                    </Button>
                    
                    <AnimatePresence>
                      {showQRCode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 card-linear p-6 text-center"
                        >
                          <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center mb-4">
                            {/* QR Code Placeholder */}
                            <div className="grid grid-cols-8 gap-1 p-2">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-4 h-4 ${
                                    Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground/80">
                            Scan to verify product authenticity and view complete blockchain journey
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Technology Explanation */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="card-linear p-7 hover-lift group">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-lime-green to-brand-deep-teal rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-110">
              <Lock className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">Genome Encryption</h3>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              Plant DNA is sequenced and encrypted into public/private key-pairs at the seed stage, creating an immutable genetic fingerprint on the blockchain.
            </p>
          </div>

          <div className="card-linear p-7 hover-lift group">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-lime-green to-brand-deep-teal rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-110">
              <Shield className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">Anti-Spoofing Protection</h3>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              QR codes contain encrypted genome data that can be verified against our secure servers, preventing illegal cannabis from entering the legal supply chain.
            </p>
          </div>

          <div className="card-linear p-7 hover-lift group">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-lime-green to-brand-deep-teal rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-110">
              <Eye className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">Full Transparency</h3>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              Every step from seed to consumer is recorded on-chain with timestamps, ensuring regulatory compliance and building consumer trust.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center max-w-6xl mx-auto">
          <div className="card-linear p-8 hover-lift">
            <h3 className="text-2xl font-semibold text-foreground mb-3">Experience The Future of Cannabis Traceability</h3>
            <p className="text-muted-foreground/80 mb-6 max-w-2xl mx-auto leading-relaxed">
              Our blockchain-verified system ensures every product is authentic, compliant, and traceable from seed to consumer.
            </p>
            <Button size="lg" className="gap-2">
              Learn More About Our Technology
              <span>→</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainTraceability;
