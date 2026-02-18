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
import { ArrowLeft, Upload, Image, Video, FileText, Music, DollarSign, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useVideoCompression } from "@/hooks/use-video-compression";

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
  const [compressVideo, setCompressVideo] = useState(true);

  const {
    compressVideo: compress,
    isCompressing,
    progress: compressionProgress,
    originalSize,
    compressedSize,
  } = useVideoCompression();

  const MAX_FILE_SIZE_MB = 200;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
      let fileToUpload = file;

      if (contentType !== "text" && file) {
        // Compress video if enabled
        if (contentType === "video" && compressVideo) {
          try {
            toast({ title: "Compressing video...", description: "This may take a moment depending on the file size." });
            fileToUpload = await compress(file);
            toast({
              title: "Video compressed!",
              description: `${formatSize(file.size)} → ${formatSize(fileToUpload.size)} (${Math.round((1 - fileToUpload.size / file.size) * 100)}% smaller)`,
            });
          } catch (err) {
            console.error("Compression failed, uploading original:", err);
            toast({ title: "Compression skipped", description: "Could not compress video. Uploading original file.", variant: "destructive" });
            fileToUpload = file;
          }
        }

        // Check size again after compression
        if (fileToUpload && fileToUpload.size > MAX_FILE_SIZE_BYTES) {
          toast({ title: "File still too large", description: `Even after compression, the file is ${formatSize(fileToUpload.size)}. Maximum is ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
          setSubmitting(false);
          return;
        }

        setUploadProgress(10);
        const ext = fileToUpload!.name.split(".").pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

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
          xhr.timeout = 300000;

          xhr.send(fileToUpload!);
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
                  {file && (
                    <p className="text-xs text-muted-foreground">
                      File size: {formatSize(file.size)}
                    </p>
                  )}
                </div>
              )}

              {contentType === "video" && file && (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Compress video</p>
                      <p className="text-xs text-muted-foreground">
                        Reduces file size for faster uploads
                      </p>
                    </div>
                  </div>
                  <Switch checked={compressVideo} onCheckedChange={setCompressVideo} />
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

              {isCompressing && (
                <div className="space-y-2">
                  <Progress value={compressionProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Compressing video... {compressionProgress}%
                  </p>
                </div>
              )}

              {submitting && !isCompressing && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {uploadProgress < 95 ? `Uploading... ${uploadProgress}%` : "Saving..."}
                  </p>
                </div>
              )}

              {compressedSize > 0 && !isCompressing && !submitting && (
                <p className="text-xs text-center text-primary">
                  Compressed: {formatSize(originalSize)} → {formatSize(compressedSize)} ({Math.round((1 - compressedSize / originalSize) * 100)}% smaller)
                </p>
              )}

              <Button type="submit" className="w-full" disabled={submitting || isCompressing}>
                {isCompressing ? "Compressing..." : submitting ? "Creating..." : "Create & Get Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Create;
