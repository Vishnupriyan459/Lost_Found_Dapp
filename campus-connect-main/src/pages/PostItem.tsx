import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, MapPin, Coins, X, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ITEM_CATEGORIES } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { fetchBalance } from '@/service/fetchBalance';

const postItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().min(3, 'Please specify a location'),
  reward: z.number().min(1, 'Reward must be at least 1 FND').max(100, 'Maximum reward is 100 FND'),
  pickupInstructions: z.string().optional(),
});

type PostItemFormData = z.infer<typeof postItemSchema>;

export default function PostItem() {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, fndBalance,setFndBalance } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostItemFormData>({
    resolver: zodResolver(postItemSchema),
    defaultValues: { reward: 1 },
  });

  const rewardAmount = watch('reward') || 1;
  const refreshBalance = async () => {
    const data = await fetchBalance(token);
  setFndBalance(data.balance);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast({ title: 'Too many photos', description: 'You can upload up to 5 photos.', variant: 'destructive' });
      return;
    }
    setPhotos((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreviewUrls((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addAttribute = () => setAttributes((prev) => [...prev, { key: '', value: '' }]);

  const updateAttribute = (index: number, field: 'key' | 'value', value: string) =>
    setAttributes((prev) => prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)));

  const removeAttribute = (index: number) =>
    setAttributes((prev) => prev.filter((_, i) => i !== index));

  // 🔵 API Submit
  const onSubmit = async (data: PostItemFormData) => {
    if (!token) {
      toast({ title: 'Unauthorized', description: 'You must log in first.', variant: 'destructive' });
      return navigate('/login');
    }

    if (data.reward > fndBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${data.reward} FND but only have ${fndBalance} FND.`,
        variant: 'destructive',
      });
      return;
    }

    // Convert attributes → { brand:"Boat", color:"Black" }
    const attributesObj = Object.fromEntries(
      attributes.map((a) => [a.key.trim(), a.value.trim()]).filter(([k]) => k)
    );

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append(
      "location",
      JSON.stringify({
        coordinates: [80.221, 12.972], // 📌 (static for now) Replace later with user GPS
        place: data.location,
      })
    );
    formData.append("preferred_pickup_instructions", data.pickupInstructions || "");
    formData.append("reward", JSON.stringify({ amount: data.reward, currency: "FND" }));
    formData.append("attributes", JSON.stringify(attributesObj));

    // Multiple file uploads
    photos.forEach((file) => formData.append("photos", file));

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create item");

      toast({
        title: 'Item Created 🎉',
        description: `Your item is now live! ${data.reward} FND locked.`,
      });
      await refreshBalance();
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Failed to post item',
        description: error.message ?? 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 md:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Button asChild variant="ghost" className="mb-6" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Post Lost Item</h1>
          <p className="mt-2 text-muted-foreground">Describe your lost item and set a token reward</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* PHOTO UPLOAD */}
          <div className="space-y-3">
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-3">
              {photoPreviewUrls.map((url, index) => (
                <div key={index} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-5 w-5 text-background" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary hover:bg-muted">
                  <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* TITLE */}
          <div className="space-y-2">
            <Label htmlFor="title">Item Title *</Label>
            <Input id="title" placeholder="e.g., Black Boat Smartwatch" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" placeholder="Describe your item..." rows={4} {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          {/* CATEGORY + LOCATION */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Last Seen Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="location" placeholder="e.g., Library 2nd Floor" className="pl-10" {...register('location')} />
              </div>
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          {/* ATTRIBUTES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Custom Attributes</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addAttribute}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {attributes.map((attr, index) => (
                <div key={index} className="flex gap-2">
                  <Input placeholder="e.g., Brand" value={attr.key} onChange={(e) => updateAttribute(index, 'key', e.target.value)} />
                  <Input placeholder="e.g., Apple" value={attr.value} onChange={(e) => updateAttribute(index, 'value', e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAttribute(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* PICKUP INSTRUCTIONS */}
          <div className="space-y-2">
            <Label htmlFor="pickupInstructions">Pickup Instructions (optional)</Label>
            <Input id="pickupInstructions" placeholder="e.g., Meet at cafeteria" {...register('pickupInstructions')} />
          </div>

          {/* REWARD */}
          <div className="rounded-2xl border border-token/30 bg-token/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-token shadow-token">
                <Coins className="h-5 w-5 text-token-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Set Reward</h3>
                <p className="text-sm text-muted-foreground">Lock FND tokens as reward</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Input id="reward" type="number" min={1} max={100} className="w-24 text-center text-lg font-semibold" {...register('reward', { valueAsNumber: true })} />
                <span className="text-lg font-medium text-foreground">FND</span>
              </div>
              {errors.reward && <p className="text-sm text-destructive">{errors.reward.message}</p>}
              <p className="text-sm text-muted-foreground">Your balance: <span className="font-medium text-token">{fndBalance} FND</span></p>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting...</> : <>Post Item & Lock {rewardAmount} FND</>}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
