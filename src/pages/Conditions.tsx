import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollAnimation from "@/components/ScrollAnimation";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import medicalProductsImage from "@/assets/medical-products-hq.jpg";

const conditions = [
  { 
    id: "anxiety", 
    name: "Anxiety", 
    image: medicalProductsImage,
    category: "Mental Health"
  },
  { 
    id: "chronic-pain", 
    name: "Chronic Pain", 
    image: medicalProductsImage,
    category: "Pain Management"
  },
  { 
    id: "arthritis", 
    name: "Arthritis", 
    image: medicalProductsImage,
    category: "Pain Management"
  },
  { 
    id: "back-pain", 
    name: "Back Pain", 
    image: medicalProductsImage,
    category: "Pain Management"
  },
  { 
    id: "complex-regional-pain-syndrome", 
    name: "Complex Regional Pain Syndrome", 
    image: medicalProductsImage,
    category: "Pain Management"
  },
  { 
    id: "epilepsy", 
    name: "Epilepsy", 
    image: medicalProductsImage,
    category: "Neurological"
  },
  { 
    id: "insomnia", 
    name: "Insomnia", 
    image: medicalProductsImage,
    category: "Sleep Disorders"
  },
  { 
    id: "migraines", 
    name: "Migraines", 
    image: medicalProductsImage,
    category: "Pain Management"
  },
  { 
    id: "multiple-sclerosis", 
    name: "Multiple Sclerosis", 
    image: medicalProductsImage,
    category: "Neurological"
  },
  { 
    id: "neuropathic-pain", 
    name: "Neuropathic Pain", 
    image: medicalProductsImage,
    category: "Pain Management"
  },
  { 
    id: "parkinsons-disease", 
    name: "Parkinson's Disease", 
    image: medicalProductsImage,
    category: "Neurological"
  },
  { 
    id: "ptsd", 
    name: "PTSD", 
    image: medicalProductsImage,
    category: "Mental Health"
  },
];

const categories = ["All", "Pain Management", "Mental Health", "Neurological", "Sleep Disorders"];

const Conditions = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConditions = conditions.filter(condition => {
    const matchesCategory = selectedCategory === "All" || condition.category === selectedCategory;
    const matchesSearch = condition.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 md:pt-32">
          {/* Hero Section */}
          <section className="bg-background py-16 md:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollAnimation>
                <div className="max-w-5xl">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
                    Conditions
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl font-light mb-8">
                    At Healing Buds, we see patients when prescribed cannabis is an appropriate treatment option. Medical cannabis can be prescribed for a wide range of conditions where other treatments have failed.
                  </p>
                  <p className="text-lg text-muted-foreground/80 max-w-3xl font-light">
                    If your condition is not listed below, please get in touch. We may still be able to help.
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </section>

          {/* Search and Filter Section */}
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollAnimation>
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search conditions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                    />
                  </div>

                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
                          selectedCategory === category
                            ? "bg-primary text-white shadow-lg"
                            : "bg-background border border-border/40 text-foreground hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </section>

          {/* Conditions Grid */}
          <section className="py-20 md:py-32 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {filteredConditions.map((condition, index) => (
                  <ScrollAnimation key={condition.id} delay={index * 0.05} variant="scale">
                    <Link
                      to={`/conditions/${condition.id}`}
                      className="group block bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border/30"
                    >
                      <div className="h-48 overflow-hidden">
                        <img
                          src={condition.image}
                          alt={condition.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {condition.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{condition.category}</p>
                      </div>
                    </Link>
                  </ScrollAnimation>
                ))}
              </div>

              {filteredConditions.length === 0 && (
                <ScrollAnimation>
                  <div className="text-center py-16">
                    <p className="text-xl text-muted-foreground">
                      No conditions found matching your search. Please try a different search term or contact us for assistance.
                    </p>
                  </div>
                </ScrollAnimation>
              )}
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 md:py-32" style={{ backgroundColor: 'hsl(var(--section-color))' }}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollAnimation>
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6 tracking-tight">
                    Don't see your condition listed?
                  </h2>
                  <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                    We may still be able to help. Contact our team to discuss your specific condition and treatment options.
                  </p>
                  <Link to="/contact">
                    <button className="btn-linear text-white border border-white/30 hover:bg-white/10 px-8 py-3 text-lg">
                      Get in touch →
                    </button>
                  </Link>
                </div>
              </ScrollAnimation>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Conditions;
