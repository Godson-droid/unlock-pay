import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Image, Video, FileText, Music, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const contentTypes = [
  { value: "image", label: "Image", icon: Image, accept: "image/*" },
  { value: "video", label: "Video", icon: Video, accept: "video/*" },
  { value: "audio", label: "Audio", icon: Music, accept: "audio/*" },
  { value: "text", label: "Text", icon: FileText, accept: "" },
];

const Create = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contentType, setContentType] = useState("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_FILE_SIZE_MB = 200;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (contentType !== "text" && file && file.size > MAX_FILE_SIZE_BYTES) {
      toast({ title: "File too large", description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let fileUrl: string | null = null;

      if (contentType !== "text" && file) {
        setUploadProgress(10);
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

        // Use XMLHttpRequest for progress tracking
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${supabaseUrl}/storage/v1/object/content/${filePath}`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("x-upsert", "false");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(Math.round((event.loaded / event.total) * 90) + 10);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: ${xhr.statusText || "Unknown error"}`));
          };
          xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
          xhr.ontimeout = () => reject(new Error("Upload timed out. Try a smaller file."));
          xhr.timeout = 300000; // 5 min timeout

          xhr.send(file);
        });

        fileUrl = filePath;
      }

      setUploadProgress(95);

      const { error } = await supabase.from("content").insert({
        user_id: user.id,
        title,
        description: description || null,
        content_type: contentType,
        file_url: fileUrl,
        text_content: contentType === "text" ? textContent : null,
        price_usd: parseFloat(price),
      });

      if (error) throw error;

      setUploadProgress(100);
      toast({ title: "Content created!", description: "Your shareable link is ready." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const selectedType = contentTypes.find((t) => t.value === contentType);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Lock New Content</CardTitle>
            <CardDescription>
              Upload content, set your price, and share the link to get paid in crypto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" /> {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Exclusive behind-the-scenes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell recipients what they're unlocking..."
                  rows={2}
                />
              </div>

              {contentType === "text" ? (
                <div className="space-y-2">
                  <Label htmlFor="textContent">Locked Text Content</Label>
                  <Textarea
                    id="textContent"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Write the content that will be revealed after payment..."
                    rows={6}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload {selectedType?.label}</Label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="file"
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Upload className="h-5 w-5" />
                      <span>{file ? file.name : `Choose ${selectedType?.label?.toLowerCase()}`}</span>
                    </label>
                    <input
                      id="file"
                      type="file"
                      accept={selectedType?.accept}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      required={contentType !== "text"}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="5.00"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Recipients pay the equivalent in cryptocurrency
                </p>
              </div>

              {submitting && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {uploadProgress < 95 ? `Uploading... ${uploadProgress}%` : "Saving..."}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Create & Get Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Create;
