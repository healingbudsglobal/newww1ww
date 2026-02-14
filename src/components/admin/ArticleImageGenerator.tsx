import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Image, Loader2, CheckCircle2, XCircle, Eye, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  featured_image: string | null;
}

type GenStatus = "idle" | "generating" | "previewing" | "publishing" | "done" | "error";

export const ArticleImageGenerator = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, GenStatus>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    let query = supabase
      .from("articles")
      .select("id, title, slug, category, featured_image")
      .order("created_at", { ascending: false });

    if (!showAll) {
      query = query.or("featured_image.is.null,featured_image.eq.");
    }

    const { data } = await query;
    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, [showAll]);

  const generatePreview = async (article: Article) => {
    setStatuses(s => ({ ...s, [article.id]: "generating" }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-article-image", {
        body: {
          articleId: article.id,
          title: article.title,
          category: article.category || "industry",
          slug: article.slug,
          previewOnly: true,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setPreviews(p => ({ ...p, [article.id]: data.imageBase64 }));
      setStatuses(s => ({ ...s, [article.id]: "previewing" }));
      return true;
    } catch (err: any) {
      console.error(err);
      setStatuses(s => ({ ...s, [article.id]: "error" }));
      toast.error(`Failed to generate preview for "${article.title}"`);
      return false;
    }
  };

  const publishImage = async (article: Article) => {
    const base64 = previews[article.id];
    if (!base64) return;
    setStatuses(s => ({ ...s, [article.id]: "publishing" }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-article-image", {
        body: {
          articleId: article.id,
          title: article.title,
          category: article.category || "industry",
          slug: article.slug,
          imageBase64: base64,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setStatuses(s => ({ ...s, [article.id]: "done" }));
      setPreviews(p => { const n = { ...p }; delete n[article.id]; return n; });
      // Update the article in local state with the new image
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, featured_image: data.imageUrl || a.featured_image } : a));
      toast.success(`Published image for "${article.title}"`);
    } catch (err: any) {
      console.error(err);
      setStatuses(s => ({ ...s, [article.id]: "error" }));
      toast.error(`Failed to publish image for "${article.title}"`);
    }
  };

  const previewAll = async () => {
    setGenerating(true);
    const targets = articles.filter(a => !statuses[a.id] || statuses[a.id] === "idle" || statuses[a.id] === "error");
    let success = 0;
    for (const article of targets) {
      const ok = await generatePreview(article);
      if (ok) success++;
      await new Promise(r => setTimeout(r, 2000));
    }
    toast.success(`Generated ${success} preview${success !== 1 ? "s" : ""}`);
    setGenerating(false);
  };

  const publishAll = async () => {
    setGenerating(true);
    let success = 0;
    for (const article of articles) {
      if (statuses[article.id] !== "previewing") continue;
      await publishImage(article);
      success++;
      await new Promise(r => setTimeout(r, 500));
    }
    toast.success(`Published ${success} image${success !== 1 ? "s" : ""}`);
    setGenerating(false);
    fetchArticles();
  };

  const previewCount = Object.values(statuses).filter(s => s === "previewing").length;
  const doneCount = Object.values(statuses).filter(s => s === "done").length;
  const progress = articles.length > 0 ? ((previewCount + doneCount) / articles.length) * 100 : 0;
  const missingCount = articles.filter(a => !a.featured_image).length;
  const withImageCount = articles.filter(a => !!a.featured_image).length;

  return (
    <Card className="border-[hsl(var(--admin-soft-green))]/30">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[hsl(var(--admin-fir))]/15">
              <Image className="w-5 h-5 text-[hsl(var(--admin-fir))]" />
            </div>
            <div>
              <CardTitle>Article Image Generator</CardTitle>
              <CardDescription>Generate AI editorial images with preview before publishing</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
            <Label htmlFor="show-all" className="text-sm cursor-pointer">Show all articles</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading articles…
          </div>
        ) : articles.length === 0 ? (
          <p className="text-muted-foreground">All articles have featured images ✓</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {showAll ? (
                  <>{articles.length} total ({missingCount} missing, {withImageCount} with images)</>
                ) : (
                  <>{articles.length} article{articles.length !== 1 ? "s" : ""} missing images</>
                )}
              </span>
              <div className="flex gap-2">
                <Button onClick={previewAll} disabled={generating} variant="outline" size="sm">
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-2" /> Preview All</>
                  )}
                </Button>
                {previewCount > 0 && (
                  <Button onClick={publishAll} disabled={generating} size="sm" className="bg-[hsl(var(--admin-fir))] hover:bg-[hsl(var(--admin-forest-deep))] text-white">
                    <Upload className="w-4 h-4 mr-2" /> Publish All ({previewCount})
                  </Button>
                )}
              </div>
            </div>

            {generating && <Progress value={progress} className="h-2" />}

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {articles.map(a => {
                const hasExisting = !!a.featured_image && !previews[a.id];
                return (
                  <div key={a.id} className="border border-[hsl(var(--admin-soft-green))]/20 rounded-xl p-3 space-y-2 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-3 flex-1 min-w-0">
                        {/* Existing image thumbnail */}
                        {hasExisting && (
                          <img
                            src={a.featured_image!}
                            alt=""
                            className="w-16 h-12 rounded-lg object-cover flex-shrink-0 border border-border/50"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.category || "industry"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {statuses[a.id] === "done" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {statuses[a.id] === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                        {(statuses[a.id] === "generating" || statuses[a.id] === "publishing") && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {(!statuses[a.id] || statuses[a.id] === "idle" || statuses[a.id] === "error") && (
                          <Button variant="ghost" size="sm" onClick={() => generatePreview(a)} disabled={generating}>
                            {a.featured_image ? (
                              <><RefreshCw className="w-4 h-4 mr-1" /> Regenerate</>
                            ) : (
                              <><Eye className="w-4 h-4 mr-1" /> Preview</>
                            )}
                          </Button>
                        )}
                        {statuses[a.id] === "previewing" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => generatePreview(a)} disabled={generating}>
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => publishImage(a)} disabled={generating}
                              className="bg-[hsl(var(--admin-fir))] hover:bg-[hsl(var(--admin-forest-deep))] text-white">
                              <Upload className="w-4 h-4 mr-1" /> Publish
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {previews[a.id] && statuses[a.id] === "previewing" && (
                      <div className="rounded-lg overflow-hidden border border-[hsl(var(--admin-soft-green))]/20 bg-muted/30">
                        <img src={previews[a.id]} alt={`Preview for ${a.title}`} className="w-full h-40 object-cover" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
