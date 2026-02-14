import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Sparkles, Check, AlertCircle, Loader2, Eye, RefreshCw } from "lucide-react";

import jarTemplate from "@/assets/jar-template-reference.jpg";

interface Strain {
  id: string;
  name: string;
  image_url: string | null;
}

type PreviewStatus = "idle" | "generating" | "previewing" | "publishing" | "done" | "error";

interface PreviewItem {
  strain: Strain;
  status: PreviewStatus;
  previewBase64?: string;
  publishedUrl?: string;
  error?: string;
}

export function BatchImageGenerator() {
  const [isUploading, setIsUploading] = useState(false);
  const [templateUploaded, setTemplateUploaded] = useState(false);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchStrains();
  }, []);

  const fetchStrains = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("strains")
      .select("id, name, image_url")
      .eq("is_archived", false)
      .order("name");
    setItems((data || []).map(s => ({ strain: s, status: "idle" as PreviewStatus })));
    setLoading(false);
  };

  const updateItem = (id: string, update: Partial<PreviewItem>) => {
    setItems(prev => prev.map(i => i.strain.id === id ? { ...i, ...update } : i));
  };

  const uploadTemplate = async () => {
    setIsUploading(true);
    try {
      const response = await fetch(jarTemplate);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });

      const { error } = await supabase.functions.invoke("upload-jar-template", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;

      setTemplateUploaded(true);
      toast.success("Jar template uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload jar template");
    } finally {
      setIsUploading(false);
    }
  };

  const generatePreview = async (item: PreviewItem) => {
    updateItem(item.strain.id, { status: "generating" });
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-image", {
        body: {
          productId: item.strain.id,
          productName: item.strain.name,
          originalImageUrl: item.strain.image_url,
          previewOnly: true,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      
      if (data.cached) {
        updateItem(item.strain.id, { status: "done", publishedUrl: data.imageUrl });
        return "cached";
      }
      
      updateItem(item.strain.id, { status: "previewing", previewBase64: data.imageBase64 });
      return "preview";
    } catch (err: any) {
      updateItem(item.strain.id, { status: "error", error: err.message });
      return "error";
    }
  };

  const publishImage = async (item: PreviewItem) => {
    if (!item.previewBase64) return;
    updateItem(item.strain.id, { status: "publishing" });
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-image", {
        body: {
          productId: item.strain.id,
          productName: item.strain.name,
          originalImageUrl: item.strain.image_url,
          imageBase64: item.previewBase64,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      updateItem(item.strain.id, { status: "done", publishedUrl: data.imageUrl, previewBase64: undefined });
      toast.success(`Published image for "${item.strain.name}"`);
    } catch (err: any) {
      updateItem(item.strain.id, { status: "error", error: err.message });
      toast.error(`Failed to publish "${item.strain.name}"`);
    }
  };

  const previewAll = async () => {
    setGenerating(true);
    for (const item of items) {
      if (item.status === "done" || item.status === "previewing") continue;
      await generatePreview(item);
      await new Promise(r => setTimeout(r, 2000));
    }
    toast.success("All previews generated!");
    setGenerating(false);
  };

  const publishAll = async () => {
    setGenerating(true);
    let count = 0;
    for (const item of items) {
      if (item.status !== "previewing") continue;
      await publishImage(item);
      count++;
      await new Promise(r => setTimeout(r, 500));
    }
    toast.success(`Published ${count} image${count !== 1 ? "s" : ""}`);
    setGenerating(false);
  };

  const previewCount = items.filter(i => i.status === "previewing").length;
  const doneCount = items.filter(i => i.status === "done").length;
  const progress = items.length > 0 ? ((previewCount + doneCount) / items.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Product Image Generator
        </CardTitle>
        <CardDescription>
          Generate branded 4K product images with preview before publishing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Upload Template */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h4 className="font-medium">Step 1: Upload Jar Template</h4>
            <p className="text-sm text-muted-foreground">Upload the HB branded jar template to storage</p>
          </div>
          <Button onClick={uploadTemplate} disabled={isUploading || templateUploaded} variant={templateUploaded ? "outline" : "default"} size="sm">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : templateUploaded ? <Check className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {templateUploaded ? "Uploaded" : "Upload Template"}
          </Button>
        </div>

        {/* Step 2: Generate Previews */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h4 className="font-medium">Step 2: Generate & Preview Images</h4>
            <p className="text-sm text-muted-foreground">{items.length} strains available</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={previewAll} disabled={generating} variant="outline" size="sm">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {generating ? "Generating…" : "Preview All"}
            </Button>
            {previewCount > 0 && (
              <Button onClick={publishAll} disabled={generating} size="sm">
                <Upload className="h-4 w-4 mr-2" /> Publish All ({previewCount})
              </Button>
            )}
          </div>
        </div>

        {generating && <Progress value={progress} className="h-2" />}

        {/* Results Grid */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
            {items.map(item => (
              <div key={item.strain.id} className="border rounded-lg overflow-hidden">
                {/* Image Preview */}
                <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
                  {item.previewBase64 && item.status === "previewing" ? (
                    <img src={item.previewBase64} alt={item.strain.name} className="w-full h-full object-cover" />
                  ) : item.publishedUrl && item.status === "done" ? (
                    <img src={item.publishedUrl} alt={item.strain.name} className="w-full h-full object-cover" />
                  ) : item.status === "generating" || item.status === "publishing" ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : item.status === "error" ? (
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-muted-foreground/40" />
                  )}
                  {item.status === "done" && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                {/* Info & Actions */}
                <div className="p-2 space-y-1">
                  <p className="text-sm font-medium truncate">{item.strain.name}</p>
                  <div className="flex gap-1">
                    {(!item.status || item.status === "idle" || item.status === "error") && (
                      <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => generatePreview(item)} disabled={generating}>
                        <Eye className="w-3 h-3 mr-1" /> Preview
                      </Button>
                    )}
                    {item.status === "previewing" && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => generatePreview(item)} disabled={generating}>
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                        <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => publishImage(item)} disabled={generating}>
                          <Upload className="w-3 h-3 mr-1" /> Publish
                        </Button>
                      </>
                    )}
                    {item.status === "done" && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Published
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading strains…
          </div>
        )}
      </CardContent>
    </Card>
  );
}
