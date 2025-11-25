import ScrollAnimation from "@/components/ScrollAnimation";
import { Sprout, Users, FlaskConical } from "lucide-react";

const values = [
  {
    icon: Sprout,
    title: "Superior Quality",
    description: "Every stage from cultivation through extraction to final production is meticulously managed with unwavering attention to detail. Our EU GMP-certified products meet the highest international standards, earning trust across borders.",
  },
  {
    icon: Users,
    title: "Expanding Access",
    description: "Our mission is to ensure medical cannabis reaches those who need it most. Through evidence-based advocacy and education, we are reducing barriers, challenging misconceptions, and creating pathways to safe, legal access.",
  },
  {
    icon: FlaskConical,
    title: "Research-Driven Innovation",
    description: "Collaborating with world-class research institutions including Imperial College London and University of Pennsylvania, we advance scientific knowledge of cannabis therapeutics. Research excellence is the foundation of everything we pursue.",
  },
];

const ValueProps = () => {
  return (
    <section 
      className="py-12 sm:py-16 md:py-20"
      style={{ backgroundColor: 'hsl(var(--section-color))' }}
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <ScrollAnimation>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-pharma text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 px-4" style={{ letterSpacing: '0.02em', lineHeight: '1.5' }}>
              Growing more than medicine
            </h2>
          </div>
        </ScrollAnimation>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          {values.map((value, index) => (
            <ScrollAnimation key={index} delay={index * 0.1}>
              <div 
                className="text-center group"
              >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-white/10 group-hover:bg-white/15 transition-all duration-300 group-hover:scale-110">
                  <value.icon className="w-12 h-12 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-pharma text-xl sm:text-2xl font-semibold text-white mb-4 tracking-tight">
                {value.title}
              </h3>
              <p className="font-geist text-white/80 leading-relaxed text-sm sm:text-base">
                {value.description}
              </p>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
