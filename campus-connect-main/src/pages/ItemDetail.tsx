import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  MessageCircle,
  ChevronDown,
  Check,
  X,
  Send,
  Upload,
  Loader2,
  LocateFixed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { LostItem, Claim } from "@/types";
import { formatDistanceToNow } from "date-fns";
import {
  getItem,
  getClaims,
  submitClaim,
  acceptClaim,
  rejectClaim,
  closeItem,
} from "@/service/fetchClaims";

// ─────────────────────────────────────────────────────────────

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, isAuthenticated } = useAuthStore();

  const [item, setItem] = useState<LostItem | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Claim Form State
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [locationPlace, setLocationPlace] = useState("");
  const [phone, setPhone] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [model, setModel] = useState("");
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [claimAttributes, setClaimAttributes] = useState<Record<string, string>>({});


  const isOwner = item?.owner_id === user?.id;


  useEffect(() => {
    if (!item?.attributes) return;
    const attr: Record<string, string> = {};
    Object.keys(item.attributes).forEach(key => (attr[key] = ""));
    setClaimAttributes(attr);
  }, [item]);


  // ───────────────────────── Fetch Data ─────────────────────────

  const loadData = async () => {
    if (!token) return;
    try {
      const response = await getItem(id!, token);
      setItem(response.item);
      const normalized = (response.claims || []).map((c: any) => ({
        ...c,
        id: c.claim_id || c._id,
        // Force lowercase
      }));
      setClaims(normalized);
      claims && console.log("Claims loaded:", claims);
      item && console.log("Item details loaded:", item);
    } catch (e) {
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, token]);

  // ─────────────────────── Claim Actions ───────────────────────

  const handleGPSFill = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
        });
      },
      () => toast({ title: "Unable to access GPS", variant: "destructive" })
    );
  };

  const handlePhotosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(Array.from(e.target.files));
  };

  const handleSubmitClaim = async () => {
    if (!locationPlace || !claimMessage) {
      toast({
        title: "Missing fields",
        description: "Location and message are required",
        variant: "destructive",
      });
      return;
    }

    setSubmittingClaim(true);
    try {
      const form = new FormData();
      form.append("item_id", id!);
      form.append("message", claimMessage);
      form.append(
        "evidence",
        JSON.stringify({
          location_found: {
            place: locationPlace,
            coordinates: [coords.lng, coords.lat],
          },
        })
      );
      form.append("attributes", JSON.stringify(claimAttributes));

      form.append("contact_info", JSON.stringify({ phone }));

      photos.forEach((file) => form.append("evidence_photos", file));

      await submitClaim(form, token);
      toast({ title: "Claim submitted!" });

      setShowClaimDialog(false);
      loadData();
    }
    catch (err: any) {
      const res = err?.response;
      const body = res ? await res.json() : null;

      toast({
        title: body?.error || "Failed to submit claim",
        variant: "destructive",
      });
    }
    finally {
      setSubmittingClaim(false);
    }
  };

  const handleAccept = async (claimId: string) => {
    try {

      await acceptClaim(id!, claimId, token);
      toast({ title: "Claim verified!" });
      loadData();
    } catch {
      toast({ title: "Failed to verify", variant: "destructive" });
    }
  };
  console.log(claims);

  const handleReject = async (claimId: string) => {
    try {
      await rejectClaim(id!, claimId, token);
      toast({ title: "Claim rejected" });
      loadData();
    } catch {
      toast({ title: "Failed to reject", variant: "destructive" });
    }
  };

  const handleCloseItem = async () => {
    try {
      await closeItem(id!, token);
      toast({ title: "Item closed!" });
      navigate("/dashboard");
    } catch {
      toast({ title: "Failed to close item", variant: "destructive" });
    }
  };

  // ────────────────────────── Render ───────────────────────────

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!item) return <div className="p-10 text-center">Item not found</div>;

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ─────────────── Item Details ─────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="mb-3 flex gap-2">
                <Badge variant="secondary">{item.category}</Badge>
                <span className="px-3 py-1 text-xs bg-success/10 rounded-full">
                  {item.status}
                </span>
              </div>
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <span className="flex gap-1 items-center">
                  <MapPin className="h-4 w-4" /> {item.location?.place}
                </span>
                <span className="flex gap-1 items-center">
                  <Clock className="h-4 w-4" />
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Photos */}
            {item.photos?.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {item.photos.map((base64: string, idx: number) => (
                  <img
                    key={idx}
                    src={`data:image/jpeg;base64,${base64}`}
                    className="rounded-xl aspect-square object-cover"
                    alt={`item-photo-${idx}`}
                  />
                ))}
              </div>
            )}


            <div className="rounded-xl border p-6">
              <h2 className="font-semibold mb-3">Description</h2>
              <p>{item.description}</p>
            </div>

            {/* ─────────────── Claims (Owner View) ─────────────── */}
            {isOwner && (
              <div className="rounded-xl border p-6">
                <h2 className="font-semibold mb-3">Claims ({claims.length})</h2>

                {/* {claims.map((claim) => (
                  <Collapsible
                    key={claim.claim_id}
                    open={expandedClaim === claim.id}
                    onOpenChange={(o) => setExpandedClaim(o ? claim.id : null)}
                  >
                    <div className="rounded-lg border bg-background p-4 mb-3">
                      <CollapsibleTrigger className="flex justify-between w-full">
                        <div className="flex gap-3 items-center">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">
                              {claim.finder?.fullName ?? claim.finder_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition ${expandedClaim === claim.id && "rotate-180"}`}
                        />
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-3 space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Message</p>
                          <p>{claim.message}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Location Found</p>
                          <p>{claim.evidence?.location_found?.place}</p>
                        </div>

                        <div className="text-md">
                          Brand: {claim.attributes?.brand} <br />
                          Color: {claim.attributes?.color} <br />
                          Model: {claim.attributes?.model}
                        </div>

                        {claim.status === "Pending" && (
                          <div className="flex gap-2">
                            <Button className="flex-1" variant="success" onClick={() => handleAccept(claim.id)}>
                              <Check className="mr-1 h-4 w-4" /> Accept
                            </Button>
                            <Button className="flex-1" variant="outline" onClick={() => handleReject(claim.id)}>
                              <X className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))} */}
                {claims.map((claim) => (
                  <Collapsible
                    key={claim.id}                                     // FIXED
                    open={expandedClaim === claim.id}
                    onOpenChange={(o) => setExpandedClaim(o ? claim.id : null)}
                  >
                    <div className="rounded-lg border bg-background p-4 mb-3">
                      <CollapsibleTrigger className="flex justify-between w-full">
                        <div className="flex gap-3 items-center">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{claim.finder?.fullName ?? claim.finder_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition ${expandedClaim === claim.id && "rotate-180"}`}
                        />
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-3 space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Message</p>
                          <p>{claim.message}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Location Found</p>
                          <p>{claim.evidence?.location_found?.place}</p>
                        </div>

                        <div className="text-md">
                          Brand: {claim.attributes?.brand} <br />
                          Color: {claim.attributes?.color} <br />
                          Model: {claim.attributes?.model}
                        </div>
                        {claim.evidence?.photos?.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            {claim.evidence.photos.map((base64: string, idx: number) => (
                              <img
                                key={idx}
                                src={`data:image/jpeg;base64,${base64}`}
                                className="rounded-xl aspect-square object-cover"
                                alt={`claim-photo-${idx}`}
                              />
                            ))}
                          </div>
                        )}

                        {claim.status === "Pending" && (           // FIXED lowercase
                          <div className="flex gap-2">
                            <Button className="flex-1" variant="success" onClick={() => handleAccept(claim.id)}>
                              <Check className="mr-1 h-4 w-4" /> Accept
                            </Button>
                            <Button className="flex-1" variant="outline" onClick={() => handleReject(claim.id)}>
                              <X className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}

              </div>
            )}
          </div>

          {/* ─────────────── Sidebar ─────────────── */}
          <div className="space-y-6">
            {/* Owner card */}
            <div className="rounded-xl border p-6">
              <p className="text-xs text-muted-foreground mb-2">Posted by</p>
              <div className="flex gap-3 items-center">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{item.owner?.fullName}</p>
                </div>
              </div>
            </div>

            {/* Reward */}
            <div className="rounded-xl border p-6 bg-token/5">
              <p className="text-xs text-muted-foreground mb-1">Reward</p>
              <p className="text-xl font-bold">{item.reward?.amount} FND</p>
            </div>

            {/* Submit Claim */}
            {isAuthenticated && !isOwner && item.status === "Open" && (
              <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <MessageCircle className="mr-2 h-4 w-4" /> Submit a Claim
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
                  <DialogHeader className="p-6 pb-3 border-b">
                    <DialogTitle>Submit Claim</DialogTitle>
                    <DialogDescription>Provide details about where you found the item</DialogDescription>
                  </DialogHeader>

                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <Label>Where did you find it?</Label>
                      <Input
                        placeholder="Example: Library stairs"
                        value={locationPlace}
                        onChange={(e) => setLocationPlace(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Latitude</Label>
                        <Input value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: e.target.value })} />
                      </div>
                      <div className="flex-1">
                        <Label>Longitude</Label>
                        <Input value={coords.lng} onChange={(e) => setCoords({ ...coords, lng: e.target.value })} />
                      </div>
                      <Button variant="outline" onClick={handleGPSFill}>
                        <LocateFixed className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Message</Label>
                      <Textarea value={claimMessage} onChange={(e) => setClaimMessage(e.target.value)} />
                    </div>

                    <div>
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
                    </div>

                    {Object.entries(item?.attributes || {}).map(([key, value]) => (
                      <div key={key}>
                        <Label>{key}</Label>
                        <Input
                          placeholder={`Example: ${value}`}
                          value={claimAttributes[key] ?? ""}
                          onChange={(e) =>
                            setClaimAttributes((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                        />
                      </div>
                    ))}


                    <div>
                      <Label>Upload Photos</Label>
                      <Input type="file" multiple onChange={handlePhotosSelect} />
                      <div className="flex gap-2 mt-2">
                        {photos.map((file, i) => (
                          <img
                            key={i}
                            src={URL.createObjectURL(file)}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleSubmitClaim} disabled={submittingClaim}>
                      {submittingClaim ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Submit Claim
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Close Item Button */}
            {isOwner &&
              claims.some((c) => c.status === "Verified") &&
              item.status !== "Closed" && (
                <Button size="lg" className="w-full" variant="success" onClick={handleCloseItem}>
                  <Check className="mr-2 h-4 w-4" /> Close Item & Transfer Reward
                </Button>
              )}

            {!isAuthenticated && (
              <div className="rounded-xl border p-4 text-center">
                <p className="mb-2 text-sm">Sign in to submit a claim</p>
                <Button asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
