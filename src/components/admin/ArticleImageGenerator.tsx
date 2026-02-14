import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Image, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  featured_image: string | null;
}

type GenStatus = "idle" | "generating" | "done" | "error";

export const ArticleImageGenerator = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, GenStatus>>({});
  const [generating, setGenerating] = useState(false);

  const fetchMissing = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select("id, title, slug, category, featured_image")
      .or("featured_image.is.null,featured_image.eq.")
      .order("created_at", { ascending: false });
    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMissing(); }, []);

  const generateOne = async (article: Article) => {
    setStatuses(s => ({ ...s, [article.id]: "generating" }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-article-image", {
        body: {
          articleId: article.id,
          title: article.title,
          category: article.category || "industry",
          slug: article.slug,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setStatuses(s => ({ ...s, [article.id]: "done" }));
      return true;
    } catch (err: any) {
      console.error(err);
      setStatuses(s => ({ ...s, [article.id]: "error" }));
      return false;
    }
  };

  const generateAll = async () => {
    setGenerating(true);
    let success = 0;
    for (const article of articles) {
      if (statuses[article.id] === "done") continue;
      const ok = await generateOne(article);
      if (ok) success++;
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 2000));
    }
    toast.success(`Generated ${success}/${articles.length} article images`);
    setGenerating(false);
    fetchMissing();
  };

  const doneCount = Object.values(statuses).filter(s => s === "done").length;
  const progress = articles.length > 0 ? (doneCount / articles.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Article Image Generator
        </CardTitle>
        <CardDescription>
          Generate AI editorial images for Wire articles missing featured images
        </CardDescription>
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {articles.length} article{articles.length !== 1 ? "s" : ""} missing images
              </span>
              <Button onClick={generateAll} disabled={generating}>
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                ) : (
                  "Generate All"
                )}
              </Button>
            </div>

            {generating && <Progress value={progress} className="h-2" />}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">{a.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.category || "—"}</TableCell>
                    <TableCell>
                      {statuses[a.id] === "generating" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {statuses[a.id] === "done" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {statuses[a.id] === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                      {(!statuses[a.id] || statuses[a.id] === "idle") && (
                        <Button variant="ghost" size="sm" onClick={() => generateOne(a)} disabled={generating}>
                          Generate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};
