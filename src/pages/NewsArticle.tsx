import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, ExternalLink } from "lucide-react";
import { newsArticles } from "@/data/newsArticles";
import ScrollAnimation from "@/components/ScrollAnimation";

const NewsArticle = () => {
  const { t } = useTranslation("theWire");
  const { articleId } = useParams();
  const navigate = useNavigate();
  const article = newsArticles.find((a) => a.id === articleId);

  if (!article) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-32 pb-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="font-pharma text-4xl mb-4">{t("articleNotFound.title")}</h1>
              <p className="text-muted-foreground mb-8">
                {t("articleNotFound.description")}
              </p>
              <Button onClick={() => navigate("/the-wire")}>
                {t("articleNotFound.backButton")}
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20">
          {/* Breadcrumb */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <Link
              to="/the-wire"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-geist"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToWire")}
            </Link>
          </div>

          {/* Hero Image */}
          <ScrollAnimation>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <div className="relative h-[300px] sm:h-[400px] md:h-[500px] rounded-3xl overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className="bg-primary/90 text-primary-foreground rounded-full px-4 py-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h1 className="font-pharma text-2xl sm:text-4xl md:text-5xl text-white font-bold leading-tight max-w-4xl">
                    {article.title}
                  </h1>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Article Meta & Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              {/* Meta Info */}
              <ScrollAnimation delay={0.1}>
                <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-geist">{article.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="font-geist">{article.date}</span>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Content */}
              <ScrollAnimation delay={0.2}>
                <div className="prose prose-lg max-w-none">
                  {article.content.map((paragraph, index) => (
                    <p
                      key={index}
                      className="font-geist text-foreground/90 leading-relaxed mb-6 text-lg"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollAnimation>

              {/* Read Original */}
              <ScrollAnimation delay={0.3}>
                <div className="mt-12 pt-8 border-t border-border">
                  <Button
                    size="lg"
                    className="rounded-full gap-2"
                    onClick={() => window.open(article.externalLink, "_blank")}
                  >
                    {t("readOriginal")}
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </ScrollAnimation>

              {/* Related Articles */}
              <ScrollAnimation delay={0.4}>
                <div className="mt-16">
                  <h3 className="font-pharma text-2xl font-semibold mb-6">
                    {t("moreFromWire")}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {newsArticles
                      .filter((a) => a.id !== article.id)
                      .slice(0, 2)
                      .map((relatedArticle) => (
                        <Link
                          key={relatedArticle.id}
                          to={`/the-wire/${relatedArticle.id}`}
                          className="group flex gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                        >
                          <img
                            src={relatedArticle.image}
                            alt={relatedArticle.title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                          <div>
                            <h4 className="font-geist font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {relatedArticle.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {relatedArticle.date}
                            </p>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </main>
        <Footer />
        <BackToTop />
      </div>
    </PageTransition>
  );
};

export default NewsArticle;
